// The side navigation. Add a page here and it shows up everywhere.
module.exports = [
  { title: "Start", items: [{ title: "Overview", url: "/" }] },
  {
    title: "Foundations",
    items: [
      { title: "Color", url: "/foundations/color/" },
      { title: "Type", url: "/foundations/type/" },
      { title: "Spacing and grid", url: "/foundations/spacing/" },
      { title: "Motion and focus", url: "/foundations/motion/" },
      { title: "Accessibility", url: "/foundations/accessibility/" },
    ],
  },
  {
    title: "Components",
    items: [
      { title: "Button", url: "/components/button/" },
      { title: "Link", url: "/components/link/" },
      { title: "Form field", url: "/components/form-field/" },
      { title: "Theme controls", url: "/components/theme-controls/" },
      { title: "Stat strip", url: "/components/stat-strip/" },
      { title: "Quote", url: "/components/quote/" },
      { title: "List row", url: "/components/list-row/" },
    ],
  },
];
