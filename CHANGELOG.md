# Changelog

All notable changes to Arche are listed here, newest first.

## How versions work

Arche uses three numbers: major.minor.patch, for example 0.2.1.

- **Patch (0.2.1):** fixes that change no token names or values.
- **Minor (0.3.0):** new tokens or components, or a changed token value (a visible change).
- **While Arche is below 1.0:** a removed or renamed token also bumps the minor version, and the changelog entry must say "Breaking:".

## 0.4.0

Breaking: color primitives are renamed, and the button states follow one set of rules in every mode.

Breaking
- Color primitives are renamed so each name says what the color is. Any CSS that uses a primitive directly (roles are not affected) must change:
  - `--arche-primary-*` is now `--arche-greece-blue-*`
  - `--arche-secondary-*` is now `--arche-sweden-yellow-*`
  - `--arche-tertiary-*` is now `--arche-norway-red-*`
  - `--arche-norway-*` is now `--arche-norway-blue-*`
  - `--arche-sweden-*` is now `--arche-sweden-blue-*`
  - `--arche-swiss-red-web` and `--arche-swiss-red-print` do not change.
- Role tokens keep their names, so components that use roles keep working.

Added
- Two roles for the primary button on a brand band: `--arche-interactive-button-primary-on-brand-fill-hover` and `--arche-interactive-button-primary-on-brand-fill-pressed`.

Changed
- Button states follow five rules in all ten modes. A solid fill is lighter on hover and darker when pressed. Active matches pressed (primary) or the hover tint (secondary). Secondary and tertiary share one pair of tints. A fill that matches the page follows the page color in Dark. On a band, secondary hover is lighter than the band and pressed is darker. 13 button roles changed to follow them. See `Arche Button Token Audit` for the before and after.
- Klarheit's primary pressed fill in Light is black.
- Docs: the band limits ("once per page") are removed from the Ethos and Nøktern copy. Bands follow the ground, and a page can carry more than one.

## 0.3.0

Five color modes. Canon is the default and keeps the look of 0.2.0, with one exception listed under Changed.

Added
- Color modes. `data-mode` on the `<html>` element picks Canon, Klarheit, Nøktern, Omtanke or Ethos, and `data-theme` still picks Light or Dark. No `data-mode` means Canon. Each mode block in `tokens.css` lists only the roles that differ from Canon.
- Primitives: the Norway Blue ramp (`--arche-norway-50` to `-900`), the Sweden Blue ramp (`--arche-sweden-50` to `-900`), and Swiss red (`--arche-swiss-red-web` and `--arche-swiss-red-print`).
- Role tokens: `--arche-surface-brand-accent`, `--arche-border-on-brand-cross-line`, `--arche-accent-rule`, `--arche-accent-numeral`, `--arche-selection-background`, `--arche-selection-text`, `--arche-interactive-link-default`, and the on-brand button roles `--arche-interactive-button-primary-on-brand-fill`, `--arche-interactive-button-primary-on-brand-label` and `--arche-interactive-button-secondary-on-brand-fill-hover`.
- The contrast and coverage check, `scripts/check-contrast.mjs`, run with `npm run check:contrast`. It checks that every role has a value in every mode, and that the main text, button, border and mark pairs meet WCAG AA in all ten Light and Dark modes. `npm run build` runs it.
- Docs: a color page for each mode with its rules, main colors and contrast ratios, a Color modes page, a Mode menu in the header, and a note on the three accent roles.

Changed
- `--arche-interactive-button-secondary-on-brand-fill-pressed` is one step darker in every mode, Canon included: Blue 700 instead of Blue 600. This is a visible change in Canon.
- Norway Red now has jobs in the docs copy: the logo, Canon's end mark and Nøktern's Cross.
- The tokens come from the Arche Design System Figma file, which holds one Tokens collection with ten modes.

## 0.2.0

The first versioned release.

**Breaking:** every CSS variable was renamed. Names that used to start with `--` and a word, such as `--primary-500`, now start with `--arche-`, such as `--arche-primary-500`. A site that uses Arche must update the names it reads.

Changed
- All CSS variables use the `--arche-` prefix. This includes the component variables, such as `--arche-page-max`.
- The docs pages show the prefixed names.

Added
- The token generator, `scripts/generate-tokens.mjs`, run with `npm run tokens`.
- The variable check, `scripts/check-vars.mjs`, run with `npm run check`. It fails if a variable is used but never declared, or if a name does not start with `--arche-`.
- Runtime hooks: `--arche-site-nav-offset`, `--arche-lb-max` and `--arche-lb-ratio`. A host site sets them with JavaScript. If it does not, the CSS fallbacks apply.
- A manifest, `arche.manifest.json`, built by `npm run manifest`. It lists the files a site copies from Arche, each with a SHA-256 hash, and the Arche version. `npm run check` fails if it is out of date, and `npm run build` rebuilds it.
- The Cloudflare Workers config (`wrangler.jsonc` and `.node-version`).

Removed
- Tokens and CSS no longer sync from the portfolio. Arche owns them. Only the fonts, icons and `theme.js` still come from there.
