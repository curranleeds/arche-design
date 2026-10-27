// Checks the color roles in every mode, Light and Dark.
//
//   1. Every role has a value in every mode, and tokens.css declares every role.
//   2. Each text/background pair below meets WCAG AA: 4.5:1 for text, 3:1 for large
//      text and non-text marks such as a rule.
//
// Run it:  node scripts/check-contrast.mjs        (also runs as part of "npm run build")
//          node scripts/check-contrast.mjs --all  (print every ratio, not only failures)
//
// It never changes a color. If a pair fails, change the color in Figma, update
// tokens/figma-tokens.json, and run the generator again.
//
// Disabled states are left out on purpose: WCAG does not ask them to meet contrast.
// A pair that is not meant to be used in one mode goes in scripts/contrast-exceptions.json
// with a reason.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "tokens", "figma-tokens.json"), "utf8"));
const css = readFileSync(join(root, "src", "css", "tokens.css"), "utf8");
const { Tokens, Primitives } = data.collections;
const showAll = process.argv.includes("--all");

const TEXT = 4.5; // body text
const LARGE = 3; // large text, rules and other marks

// [foreground role, background role, minimum ratio, what it is]
const pairs = [];
const add = (fg, bg, min, note) => pairs.push([fg, bg, min, note]);

// Text on the page and on raised surfaces
for (const bg of ["surface/neutral/base", "surface/neutral/raised"]) {
  for (const fg of ["text/neutral/primary", "text/neutral/secondary", "text/neutral/body", "text/brand/primary", "interactive/link/default"]) {
    add(fg, bg, TEXT, "text on the page");
  }
}
add("text/neutral/inverse", "surface/neutral/inverse", TEXT, "text on the inverse surface");
add("text/neutral/secondary", "surface/brand/primary-subtle", TEXT, "captions on the brand tint");

// Status text on its own tint and on the page
for (const kind of ["alert", "success", "warning"]) {
  add(`text/system/${kind}`, `surface/system/${kind}`, TEXT, "status text on its tint");
  add(`text/system/${kind}`, "surface/neutral/base", TEXT, "status text on the page");
}

// Text on the brand band
for (const fg of ["primary", "body", "secondary", "name", "title"]) {
  add(`text/on-brand/${fg}`, "surface/brand/primary", TEXT, "text on the brand band");
}
// Text on the secondary band
for (const fg of ["primary", "body"]) {
  add(`text/on-secondary/${fg}`, "surface/brand/secondary-band", TEXT, "text on the secondary band");
}

// Button labels on their fills, every state except disabled
for (const state of ["default", "hover", "pressed", "active"]) {
  add("interactive/button/primary/label/default", `interactive/button/primary/fill/${state}`, TEXT, `primary button label, ${state}`);
}
for (const state of ["default", "hover", "active"]) {
  add("interactive/button/secondary/label/default", `interactive/button/secondary/fill/${state}`, TEXT, `secondary button label, ${state}`);
}
add("interactive/button/secondary/label/pressed", "interactive/button/secondary/fill/pressed", TEXT, "secondary button label, pressed");
add("interactive/button/tertiary/label/default", "surface/neutral/base", TEXT, "tertiary button label");
add("interactive/button/tertiary/label/hover", "interactive/button/tertiary/fill/hover", TEXT, "tertiary button label, hover");
add("interactive/button/tertiary/label/pressed", "interactive/button/tertiary/fill/pressed", TEXT, "tertiary button label, pressed");
add("interactive/button/tertiary/label/active", "interactive/button/tertiary/fill/active", TEXT, "tertiary button label, active");
// Buttons that sit on the brand band
add("interactive/button/primary/on-brand/label", "interactive/button/primary/on-brand/fill", TEXT, "primary button label on the band");
add("interactive/button/secondary/on-brand/label", "surface/brand/primary", TEXT, "secondary button label on the band");
add("interactive/button/secondary/on-brand/label", "interactive/button/secondary/on-brand/fill/hover", TEXT, "secondary button label on the band, hover");
add("interactive/button/secondary/on-brand/label", "interactive/button/secondary/on-brand/fill/pressed", TEXT, "secondary button label on the band, pressed");

