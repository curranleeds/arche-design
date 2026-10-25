// Generates src/css/tokens.css from tokens/figma-tokens.json.
//
// Run it from the project folder:
//   node scripts/generate-tokens.mjs
//   node scripts/generate-tokens.mjs --prefix arche      (names become --arche-primary-500)
//   node scripts/generate-tokens.mjs --out some/other.css (write somewhere else, e.g. to compare)
//
// Never hand-edit tokens.css. To change a value, change it in Figma, export the
// variables to tokens/figma-tokens.json, and run this script.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const inputPath = join(root, "tokens", "figma-tokens.json");

// Options: --prefix <word> and --out <file>
const args = process.argv.slice(2);
const option = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const prefix = (option("--prefix") ?? "").replace(/^-+|-+$/g, "");
const outputPath = option("--out") ?? join(root, "src", "css", "tokens.css");

const data = JSON.parse(readFileSync(inputPath, "utf8"));
const { Primitives, Spacing, Tokens } = data.collections;

// ---------------------------------------------------------------- helpers

const problems = [];
const fail = (message) => problems.push(message);

const slug = (text) => text.toLowerCase().replace(/\s+/g, "-");

// Figma "primary/500" -> "--primary-500". "system/alert/500" -> "--alert-500".
// "neutral/black-alpha-50" -> "--black-alpha-50". Everything else: slashes to hyphens.
function primitiveName(figmaName) {
  const name = figmaName
    .replace(/^system\//, "")
    .replace(/^neutral\/(black-alpha-)/, "$1")
    .replace(/\//g, "-");
  return `--${name}`;
}

// "#000000@50%" -> "rgb(0 0 0 / 50%)". Plain hex is passed through.
function colorValue(raw) {
  const match = /^#([0-9A-Fa-f]{6})@(\d+)%$/.exec(raw);
  if (!match) return raw;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16));
  return `rgb(${r} ${g} ${b} / ${match[2]}%)`;
}

// Figma "surface/neutral/base" -> "--surface-neutral-base".
const roleName = (figmaName) => `--${figmaName.replace(/\//g, "-")}`;

const rem = (px) => `${+(px / 16).toFixed(4)}rem`;

// ------------------------------------------------------- 1. primitives

const primitiveCss = [];
const primitiveHex = new Map(); // figma name -> raw hex, for the drift check below
const cssNames = new Set();

function claim(name, source) {
  if (cssNames.has(name)) fail(`Duplicate CSS name ${name} (from ${source})`);
  cssNames.add(name);
}

let lastGroup = "";
for (const [figmaName, hex] of Object.entries(Primitives.variables)) {
  const name = primitiveName(figmaName);
  claim(name, figmaName);
  primitiveHex.set(figmaName, hex);
  const group = figmaName.split("/").slice(0, -1).join("/") || figmaName;
  if (group !== lastGroup) {
    if (primitiveCss.length) primitiveCss.push("");
    primitiveCss.push(`  /* ${group} */`);
    lastGroup = group;
  }
  primitiveCss.push(`  ${name}: ${colorValue(hex)};`);
}

// ----------------------------------------------------------- 2. spacing

const spacingCss = [];
for (const [figmaName, px] of Object.entries(Spacing.variables)) {
  // fine/4 -> --space-fine-4, base/24 -> --space-base-24, stroke/2 -> --stroke-2
  const name = figmaName.startsWith("stroke/")
    ? `--${figmaName.replace("/", "-")}`
    : `--space-${figmaName.replace("/", "-")}`;
  claim(name, figmaName);
  spacingCss.push(`  ${name}: ${px}px;`);
}

// --------------------------------------------------- 3. role tokens (Light + Dark)

