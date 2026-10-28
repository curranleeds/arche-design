const fs = require("node:fs");
const path = require("node:path");

module.exports = function (eleventyConfig) {
  // Copy these folders into the built site untouched.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/assets");

  // {% icon "dark_mode" %} puts src/assets/icons/dark_mode.svg straight into the page.
  // data-icon records the name so the code viewer can show the name instead of the SVG.
  const iconDir = path.join(__dirname, "src", "assets", "icons");
  eleventyConfig.addShortcode("icon", function (name) {
    if (!/^[a-z0-9_]+$/.test(name || "")) throw new Error(`icon: "${name}" is not a valid icon name.`);
    const file = path.join(iconDir, `${name}.svg`);
    if (!fs.existsSync(file)) throw new Error(`icon: no icon named "${name}" (expected src/assets/icons/${name}.svg)`);
    return fs
      .readFileSync(file, "utf8")
      .trim()
      .replace("<svg ", `<svg class="icon" data-icon="${name}" aria-hidden="true" focusable="false" `);
  });

  // {{ page.url | pageInfo }} finds a page in the nav order (all groups, in order).
  // Returns { section, item, index, total, prev, next }, or null for pages outside the sequence (color modes).
  const nav = require("./src/_data/nav.js");
  const sequence = nav.flatMap((group) => group.items.map((item) => ({ section: group.title, item })));
  eleventyConfig.addFilter("pageInfo", function (url) {
    const i = sequence.findIndex((entry) => entry.item.url === url);
    if (i === -1) return null;
    return {
      section: sequence[i].section,
      item: sequence[i].item,
      index: i + 1,
      total: sequence.length,
      prev: i > 0 ? sequence[i - 1].item : null,
      next: i < sequence.length - 1 ? sequence[i + 1].item : null,
    };
  });

  // {% demo "Caption", "brand" %} ...html... {% enddemo %}
  // Shows the HTML live inside a stage, and the same HTML as readable code under it.
  // The second argument is optional: "brand" puts the stage on the blue brand surface.
  eleventyConfig.addPairedShortcode("demo", function (content, caption, stage) {
    const code = prettyHtml(content);
    const cls = stage ? ` demo__stage--${stage}` : "";
    return `<figure class="demo">
  <div class="demo__stage${cls}">${content}</div>
  <details class="demo__code">
    <summary>View HTML</summary>
    <pre tabindex="0"><code>${escapeHtml(code)}</code></pre>
  </details>
  <figcaption class="demo__caption type-small">${caption}</figcaption>
</figure>`;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Turns the rendered HTML into tidy, indented lines for the code viewer.
function prettyHtml(html) {
  // An inlined icon becomes a comment naming the icon, so the code stays short.
  html = html.replace(/<svg[^>]*data-icon="([^"]+)"[^>]*>[\s\S]*?<\/svg>/g, "<!-- icon: $1 -->");
  const tokens = (html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || [])
    .map((t) => (t.startsWith("<") ? t.replace(/\s+/g, " ").replace(/ \/?>$/, (m) => m.trim()) : t.replace(/\s+/g, " ").trim()))
    .filter(Boolean);
  const isOpen = (t) => /^<[a-z]/i.test(t) && !/\/>$/.test(t) && !/^<(input|br|img|hr|meta|link)\b/i.test(t);
  const isClose = (t) => /^<\//.test(t);
  const lines = [];
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const pad = "  ".repeat(Math.max(depth, 0));
    if (isOpen(t) && tokens[i + 1] && !tokens[i + 1].startsWith("<") && tokens[i + 2] && isClose(tokens[i + 2])) {
      lines.push(pad + t + tokens[i + 1] + tokens[i + 2]);
      i += 2;
    } else if (isOpen(t) && tokens[i + 1] && isClose(tokens[i + 1])) {
      lines.push(pad + t + tokens[i + 1]);
      i += 1;
    } else if (isClose(t)) {
      depth--;
      lines.push("  ".repeat(Math.max(depth, 0)) + t);
    } else if (isOpen(t)) {
      lines.push(pad + t);
      depth++;
    } else {
      lines.push(pad + t);
    }
  }
  return lines.join("\n");
}