// Button shapes, borders and focus rings against the surface they sit on (non-text, 3:1)
add("interactive/button/primary/fill/default", "surface/neutral/base", LARGE, "primary button fill against the page");
add("interactive/button/secondary/border/default", "surface/neutral/base", LARGE, "secondary button border against the page");
add("border/focus/ring", "surface/neutral/base", LARGE, "focus ring on the page");
add("interactive/button/primary/on-brand/fill", "surface/brand/primary", LARGE, "primary button fill against the band");
add("interactive/button/secondary/on-brand/border", "surface/brand/primary", LARGE, "secondary button border against the band");
add("border/focus/ring-on-brand", "surface/brand/primary", LARGE, "focus ring on the band");
add("border/focus/ring-on-secondary", "surface/brand/secondary-band", LARGE, "focus ring on the secondary band");

// Marks and highlights
add("accent/rule", "surface/neutral/base", LARGE, "accent rule on the page");
add("accent/numeral", "surface/neutral/base", LARGE, "stat numerals on the page");
add("selection/text", "selection/background", TEXT, "selected text");

// ------------------------------------------------------------ helpers

const hexOf = (primitive) => Primitives.variables[primitive].split("@")[0];
function luminance(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const exceptionsPath = join(root, "scripts", "contrast-exceptions.json");
const exceptions = existsSync(exceptionsPath) ? JSON.parse(readFileSync(exceptionsPath, "utf8")) : [];
const isException = (mode, fg, bg) => exceptions.some((e) => e.mode === mode && e.fg === fg && e.bg === bg);

// ------------------------------------------------------------ 1. coverage

const problems = [];
const modes = Tokens.modes;
const rootBlock = css.slice(css.indexOf(":root {"), css.indexOf("\n}\n", css.indexOf(":root {")));
for (const [role, cells] of Object.entries(Tokens.variables)) {
  for (const mode of modes) if (!cells[mode]) problems.push(`${role} has no value in ${mode}`);
  if (!rootBlock.includes(`--arche-${role.replace(/\//g, "-")}:`)) problems.push(`tokens.css does not declare ${role}`);
}
for (const [fg, bg] of pairs.map((p) => [p[0], p[1]]).flat().map((r) => [r, r])) {
  if (!Tokens.variables[fg]) problems.push(`The pair list names ${fg}, which is not a role`);
}

// ------------------------------------------------------------ 2. contrast

const failures = [];
let checked = 0;
let skipped = 0;
for (const mode of modes) {
  for (const [fg, bg, min, note] of pairs) {
    const a = Tokens.variables[fg]?.[mode];
    const b = Tokens.variables[bg]?.[mode];
    if (!a || !b) continue;
    const r = ratio(hexOf(a.primitive), hexOf(b.primitive));
    checked++;
    if (showAll) console.log(`${r.toFixed(2).padStart(6)}  ${mode.padEnd(15)} ${fg} on ${bg}`);
    if (r + 1e-9 >= min) continue;
    if (isException(mode, fg, bg)) { skipped++; continue; }
    failures.push({ mode, fg, bg, min, r, note, a: a.primitive, b: b.primitive });
  }
}

// ------------------------------------------------------------ report

if (problems.length) {
  console.error("check-contrast: coverage problems\n");
  problems.forEach((p) => console.error(`  - ${p}`));
}
if (failures.length) {
  console.error(`check-contrast: ${failures.length} pair(s) below WCAG AA\n`);
  let last = "";
  for (const f of failures) {
    if (f.mode !== last) { console.error(`  ${f.mode}`); last = f.mode; }
    console.error(`    ${f.r.toFixed(2)}:1 (needs ${f.min}:1)  ${f.fg} [${f.a}] on ${f.bg} [${f.b}]  (${f.note})`);
  }
}
if (problems.length || failures.length) process.exit(1);
console.log(`check-contrast: ok (${Object.keys(Tokens.variables).length} roles x ${modes.length} modes, ${checked} pairs checked${skipped ? `, ${skipped} listed exceptions` : ""})`);
