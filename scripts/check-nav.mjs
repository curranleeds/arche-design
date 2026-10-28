// Checks that every page listed in src/_data/nav.js was built.
// Run it with:  npm run check:nav   (npm run build runs it after Eleventy; it reads _site/)
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const nav = require("../src/_data/nav.js");
const out = path.resolve(import.meta.dirname, "..", "_site");

const missing = [];
let count = 0;
for (const group of nav) {
  for (const item of group.items) {
    count += 1;
    const file = path.join(out, item.url, "index.html");
    if (!existsSync(file)) missing.push(`${item.title}: ${item.url}`);
  }
}

if (missing.length) {
  console.error(`check-nav: ${missing.length} nav link(s) point at a page that was not built\n`);
  for (const m of missing) console.error(`  ${m}`);
  console.error("\nCheck the page's permalink against its url in src/_data/nav.js.");
  process.exit(1);
}
console.log(`check-nav: ok (${count} nav pages exist in _site/)`);