const lightCss = [];
const darkCss = [];
let lastSection = "";
for (const [figmaName, modes] of Object.entries(Tokens.variables)) {
  const name = roleName(figmaName);
  claim(name, figmaName);

  for (const mode of ["light", "dark"]) {
    const { primitive, hex } = modes[mode];
    if (!primitiveHex.has(primitive)) {
      fail(`${figmaName} (${mode}) points at unknown primitive "${primitive}"`);
    } else if (primitiveHex.get(primitive).toUpperCase() !== hex.toUpperCase()) {
      fail(`${figmaName} (${mode}) says ${hex} but ${primitive} is ${primitiveHex.get(primitive)}`);
    }
  }

  const section = figmaName.split("/")[0];
  if (section !== lastSection) {
    if (lightCss.length) lightCss.push("");
    lightCss.push(`  /* ${section} */`);
    lastSection = section;
  }
  lightCss.push(`  ${name}: var(${primitiveName(modes.light.primitive)});`);

  // Dark block only lists tokens whose Dark value differs from Light.
  if (modes.dark.primitive !== modes.light.primitive) {
    darkCss.push(`${name}: var(${primitiveName(modes.dark.primitive)});`);
  }
}

// ------------------------------------------------------------ 4. text styles

const WEIGHTS = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };
const BREAKPOINTS = ["Mobile", "Tablet", "Desktop"]; // mobile first
const styles = new Map(); // key -> { font, weight, letterSpacing, textCase, sizes: {bp: [size, line]} }

for (const s of data.textStyles) {
  const [, styleName, bp] = s.name.split("/");
  if (!BREAKPOINTS.includes(bp)) {
    fail(`Text style "${s.name}" has an unknown breakpoint`);
    continue;
  }
  const key = slug(styleName);
  const family = s.font.startsWith("Archivo") ? "Archivo" : "Work Sans";
  const weight = WEIGHTS[s.font.replace(family, "").trim()];
  if (!weight) fail(`Text style "${s.name}": cannot read weight from "${s.font}"`);
  const letterSpacing = s.letterSpacing.endsWith("%")
    ? `${parseFloat(s.letterSpacing) / 100}em`
    : "0";
  const entry = styles.get(key) ?? { sizes: {} };
  Object.assign(entry, {
    family,
    weight,
    letterSpacing,
    textTransform: s.textCase === "UPPER" ? "uppercase" : "none",
  });
  entry.sizes[bp] = [s.size, s.lineHeight];
  styles.set(key, entry);
}

for (const [key, entry] of styles) {
  for (const bp of BREAKPOINTS) {
    if (!entry.sizes[bp]) fail(`Text style "${key}" has no ${bp} size`);
  }
}

const fontStack = (family) => `'${family}', sans-serif`;

const typeStaticCss = [];
const typeSizeCss = Object.fromEntries(BREAKPOINTS.map((bp) => [bp, []]));
const typeClassCss = [];
for (const [key, e] of styles) {
  typeStaticCss.push(`  --type-${key}-font: ${fontStack(e.family)};`);
  typeStaticCss.push(`  --type-${key}-weight: ${e.weight};`);
  typeStaticCss.push(`  --type-${key}-letter-spacing: ${e.letterSpacing};`);
  typeStaticCss.push(`  --type-${key}-text-transform: ${e.textTransform};`);
  for (const bp of BREAKPOINTS) {
    const [size, line] = e.sizes[bp];
    typeSizeCss[bp].push(`--type-${key}-size: ${rem(size)};`);
    typeSizeCss[bp].push(`--type-${key}-line: ${rem(line)};`);
  }
  typeClassCss.push(
    `.type-${key} {\n` +
      `  font-family: var(--type-${key}-font);\n` +
      `  font-weight: var(--type-${key}-weight);\n` +
      `  font-size: var(--type-${key}-size);\n` +
      `  line-height: var(--type-${key}-line);\n` +
      `  letter-spacing: var(--type-${key}-letter-spacing);\n` +
      `  text-transform: var(--type-${key}-text-transform);\n` +
      `}`
  );
}

// -------------------------------------------------------------- checks

const counts = {
  primitives: Object.keys(Primitives.variables).length,
  spacing: Object.keys(Spacing.variables).length,
  tokens: Object.keys(Tokens.variables).length,
  textStyles: data.textStyles.length,
};
// Expected counts. A mismatch means the export changed: check it, then update these numbers on purpose.
if (counts.primitives !== 74) fail(`Expected 74 primitives, found ${counts.primitives}`);
if (counts.spacing !== 17) fail(`Expected 17 spacing variables, found ${counts.spacing}`);
if (counts.tokens !== 99) fail(`Expected 99 role tokens, found ${counts.tokens}`);
if (counts.textStyles !== 45) fail(`Expected 45 text styles, found ${counts.textStyles}`);

