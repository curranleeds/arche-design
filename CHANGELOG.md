# Changelog

All notable changes to Arche are listed here, newest first.

## How versions work

Arche uses three numbers: major.minor.patch, for example 0.2.1.

- **Patch (0.2.1):** fixes that change no token names or values.
- **Minor (0.3.0):** new tokens or components, or a changed token value (a visible change).
- **While Arche is below 1.0:** a removed or renamed token also bumps the minor version, and the changelog entry must say "Breaking:".

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
- The Cloudflare Workers config (`wrangler.jsonc` and `.node-version`).

Removed
- Tokens and CSS no longer sync from the portfolio. Arche owns them. Only the fonts, icons and `theme.js` still come from there.
