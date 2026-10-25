// Copies the system files from the portfolio project into this repo.
// Run from this folder:  npm run sync
// It only works on Curran's machine, where the folders sit side by side.
// Everyone else can ignore it: the copied files are already committed.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const brand = join(root, "..");               // personal-brand/
const site = join(brand, "my-portfolio", "src");

// Arche now owns its CSS and the token file. The portfolio's copies use unprefixed variable
// names, so syncing them would undo the --arche- prefix. Only the files below still come from the portfolio.
const copies = [
  [join(site, "assets", "js", "theme.js"), join(root, "src", "assets", "js", "theme.js")],
  [join(site, "assets", "fonts"), join(root, "src", "assets", "fonts")],
  [join(site, "assets", "icons"), join(root, "src", "assets", "icons")],
];
// Copies one file, or every file inside a folder (one level deep is all we need).
// This repo is public. The portfolio's CSS comments point at a private decision log and at a
// gated case study, so remove those pointers on the way in. Code is never changed, only comments.
function scrub(text) {
  return text
    .replace(/\s*\([^()]*\bD-\d+[^()]*\)/g, "")              // "(D-000; ...)" decision-log pointers
    .replace(/ \([A-Z]+-\d+\)/g, "")                          // "(ABC-12)" image ids, e.g. capitals, dash, number
    .replace(/\b[A-Z]{2,}-\d+\b/g, "A tall image")              // the same id written without parentheses
    .replace(/case study\/[\w-]+ \(\d+:\d+\) and its/g, "the desktop case-study layout and its") // layout path plus Figma node id
    .replace(/ \(\d+:\d+\)/g, "")                             // other Figma node ids, e.g. "(123:4567)"
    .replace(/src\/assets\/js\/gate-status\.js/g, "a small script")
    .replace(/: see open-items/g, "")
    .replace(/Figma file [A-Za-z0-9]{15,} \(/g, "Figma file (");
}

function copyPath(from, to) {
  if (statSync(from).isDirectory()) {
    mkdirSync(to, { recursive: true });
    for (const name of readdirSync(from)) copyPath(join(from, name), join(to, name));
  } else {
    mkdirSync(dirname(to), { recursive: true });
    const data = readFileSync(from);
    // write over, never delete first
    let out = data;
    if (from.endsWith(".css")) out = scrub(data.toString("utf8"));
    // The token export names the private Figma file by its key; keep only the file's name.
    if (from.endsWith("figma-tokens.json")) out = data.toString("utf8").replace(/Figma file [A-Za-z0-9]+ \(/, "Figma file (");
    writeFileSync(to, out);
  }
}
for (const [from, to] of copies) {
  copyPath(from, to);
  console.log("copied", from.replace(brand, "…"));
}
