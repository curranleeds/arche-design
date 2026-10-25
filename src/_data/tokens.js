// Reads tokens/figma-tokens.json (a snapshot of the Figma variables) and prepares
// everything the foundations pages show. The pages never hold their own copy of a
// value, so the docs cannot drift from the tokens.
const t = require("../../tokens/figma-tokens.json");

const prim = t.collections.Primitives.variables;
const roles = t.collections.Tokens.variables;
const spacing = t.collections.Spacing.variables;

// "primary/500" -> "--primary-500"; "system/alert/500" -> "--alert-500"; "neutral/black-alpha-50" -> "--black-alpha-50"
const primVar = (n) => "--" + n.replace(/^system\//, "").replace(/^neutral\/(black-alpha)/, "$1").replace(/\//g, "-");
const roleVar = (n) => "--" + n.replace(/\//g, "-");

// ----- Color families -----
const familyMeta = [
  { key: "primary", name: "Greece Blue", job: "Structure and meaning: bands, links, buttons, stat numbers." },
  { key: "secondary", name: "Sweden Yellow", job: "Identity only: the name on the home page and the Credits band." },
  { key: "tertiary", name: "Norway Red", job: "Unassigned. Held for the logo and for later; not used on pages or components." },
  { key: "neutral", name: "Neutral", job: "Text, surfaces and borders." },
  { key: "system/alert", name: "Alert", job: "Errors and alerts only." },
  { key: "system/success", name: "Success", job: "Status only." },
  { key: "system/warning", name: "Warning", job: "Status only." },
];
const families = familyMeta.map((f) => ({
  ...f,
  swatches: Object.entries(prim)
    .filter(([n]) => n.startsWith(f.key + "/"))
    .map(([n, hex]) => ({ step: n.split("/").pop(), hex, cssVar: primVar(n) })),
}));

// ----- Role tokens, grouped by their first word -----
const groupLabel = { surface: "Surface", text: "Text", border: "Border", icon: "Icon", interactive: "Interactive", logo: "Logo" };
const roleGroups = {};
for (const [name, v] of Object.entries(roles)) {
  const g = name.split("/")[0];
  (roleGroups[g] = roleGroups[g] || []).push({
    name,
    cssVar: roleVar(name),
    light: v.light,
    dark: v.dark,
    differs: v.light.hex.toLowerCase() !== v.dark.hex.toLowerCase(),
  });
}
const roleList = Object.entries(roleGroups).map(([key, items]) => ({ key, label: groupLabel[key] || key, items }));

// ----- Contrast (WCAG 2.x), computed here so the numbers are never typed by hand -----
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const get = (name, mode) => {
  if (!roles[name]) throw new Error(`tokens.js: no role token "${name}"`);
  return roles[name][mode].hex;
};
// [foreground token, background token, what it is, minimum ratio]
const pairs = [
  ["text/neutral/primary", "surface/neutral/base", "Headings on the page", 4.5],
  ["text/neutral/body", "surface/neutral/base", "Body copy on the page", 4.5],
  ["text/neutral/secondary", "surface/neutral/base", "Captions and meta on the page", 4.5],
  ["text/brand/primary", "surface/neutral/base", "Links and brand text on the page", 4.5],
  ["text/brand/primary", "surface/brand/primary-subtle", "Stat numbers on the blue tint", 4.5],
  ["text/neutral/secondary", "surface/brand/primary-subtle", "Captions on the blue tint", 4.5],
  ["text/system/alert", "surface/neutral/base", "Error text on the page", 4.5],
  ["text/on-brand/primary", "surface/brand/primary", "White text on the blue band", 4.5],
  ["text/on-brand/body", "surface/brand/primary", "Body text on the blue band", 4.5],
  ["text/on-brand/secondary", "surface/brand/primary", "Secondary text on the blue band", 4.5],
  ["text/on-secondary/primary", "surface/brand/secondary-band", "Text on the yellow band", 4.5],
  ["border/neutral/strong", "surface/neutral/base", "Form field bar at rest (non-text)", 3],
  ["border/focus/ring", "surface/neutral/base", "Focus ring on the page (non-text)", 3],
].map(([fg, bg, label, min]) => {
  const row = { fg, bg, label, min };
  for (const mode of ["light", "dark"]) {
    const r = ratio(get(fg, mode), get(bg, mode));
    row[mode] = { ratio: r.toFixed(2), pass: r >= min };
  }
  return row;
});

// ----- Spacing -----
const spacingList = Object.entries(spacing).map(([n, px]) => ({
  name: n,
  px,
  cssVar: n.startsWith("stroke") ? "--" + n.replace("/", "-") : "--space-" + n.replace("/", "-"),
  group: n.split("/")[0],
}));

// ----- Type -----
const weights = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };
const styleMap = {};
for (const s of t.textStyles) {
  const [group, style, bp] = s.name.split("/");
  const slug = style.toLowerCase().replace(/\s+/g, "-");
  const fontWords = s.font.split(" ");
  const m = (styleMap[slug] = styleMap[slug] || { slug, style, group, family: fontWords.slice(0, -1).join(" ") });
  m.weightName = fontWords[fontWords.length - 1];
  m.weight = weights[m.weightName] || "";
  m.letterSpacing = s.letterSpacing;
  m.upper = s.textCase === "UPPER";
  m[bp.toLowerCase()] = `${s.size}/${s.lineHeight}`;
}
const typeStyles = Object.values(styleMap);

const jobs = {
  display: "The one big-scale moment on a page.",
  h1: "Page title.",
  h2: "Section statements, such as Problem and Outcome.",
  h3: "Card and row titles.",
  subhead: "A short label above body copy. Never the first sentence of a paragraph.",
  quote: "Pull quotes.",
  stat: "Numbers in a stat strip.",
  lead: "Intro paragraph under a title.",
  body: "Running text.",
  "body-medium": "Body text that needs a little more weight.",
  "body-semibold": "Emphasis inside body text; links.",
  small: "Captions and helper text.",
  button: "Button and link labels.",
  label: "Short uppercase labels and eyebrows.",
  "fine-print": "Footnotes and legal text.",
};
const samples = {
  display: "Clear systems",
  h1: "Design for the reader first",
  h2: "One style, one job",
  h3: "Card or row title",
  subhead: "A short label above body copy",
  quote: "Quote text sits here, set in Archivo Medium.",
  stat: "00",
  lead: "A lead paragraph introduces the page in a sentence or two.",
  body: "Body copy is Work Sans Regular. It is set for long reading at a comfortable line length.",
  "body-medium": "Body Medium adds a little weight.",
  "body-semibold": "Body SemiBold marks emphasis and links.",
  small: "Small text is for captions and helper lines.",
  button: "Button label",
  label: "Eyebrow label",
  "fine-print": "Fine print is for footnotes and sources.",
};
typeStyles.forEach((s) => { s.job = jobs[s.slug] || ""; s.sample = samples[s.slug] || s.style; });

module.exports = {
  source: t.source,
  counts: {
    primitives: Object.keys(prim).length,
    spacing: Object.keys(spacing).length,
    roles: Object.keys(roles).length,
    textStyles: t.textStyles.length,
    typeStyles: typeStyles.length,
  },
  families,
  roleList,
  pairs,
  spacingList,
  typeStyles,
  gridStyles: t.gridStyles,
};
