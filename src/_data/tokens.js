// Reads tokens/figma-tokens.json (a snapshot of the Figma variables) and prepares
// everything the foundations pages show. The pages never hold their own copy of a
// value, so the docs cannot drift from the tokens.
const t = require("../../tokens/figma-tokens.json");

const prim = t.collections.Primitives.variables;
const roles = t.collections.Tokens.variables;
const spacing = t.collections.Spacing.variables;

// Every custom property starts with --arche-. Keep this in step with `npm run tokens`.
const P = "--arche-";
// "greece/blue/500" -> "--arche-greece-blue-500"; "system/alert/500" -> "--arche-alert-500"; "neutral/black-alpha-50" -> "--arche-black-alpha-50"
const primVar = (n) => P + n.replace(/^system\//, "").replace(/^neutral\/(black-alpha)/, "$1").replace(/\//g, "-");
const roleVar = (n) => P + n.replace(/\//g, "-");

// ----- Color families -----
const familyMeta = [
  { key: "greece/blue", name: "Greece Blue", job: "Structure and meaning: bands, links, buttons, stat numbers. Ethos uses it as its only color." },
  { key: "sweden/yellow", name: "Sweden Yellow", job: "Identity: the name on the home page, the Credits band, the selection highlight and, in Omtanke, the yellow band and the primary button on blue." },
  { key: "norway/red", name: "Norway Red", job: "The logo and, in Canon, the end mark. Nøktern uses it in the Cross. It is never on text, controls, validation or cards." },
  { key: "norway/blue", name: "Norway Blue", job: "Nøktern's main color. No other mode uses it." },
  { key: "sweden/blue", name: "Sweden Blue", job: "Omtanke's main color. No other mode uses it." },
  { key: "neutral", name: "Neutral", job: "Text, surfaces and borders." },
  { key: "system/alert", name: "Alert", job: "Errors and alerts only. The same in every mode." },
  { key: "system/success", name: "Success", job: "Status only. The same in every mode." },
  { key: "system/warning", name: "Warning", job: "Status only. The same in every mode." },
];
const families = familyMeta.map((f) => ({
  ...f,
  swatches: Object.entries(prim)
    .filter(([n]) => n.startsWith(f.key + "/"))
    .map(([n, hex]) => ({ step: n.split("/").pop(), hex, cssVar: primVar(n) })),
}));

// ----- Color modes -----
// Figma names a mode "Canon Light", "Noktern Dark" and so on: the mode, then Light or Dark.
const modeDefs = [
  { id: "canon", name: "Canon", tradition: "Default", trait: "Systematic", summary: "The full palette. Greece Blue is structure, Sweden Yellow is identity, and Norway Red closes the page.",
    rules: [
      "Greece Blue is the structural color: bands, links, buttons and stat numbers.",
      "Sweden Yellow is a fill with near-black text, plus the selection highlight.",
      "Norway Red is the logo and one end mark per page: a flat 4px rule under the last column of running text, never on text, controls, validation, cards or interactive states.",
      "Stat numbers sit in the Greece Blue tint panel. Dark uses neutral surfaces.",
      "No Sweden Blue." ] },
  { id: "klarheit", name: "Klarheit", tradition: "Swiss", trait: "Clean", summary: "Neutral surfaces and type, with Swiss red as the one decorative color.",
    rules: [
      "Neutral 900 does the work that blue does in Canon: the band, links, buttons and borders.",
      "Swiss red is decoration: one red device per page, either a rule above the title or large numerals in stepped flows.",
      "Red never appears on form controls, validation, cards or interactive states.",
      "Swiss red is #FF0000 on screen and #DA291C in print." ] },
  { id: "noktern", name: "Nøktern", tradition: "Norwegian", trait: "Grounded", summary: "Norway Blue as the main color, with Norway Red in one small device.",
    rules: [
      "Norway Blue is the main color for bands, links, buttons and stat numbers.",
      "Norway Red appears only in the Cross: a red stripe with a white line on each side, along the top of the blue band.",
      "Red is never on text, form controls, validation, cards or interactive states.",
      "Dark uses deep navy surfaces. The selection highlight is a Norway Blue tint." ] },
  { id: "omtanke", name: "Omtanke", tradition: "Swedish", trait: "Generous", summary: "Sweden Blue with Sweden Yellow as a second voice.",
    rules: [
      "Sweden Blue is the main color. Its blue band carries Yellow 50 type and a yellow primary button.",
      "The yellow band carries Sweden 800 type.",
      "One type color per colored field.",
      "Dark uses Sweden 900 surfaces. The selection highlight is Yellow 500." ] },
  { id: "ethos", name: "Ethos", tradition: "Greek", trait: "Principled", summary: "Greece Blue as the only color, with no accent.",
    rules: [
      "Greece Blue is the only brand color. Emphasis comes from type weight and size plus the tint panel.",
      "The accent rule and stat numerals are blue.",
      "Ethos never uses Alert red for decoration.",
      "The selection highlight is a Greece Blue tint." ] },
];
const modeNames = Object.fromEntries(modeDefs.map((m) => [m.id, m.name]));
const modeId = (figmaMode) => figmaMode.replace(/ (Light|Dark)$/, "").toLowerCase();

// values[modeId] = { light: {primitive, hex}, dark: {primitive, hex} }
const roleValues = (cells) => {
  const out = {};
  for (const [figmaMode, v] of Object.entries(cells)) {
    const id = modeId(figmaMode);
    (out[id] = out[id] || {})[/ Dark$/.test(figmaMode) ? "dark" : "light"] = v;
  }
  return out;
};
const hexDiffer = (a, b) => a.hex.toLowerCase() !== b.hex.toLowerCase();

// ----- Role tokens, grouped by their first word. Light and Dark here are Canon's. -----
const groupLabel = { surface: "Surface", text: "Text", border: "Border", icon: "Icon", interactive: "Interactive", logo: "Logo", accent: "Accent", selection: "Selection" };
const roleGroups = {};
for (const [name, cells] of Object.entries(roles)) {
  const g = name.split("/")[0];
  const values = roleValues(cells);
  (roleGroups[g] = roleGroups[g] || []).push({
    name,
    cssVar: roleVar(name),
    values,
    light: values.canon.light,
    dark: values.canon.dark,
    differs: hexDiffer(values.canon.light, values.canon.dark),
    // The modes whose Light or Dark value is not Canon's.
    changedIn: modeDefs.filter((m) => m.id !== "canon" && (hexDiffer(values[m.id].light, values.canon.light) || hexDiffer(values[m.id].dark, values.canon.dark))).map((m) => m.name),
  });
}
const roleList = Object.entries(roleGroups).map(([key, items]) => ({ key, label: groupLabel[key] || key, items }));
const roleByName = Object.fromEntries(roleList.flatMap((g) => g.items.map((r) => [r.name, r])));

// ----- Contrast (WCAG 2.x), computed here so the numbers are never typed by hand -----
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const get = (name, id, theme) => {
  if (!roleByName[name]) throw new Error(`tokens.js: no role token "${name}"`);
  return roleByName[name].values[id][theme].hex;
};
// [foreground token, background token, what it is, minimum ratio]
const pairDefs = [
  ["text/neutral/primary", "surface/neutral/base", "Headings on the page", 4.5],
  ["text/neutral/body", "surface/neutral/base", "Body copy on the page", 4.5],
  ["text/neutral/secondary", "surface/neutral/base", "Captions and meta on the page", 4.5],
  ["text/brand/primary", "surface/neutral/base", "Links and brand text on the page", 4.5],
  ["text/brand/primary", "surface/brand/primary-subtle", "Stat numbers on the brand tint", 4.5],
  ["text/neutral/secondary", "surface/brand/primary-subtle", "Captions on the brand tint", 4.5],
  ["text/system/alert", "surface/neutral/base", "Error text on the page", 4.5],
  ["text/on-brand/primary", "surface/brand/primary", "Headings on the brand band", 4.5],
  ["text/on-brand/body", "surface/brand/primary", "Body text on the brand band", 4.5],
  ["text/on-brand/secondary", "surface/brand/primary", "Secondary text on the brand band", 4.5],
  ["text/on-secondary/primary", "surface/brand/secondary-band", "Text on the yellow band", 4.5],
  ["interactive/button/primary/label/default", "interactive/button/primary/fill/default", "Primary button label", 4.5],
  ["interactive/button/primary/on-brand/label", "interactive/button/primary/on-brand/fill", "Primary button label on the band", 4.5],
  ["selection/text", "selection/background", "Selected text", 4.5],
  ["border/neutral/strong", "surface/neutral/base", "Form field bar at rest (non-text)", 3],
  ["border/focus/ring", "surface/neutral/base", "Focus ring on the page (non-text)", 3],
  ["accent/rule", "surface/neutral/base", "Accent rule on the page (non-text)", 3],
  ["accent/numeral", "surface/neutral/base", "Stat numerals on the page", 3],
];
const pairsFor = (id) => pairDefs.map(([fg, bg, label, min]) => {
  const row = { fg, bg, label, min };
  for (const theme of ["light", "dark"]) {
    const r = ratio(get(fg, id, theme), get(bg, id, theme));
    row[theme] = { ratio: r.toFixed(2), pass: r + 1e-9 >= min };
  }
  return row;
});
// Canon's pairs, for the main Color page.
const pairs = pairsFor("canon");

// Everything one mode page needs: swatches of its main roles, its pairs, and what it changes.
const swatchRoles = [
  ["Page", "surface/neutral/base"],
  ["Brand band", "surface/brand/primary"],
  ["Brand tint", "surface/brand/primary-subtle"],
  ["Yellow band", "surface/brand/secondary-band"],
  ["Links and brand text", "text/brand/primary"],
  ["Accent rule", "accent/rule"],
  ["Stat numerals", "accent/numeral"],
  ["Selection", "selection/background"],
  ["Cross / end-mark surface", "surface/brand/accent"],
];
const modes = modeDefs.map((m) => ({
  ...m,
  swatches: swatchRoles.map(([label, name]) => ({ label, name, cssVar: roleVar(name), light: roleByName[name].values[m.id].light, dark: roleByName[name].values[m.id].dark })),
  pairs: pairsFor(m.id),
  // Roles whose value is not Canon's in this mode.
  changed: m.id === "canon" ? [] : roleList.flatMap((g) => g.items.filter((r) => hexDiffer(r.values[m.id].light, r.values.canon.light) || hexDiffer(r.values[m.id].dark, r.values.canon.dark))).map((r) => r.name),
}));
modes.forEach((m) => { m.pairsPass = m.pairs.every((p) => p.light.pass && p.dark.pass); });

// ----- Spacing -----
const spacingList = Object.entries(spacing).map(([n, px]) => ({
  name: n,
  px,
  cssVar: n.startsWith("stroke") ? P + n.replace("/", "-") : P + "space-" + n.replace("/", "-"),
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
    modes: modeDefs.length,
    textStyles: t.textStyles.length,
    typeStyles: typeStyles.length,
  },
  families,
  roleList,
  modes,
  pairs,
  spacingList,
  typeStyles,
  gridStyles: t.gridStyles,
};
