// Generates src/css/tokens.css from tokens/figma-tokens.json.
//
// Run it from the project folder:
//   node scripts/generate-tokens.mjs
//   node scripts/generate-tokens.mjs --prefix arche      (names become --arche-greece-blue-500)
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
function exitIfProblems() {
  if (!problems.length) return;
  console.error("tokens.css was NOT written. Fix these first:\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const slug = (text) => text.toLowerCase().replace(/\s+/g, "-");

// Figma "greece/blue/500" -> "--greece-blue-500". "system/alert/500" -> "--alert-500".
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

// --------------------------------------------------- 3. role tokens (modes x Light/Dark)

// Tokens.modes looks like ["Canon Light", "Canon Dark", "Klarheit Light", ...].
// Canon is the default mode: its Light values go in :root, its Dark values in the Dark blocks.
// Every other mode gets its own blocks that list only what differs.
const DEFAULT_MODE = "Canon";
const THEMES = ["Light", "Dark"];
const modeNames = []; // ["Canon", "Klarheit", ...] in file order
for (const full of Tokens.modes) {
  const found = /^([A-Za-z]+) (Light|Dark)$/.exec(full);
  if (!found) {
    fail(`Mode "${full}" must be plain ASCII and named "<Mode> Light" or "<Mode> Dark"`);
    continue;
  }
  if (!modeNames.includes(found[1])) modeNames.push(found[1]);
}
if (!modeNames.includes(DEFAULT_MODE)) fail(`There is no "${DEFAULT_MODE}" mode`);
for (const name of modeNames) {
  for (const theme of THEMES) {
    if (!Tokens.modes.includes(`${name} ${theme}`)) fail(`Mode ${name} has no ${theme} version`);
  }
}
const otherModes = modeNames.filter((name) => name !== DEFAULT_MODE);

const roleEntries = Object.entries(Tokens.variables);
for (const [figmaName, cells] of roleEntries) {
  claim(roleName(figmaName), figmaName);

  for (const full of Tokens.modes) {
    const cell = cells[full];
    if (!cell) {
      fail(`${figmaName} has no value for ${full}`);
      continue;
    }
    if (!primitiveHex.has(cell.primitive)) {
      fail(`${figmaName} (${full}) points at unknown primitive "${cell.primitive}"`);
    } else if (primitiveHex.get(cell.primitive).toUpperCase() !== cell.hex.toUpperCase()) {
      fail(`${figmaName} (${full}) says ${cell.hex} but ${cell.primitive} is ${primitiveHex.get(cell.primitive)}`);
    }
  }

  // Status colors (Alert, Success, Warning) never change by mode.
  if (figmaName.split("/").includes("system")) {
    for (const theme of THEMES) {
      const values = new Set(modeNames.map((name) => cells[`${name} ${theme}`]?.primitive));
      if (values.size > 1) fail(`${figmaName} is a status role but differs between modes in ${theme}`);
    }
  }
}
exitIfProblems(); // the rest of this section assumes every cell exists

const value = (cells, mode, theme) => cells[`${mode} ${theme}`].primitive;
const asVar = (primitive) => `var(${primitiveName(primitive)})`;

// Canon: every role in Light, only the differing ones in Dark.
const canonLight = new Map();
const canonDark = new Map();
// Other modes: the roles whose value differs from what the page would show without the mode.
const modeLight = Object.fromEntries(otherModes.map((name) => [name, new Map()]));
const modeDark = Object.fromEntries(otherModes.map((name) => [name, new Map()]));

const lightCss = []; // Canon Light lines, grouped under section comments
let lastSection = "";
for (const [figmaName, cells] of roleEntries) {
  const name = roleName(figmaName);
  const light = value(cells, DEFAULT_MODE, "Light");
  const dark = value(cells, DEFAULT_MODE, "Dark");

  const section = figmaName.split("/")[0];
  if (section !== lastSection) {
    if (lightCss.length) lightCss.push("");
    lightCss.push(`  /* ${section} */`);
    lastSection = section;
  }
  lightCss.push(`  ${name}: ${asVar(light)};`);
  canonLight.set(name, light);
  if (dark !== light) canonDark.set(name, dark);

  for (const mode of otherModes) {
    const modeL = value(cells, mode, "Light");
    const modeD = value(cells, mode, "Dark");
    if (modeL !== light) modeLight[mode].set(name, modeL);
    // On a Dark page the mode's Light block runs after Canon's Dark block, so before the
    // mode's own Dark block the page shows the mode's Light value if it has one, else Canon's Dark value.
    const shownBefore = modeL !== light ? modeL : dark;
    if (modeD !== shownBefore) modeDark[mode].set(name, modeD);
  }
}

// Replay the cascade the way CSS will apply it and compare with Figma, for every mode and theme.
// Order of rules in the file: :root (Canon Light), Canon Dark, mode Light, mode Dark.
for (const mode of modeNames) {
  for (const theme of THEMES) {
    const shown = new Map(canonLight);
    if (theme === "Dark") for (const [k, v] of canonDark) shown.set(k, v);
    if (mode !== DEFAULT_MODE) {
      for (const [k, v] of modeLight[mode]) shown.set(k, v);
      if (theme === "Dark") for (const [k, v] of modeDark[mode]) shown.set(k, v);
    }
    for (const [figmaName, cells] of roleEntries) {
      const name = roleName(figmaName);
      const want = value(cells, mode, theme);
      if (shown.get(name) !== want) {
        fail(`${mode} ${theme}: ${name} would show ${shown.get(name)} but Figma says ${want}`);
      }
    }
  }
}

const darkCss = [...canonDark].map(([name, primitive]) => `${name}: ${asVar(primitive)};`);
const lines = (map, spaces) =>
  [...map].map(([name, primitive]) => `${" ".repeat(spaces)}${name}: ${asVar(primitive)};`).join("\n");

// One group of blocks per non-default mode.
const modeSelector = (mode) => `:root[data-mode="${slug(mode)}"]`;
const modeLightBlocks = otherModes
  .map((mode) => `${modeSelector(mode)} {\n${lines(modeLight[mode], 2)}\n}`)
  .join("\n\n");
const modeDarkBlocks = otherModes
  .filter((mode) => modeDark[mode].size)
  .map((mode) => `${modeSelector(mode)}[data-theme="dark"] {\n${lines(modeDark[mode], 2)}\n}`)
  .join("\n\n");
const modeDarkMediaBlocks = otherModes
  .filter((mode) => modeDark[mode].size)
  .map((mode) => `  ${modeSelector(mode)}:not([data-theme="light"]) {\n${lines(modeDark[mode], 4)}\n  }`)
  .join("\n\n");

const modesCss = `/* ---------- Color modes ----------
   <html data-mode="..."> picks a color mode. No data-mode means Canon.
   Light or Dark still follows data-theme or the browser setting.
   Each block lists only the roles that differ from Canon. These blocks must stay
   after Canon's Dark blocks above: same strength, so the later one wins. */
${modeLightBlocks}

${modeDarkBlocks}

@media (prefers-color-scheme: dark) {
${modeDarkMediaBlocks}
}
`;

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
  roles: roleEntries.length,
  modes: modeNames.length,
  textStyles: data.textStyles.length,
};
// Counts are read from the JSON, not fixed here. The checks above (every role has a value in
// every mode, every primitive exists, status roles never change, the cascade replays correctly)
// are what catch a bad export.
if (!counts.primitives || !counts.spacing || !counts.roles || !counts.textStyles) {
  fail(`An empty collection in the JSON: ${JSON.stringify(counts)}`);
}

exitIfProblems();

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

${modesCss}
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

// Prefix every custom property name in one place. "--greece-blue-500" becomes "--arche-greece-blue-500".
// Class names (.type-h1) are not variables and are left alone.
const output = prefix ? css.replace(/--(?=[a-z])/g, `--${prefix}-`) : css;

writeFileSync(outputPath, output);

console.log(`Wrote ${outputPath}${prefix ? ` (prefix: --${prefix}-)` : " (no prefix)"}`);
console.log(
  `  ${counts.primitives} primitives, ${counts.spacing} spacing, ${counts.roles} roles in ${counts.modes} modes ` +
    `(${modeNames.join(", ")}), ${counts.textStyles} text styles (${styles.size} styles x 3 breakpoints)`
);
for (const mode of otherModes) {
  console.log(`  ${mode}: ${modeLight[mode].size} roles differ from Canon in Light, ${modeDark[mode].size} more in Dark`);
}