if (problems.length) {
  console.error("tokens.css was NOT written. Fix these first:\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

// -------------------------------------------------------------- output

const indent = (lines, spaces) => lines.map((l) => " ".repeat(spaces) + l).join("\n");

const css = `/* ==========================================================================
   Arche Design System — Design Tokens
   GENERATED FILE. Do not hand-edit.
   Source:    tokens/figma-tokens.json
              (${data.source})
   Generator: scripts/generate-tokens.mjs
   To change a value, change it in Figma, update the JSON, and run the generator.
   ========================================================================== */

:root {
  color-scheme: light;

  /* ---------- Primitives (raw colors). Components never use these directly. ---------- */
${primitiveCss.join("\n")}

  /* ---------- Spacing and strokes ---------- */
${spacingCss.join("\n")}

  /* ---------- Role tokens, Light mode (default). Components use these. ---------- */
${lightCss.join("\n")}

  /* ---------- Focus ring ---------- */
  --focus-ring-width: var(--stroke-4);
  --focus-ring-offset: 2px;

  /* ---------- Motion: Quad ease-in-out ---------- */
  --motion-ease: cubic-bezier(0.455, 0.03, 0.515, 0.955);
  --motion-fast: 150ms;   /* hovers */
  --motion-medium: 250ms; /* accordion, nav */
  --motion-slow: 400ms;   /* menu overlay, theme switch */

  /* ---------- Type: fixed parts of each text style ---------- */
  --font-head: 'Archivo', sans-serif;
  --font-body: 'Work Sans', sans-serif;
${typeStaticCss.join("\n")}

  /* ---------- Type: sizes, Mobile (up to 767px) ---------- */
${indent(typeSizeCss.Mobile, 2)}
}

/* ---------- Type: sizes, Tablet (768px to 1023px) ---------- */
@media (min-width: 768px) {
  :root {
${indent(typeSizeCss.Tablet, 4)}
  }
}

/* ---------- Type: sizes, Desktop (1024px and up) ---------- */
@media (min-width: 1024px) {
  :root {
${indent(typeSizeCss.Desktop, 4)}
  }
}

/* ---------- Dark mode, set in two places ----------
   Only tokens whose Dark value differs from Light are listed.
   1. Manual choice: <html data-theme="dark">
   2. Browser is set to dark and no manual "light" choice was made. */
:root[data-theme="dark"] {
  color-scheme: dark;
${indent(darkCss, 2)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${indent(darkCss, 4)}
  }
}

/* ---------- Reduced motion: movement becomes an instant change ---------- */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-medium: 0ms;
    --motion-slow: 0ms;
  }
}

/* ---------- Text style classes: one per Figma text style ---------- */
${typeClassCss.join("\n")}

/* ---------- Element defaults ---------- */
body {
  margin: 0;
  background: var(--surface-neutral-base);
  color: var(--text-neutral-body);
  font-family: var(--font-body);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}
h1, h2, h3 { margin: 0; color: var(--text-neutral-primary); }
h1 { font: inherit; font-family: var(--type-h1-font); font-weight: var(--type-h1-weight); font-size: var(--type-h1-size); line-height: var(--type-h1-line); }
h2 { font: inherit; font-family: var(--type-h2-font); font-weight: var(--type-h2-weight); font-size: var(--type-h2-size); line-height: var(--type-h2-line); }
h3 { font: inherit; font-family: var(--type-h3-font); font-weight: var(--type-h3-weight); font-size: var(--type-h3-size); line-height: var(--type-h3-line); }
p { text-wrap: pretty; }
`;

// Prefix every custom property name in one place. "--primary-500" becomes "--arche-primary-500".
// Class names (.type-h1) are not variables and are left alone.
const output = prefix ? css.replace(/--(?=[a-z])/g, `--${prefix}-`) : css;

writeFileSync(outputPath, output);

console.log(`Wrote ${outputPath}${prefix ? ` (prefix: --${prefix}-)` : " (no prefix)"}`);
console.log(
  `  ${counts.primitives} primitives, ${counts.spacing} spacing, ${counts.tokens} role tokens ` +
    `(${darkCss.length} differ in Dark), ${counts.textStyles} text styles (${styles.size} styles x 3 breakpoints)`
);
