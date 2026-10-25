// Checks the CSS custom properties ("CSS variables") in src/.
// Run it with:  npm run check   (npm run build runs it first)
//
// It fails if:
//   a) var(--x) refers to a name that is declared nowhere, or
//   b) any declared or used custom property does not start with --arche-.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Names set at runtime by the site that uses Arche (for example nav.js and case-study.js on the portfolio). They have fallbacks in the CSS, so they are not declared here.
const RUNTIME_NAMES = [
  "--arche-site-nav-offset",
  "--arche-lb-max",
  "--arche-lb-ratio",
];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const files = walk(join(root, "src")).filter((f) => /\.(css|njk|js)$/.test(f));

const declared = new Set();
const declaredAt = []; // [name, file]
const usedAt = []; // [name, file]

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const where = relative(root, file);
  for (const m of text.matchAll(/(?<![A-Za-z0-9_-])(--[A-Za-z0-9_-]+)\s*:/g)) {
    declared.add(m[1]);
    declaredAt.push([m[1], where]);
  }
  for (const m of text.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) usedAt.push([m[1], where]);
}

const problems = [];
const unprefixed = new Set();

for (const [name, where] of [...declaredAt, ...usedAt]) {
  if (!name.startsWith("--arche-") && !unprefixed.has(name + where)) {
    unprefixed.add(name + where);
    problems.push(`${where}: ${name} does not start with --arche-`);
  }
}

const undeclared = new Set();
for (const [name, where] of usedAt) {
  if (declared.has(name) || RUNTIME_NAMES.includes(name)) continue;
  if (undeclared.has(name + where)) continue;
  undeclared.add(name + where);
  problems.push(`${where}: var(${name}) is used but never declared`);
}

if (problems.length) {
  console.error(`check-vars: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error("  " + p);
  console.error("\nEvery custom property must start with --arche- and be declared in src/ (or be listed in RUNTIME_NAMES in scripts/check-vars.mjs).");
  process.exit(1);
}
console.log(`check-vars: ok (${declared.size} declared, ${usedAt.length} uses, ${RUNTIME_NAMES.length} runtime names allowed)`);
