// The side navigation, and the order of the "Continue to" band at the end of each page.
// Add a page here (with a short description) and it shows up in both.
// Color mode pages are not listed: they are reached by direct link and sit outside the sequence.
module.exports = [
  { title: "Start", items: [{ title: "Overview", url: "/", description: "What Arche is, how it's built, and the rules it rests on." }] },
  {
    title: "Foundations",
    items: [
      { title: "Color", url: "/foundations/color/", description: "The color families, what each one does, and the role tokens that components read." },
      { title: "Type", url: "/foundations/type/", description: "Two typefaces, fifteen styles, and how they step across three breakpoints." },
      { title: "Spacing and grid", url: "/foundations/spacing/", description: "The spacing values, the 12-column grid, and the three breakpoints." },
      { title: "Motion and focus", url: "/foundations/motion/", description: "One easing curve, three durations, and the focus ring." },
      { title: "Accessibility", url: "/foundations/accessibility/", description: "The WCAG 2.1 AA checks built into the components." },
    ],
  },
  {
    title: "Components",
    items: [
      { title: "Button", url: "/components/button/", description: "Primary, secondary and tertiary buttons, with their states." },
      { title: "Link", url: "/components/link/", description: "The bold, underlined text link and when to use it." },
      { title: "Form field", url: "/components/form-field/", description: "A 56px field with the label inside it and a rule along the bottom." },
      { title: "Theme controls", url: "/components/theme-controls/", description: "The Light and Dark controls, and how the system follows the browser." },
      { title: "Stat strip", url: "/components/stat-strip/", description: "Up to four large numbers on a light-blue tint." },
      { title: "Quote", url: "/components/quote/", description: "A pull quote with the attribution in the left columns." },
      { title: "List row", url: "/components/list-row/", description: "A full-width row that is one link, with a trailing arrow." },
    ],
  },
];
