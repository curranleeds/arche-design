// Accessibility check for the built docs site (the _site folder).
//
//   1. Runs axe-core on every built page, in Light and in Dark. axe is a free rule checker that reads
//      a page's code in a real browser and flags what a program can prove: WCAG 2.0, 2.1 and 2.2
//      levels A and AA, plus axe's best-practice rules.
//   2. Three keyboard checks that axe cannot do:
//        - the skip link is the first Tab stop on every page,
//        - on a phone-width screen, Tab past the last link of the open menu closes the menu,
//        - on a phone-width screen, the footer's hidden logo link cannot take focus.
//
// Run it:  npm run check:a11y     (builds the site first, then checks it)
//
// It is not part of "npm run build": it needs a browser. The first time, run: npx playwright install chromium
//
// It never changes a file. Findings listed in scripts/a11y-exceptions.json under "accepted" are not
// counted. Entries under "held" are printed as warnings on every run. Anything else fails the check.
//
// axe cannot judge everything. It does not replace a keyboard pass and a screen reader pass by hand.

import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "_site");
const exceptions = JSON.parse(readFileSync(join(root, "scripts", "a11y-exceptions.json"), "utf8"));

if (!existsSync(siteDir)) {
  console.error("check-a11y: there is no _site folder. Run: npx eleventy");
  process.exit(1);
}

let chromium, AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  ({ default: AxeBuilder } = await import("@axe-core/playwright"));
} catch {
  console.error("check-a11y: playwright and @axe-core/playwright are not installed. Run: npm install");
  process.exit(1);
}

// ---- a small local web server for _site ----
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".txt": "text/plain" };
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = resolve(siteDir, "." + path);
  if (!file.startsWith(siteDir) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}`;

// ---- every built page ----
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name === "index.html") pages.push("/" + relative(siteDir, dir).split("\\").join("/") + (dir === siteDir ? "" : "/"));
  }
})(siteDir);
pages.sort();

const matches = (entry, url, target) =>
  entry.pages.some((p) => (p.endsWith("*") ? url.startsWith(p.slice(0, -1)) : url === p)) &&
  (!entry.targets || entry.targets.some((t) => target.includes(t)));

const problems = [];
const accepted = {};
const held = {};
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.error("check-a11y: the browser is not installed. Run: npx playwright install chromium");
  server.close();
  process.exit(1);
}

// ---- 1. axe on every page, Light and Dark ----
let runs = 0;
let toReview = 0;
for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
  await context.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch (e) {} }, theme);
  for (const url of pages) {
    const page = await context.newPage();
    await page.goto(base + url, { waitUntil: "networkidle" });
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    runs++;
    toReview += result.incomplete.length;
    for (const violation of result.violations) {
      for (const node of violation.nodes) {
        const target = node.target.join(" ");
        const key = `${violation.id} ${url}`;
        const accept = exceptions.accepted.find((e) => e.rule === violation.id && matches(e, url, target));
        const hold = exceptions.held.find((e) => e.rule === violation.id && matches(e, url, target));
        if (accept) accepted[key] = accept.reason;
        else if (hold) held[key] = hold.reason;
        else problems.push(`${theme} ${url}: ${violation.id} (${violation.impact}) at ${target}: ${violation.help}`);
      }
    }
    await page.close();
  }
  await context.close();
}

// ---- 2. keyboard checks ----
const docPages = pages.filter((url) => !url.startsWith("/previews/"));
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  for (const url of docPages) {
    await page.goto(base + url, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement.className);
    if (!String(first).includes("skip-link")) problems.push(`${url}: the first Tab stop is not the skip link`);
  }
  await context.close();
}
{
  const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await context.newPage();
  await page.goto(base + "/components/button/", { waitUntil: "networkidle" });
  await page.locator("[data-menu-button]").focus();
  await page.keyboard.press("Enter");
  let left = false;
  for (let i = 0; i < 60 && !left; i++) {
    await page.keyboard.press("Tab");
    left = await page.evaluate(() => !document.querySelector("[data-menu]").contains(document.activeElement));
  }
  const stillOpen = await page.evaluate(() => document.querySelector("[data-menu]").classList.contains("is-open"));
  if (!left || stillOpen) problems.push("menu: Tab past the last link of the open menu did not close it (focus would sit behind the panel)");

  await page.goto(base + "/components/site-footer/", { waitUntil: "networkidle" });
  let onHome = false;
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement.classList.contains("site-footer__home"))) onHome = true;
  }
  if (onHome) problems.push("footer: the hidden logo link can take focus below 1024px");
  await context.close();
}
await browser.close();
server.close();

// ---- report ----
console.log(`check-a11y: ${runs} page runs (${pages.length} pages, Light and Dark) and 3 keyboard checks`);
console.log(`  accepted exceptions in use: ${Object.keys(accepted).length}`);
for (const [key, reason] of Object.entries(held)) console.log(`  HELD (warning): ${key}: ${reason}`);
if (toReview) console.log(`  ${toReview} readings axe could not decide: check those by hand.`);
if (problems.length) {
  console.error(`\ncheck-a11y: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log("check-a11y: ok");
