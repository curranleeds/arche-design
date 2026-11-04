# Changelog

All notable changes to Arche are listed here, newest first.

## How versions work

Arche uses three numbers: major.minor.patch, for example 0.2.1.

- **Patch (0.2.1):** fixes that change no token names or values.
- **Minor (0.3.0):** new tokens or components, or a changed token value (a visible change).
- **While Arche is below 1.0:** a removed or renamed token also bumps the minor version, and the changelog entry must say "Breaking:".

## 0.9.1

Added
- Text selection: a `::selection` rule in `components.css`. Selected text now uses `--arche-selection-background` and `--arche-selection-text`, so the highlight follows the mode: Yellow 500 with near-black text in Canon, Klarheit and Omtanke, and a blue tint in Ethos and Nøktern. The tokens already existed in every mode, but nothing applied them, so browsers showed the visitor's system highlight color.

A site that uses Arche updates `components.css` (its hash changes). No markup changes and no token changes.

## 0.9.0

Added
- Outcome: Canon's end mark. A flat 4px rule under the Outcome body text, as wide as the text column (343px on mobile, 524px on tablet, 421px on desktop), 24px below the last line. New class `.cs-outcome__end-mark`, added as the last child of the body column: `<span class="cs-outcome__end-mark" aria-hidden="true"></span>`. It reads `accent/rule` (Norway Red 500 in Canon Light, Norway Red 400 in Canon Dark), so each mode sets its own color. It sits inside the body column, so it shows only when the body shows. It is decoration: `aria-hidden`, no text, not focusable.
- Outcome page: an "End mark" section with the size at each breakpoint, the contrast on the blue tint (4.57:1 in Light, 3.28:1 in Dark), and a Do and a Don't. Once per page, only under the Outcome body text, never on other text, controls or cards.

Changed
- The Outcome's last body paragraph no longer adds its own bottom margin (the mark brings the 24px). Nothing changes when there is no mark except that last paragraph's 16px bottom margin inside the Outcome, which had no visible effect because the block's own gap follows it.
- Spacing and grid page and Color modes page: the end mark wording says that on a case study the mark sits under the Outcome body text.

A site that uses Arche updates `case-study.css` (its hash changes) and adds the span to its Outcome markup. Without the span, nothing changes.

## 0.8.3

Docs only. No component CSS, token or shared file changes, so nothing needs updating in a site that uses Arche.

Fixed
- Outcome page: the demo's quote was indented 24px further than the label and text above it. A demo rule meant for the Quote, Stat strip and List row pages (where the block fills the stage) also applied inside the Outcome demo, which already pads its sides. The rule now applies only when the block is the whole demo, so the Outcome demo lines up at mobile, tablet and desktop widths. The Quote, Stat strip, List row and More case studies pages look as before.
- Quote page, Outcome page and the tablet preview: the demo quotes now carry the curly quotation marks (“ and ”), as in the design file. Before, they had none. The component CSS does not add the marks; they are part of the quote text.

Added
- Quote page: a "Quotation marks" line in the Do list. Type the curly marks into the quote text and do not add them a second time.

## 0.8.2

Fixed
- Form field, sending state: while a form is sending, the fields' text and labels now use `text/neutral/secondary` (5.7:1 in Light, 6.0:1 in Dark) instead of the disabled grey (2.8:1), because the person's own words are still on screen and still sent. Disabled fields keep `text/neutral/disabled`. This is in `components.css`, so a site that copies it gets the fix when it updates to this release. No token name or value changed.

Changed
- Form field macro: a new `sending=true` option turns a field read-only for the sending state. `readonly=true` still works and does the same.
- Form field page: the sending state has its own demo (single-line and multi-line fields) and its own row in the States table. The page says to set `aria-busy="true"` on the form while it submits and remove it afterward, and shows that in a code sample only, so the demo does not stay busy. It also says any read-only field uses the sending look.
- Form field page: the first demo has the sentence "All fields are required." above the first field, and the page explains it (WCAG 3.3.2).
- `npm run check:a11y`: the held entry for the read-only field is removed, so the check holds no known problems.

## 0.8.1

Fixed
- No visible change: below 1024px the site footer's logo link has no visible name, so it now leaves the tab order and the screen reader's view too (`visibility: hidden`, so nothing moves). Before, keyboard focus could land on it with nothing to see. This is in `components.css`, so a site that copies it gets the fix when it updates to the next release.
- Docs fix: with the menu open below 1024px, pressing Tab past its last link moved focus to the page behind the panel, out of sight. The menu now closes when focus leaves it.
- Docs fix: the Credits demo heading was white on yellow in Dark (1.5:1) because a docs heading rule overrode the component's color. Headings inside a demo now keep the component's own color. The Section split name, the Outcome name and the Stat strip heading also show their own colors now, where the docs rule had made them near-black or white.
- Docs fix: the page hero is a region named "Page introduction", so it no longer shares its name with the page's first section (25 pages listed the same landmark name twice).
- Docs fix: "The HTML" code blocks on ten pages showed the browser's 1px focus outline. They now show the same 4px ring as the other code blocks.
- Docs fix: the Site footer demo's logo link is named "Site name, home", so its name starts with the visible name. The Email demo has `autocomplete="email"`.

Changed
- Link card: the card's own text names the link (title, line of text and button label), with no `aria-labelledby` and no `aria-hidden` on the button look. Before, the name was the title only, so the visible button text was not in it. The Link card page and the Overview cards follow this.
- The standard is WCAG 2.2 AA, named on the Accessibility page and in the side nav.

Added
- `npm run check:a11y`: axe-core on every page in Light and Dark, and three keyboard checks. It adds two dev dependencies, `playwright` and `@axe-core/playwright`. It is not part of `npm run build`.
- Accessibility page: a list of accepted exceptions with the reason for each, and a note on how the automated scan runs.

## 0.8.0

Changed
- Visible: the case-study list row (More case studies) uses spacing tokens for its padding. On mobile the top and bottom padding is 24px (it was 20px). From 768px up it is 32px (it was 28px). An unlocked row on tablet and desktop is 112px tall (it was 104px), and the tablet locked row is 152px tall when its helper line wraps to two lines (it was 144px).
- Visible: in the jump nav bar, the gap between "On this page" and the current section is 4px on mobile (it was 2px). The bar's side padding uses `space/fine/8` (it was 6px) with no change you can see, because the bar has a fixed height.
- Visible: the text field's top padding is `space/base/24` (it was 26px). Measured in the browser: single-line text sits 1px higher in the box, and multiline text sits 2px higher. A floated label's line (8px from the top, 18px tall) now meets the single-line text, where it used to leave a 1px gap, and overlaps the start of the first multiline text line by 2px, where it used to meet it.
- No visible change: the icon buttons' side padding subtracts `space/fine/4` instead of a literal 4px.

Added
- Docs pages for eighteen components: Case study hero, Jump nav, Section split, Outcome, Site footer, Image tile, Image gallery, Lightbox, Motion control, Credits, Disclaimer, Next case study, More case studies, Top nav, Menu overlay, Skip link, Icon and Logo.

Fixed
- Docs fix: links inside a live demo no longer take the docs site's text-link color, which sat on top of the component's own color. The footer's name was blue on the blue footer and so could not be seen. The Next case study title was blue instead of near-black. Link card and List row text were blue too. Normal docs text links are unchanged. This changes the docs site only, not the components or the manifest.
- Docs fix: from 1024px up the side nav cropped the left and right of the focus ring on the current item, so only a bar above and below showed. The nav now has room for the whole ring, and the links have not moved. Twenty pages (17 of the new ones, and Page hero, Link card and CTA band) showed their tables with a centered header, a centered first column and no row lines. They now use the same docs table as the other pages. The List row page has a locked row in the demo, and its tablet frame is 8px taller so it no longer scrolls inside. The Quote page's tablet frame was 18px too short for its content and is now tall enough (a check of all 11 preview frames found no others). This changes the docs site only, not the components or the manifest.


## 0.7.1

Fixed
- Visible: on screens wider than 1440px the page hero text sat at the far left of the screen, away from the site name and the side nav. The hero's side padding now uses the same page padding as the header and the page, so the text lines up with them at every width. Up to 1440px nothing moves.
- Docs: the preview frames on the List row, Quote and Menu item pages showed their outline as two broken brackets, because the frame covered it. The outline is now a border on the frame.

## 0.7.0

Added
- Tablet layouts (768 to 1023px) for the List row and the Quote. The List row sits on the 8-column grid: title in columns 1 to 4, category in 5 and 6, arrow cell in 7 and 8. The locked row is 144px tall, with its helper line under the lock. The Quote's offset split puts the attribution in columns 1 and 2 and the quote in columns 3 to 8.
- A Menu item docs page for the menu dropdown link: 44px tall, 15/22 on mobile and 16/24 on tablet, with default, hover, focus and current states.
- Docs: fixed-width preview frames on the List row, Quote and Menu item pages, so each breakpoint shows on any screen.
- Docs: the end mark spacing on the Spacing and grid page.

Changed
- Visible: the expand chip's default border uses `border/neutral/strong` instead of `border/brand/default`, so it keeps 3:1 against its fill and the tint in Light and Dark. Hover and pressed still use the brand border.
- Visible: the pause and play control for animated GIFs follows the same border rule as the expand chip: `border/neutral/strong` at rest, `border/brand/default` on hover and pressed.
- Visible: at tablet width the Quote text is 28/36 (it was 24/32). It now follows the Quote type tokens at every width.
- Docs: Canon's end mark sits under the last content block when a page has no text column, and 24px (`base/24`) above the 4px rule.

Removed
- The unused `.contact-form__noscript` rule. The portfolio's Contact page no longer has a no-JavaScript line.

## 0.6.0

Added
- A Link card component (`.link-card`): one card that is one link, with a title, one line of text and a primary button at the bottom. It has default, hover, pressed and focus states.
- An on-brand text link (`.link--on-brand`): underlined and 32px tall, with default, hover, pressed, focus and disabled states.
- A Page hero component (`.docs-hero`): the blue band at the top of every docs page, with an eyebrow, a title and a lead. It steps its padding and type at the three breakpoints.
- New color roles: `interactive/link/on-brand/default`, `/hover`, `/pressed` and `/disabled`, and `interactive/button/primary/on-brand/indicator`.
- Three docs pages, after List row: Link card, CTA band and Page hero.
- A build check that every page listed in the nav was built (`npm run check:nav`).
- Contrast checks for the on-brand link in all modes and for the Canon active bar on the on-brand primary button.

Changed
- Visible: below 1024px the theme toggle moved from the top bar to the footer, so the bar can show the full section and page title.
- Visible: the home page cards use the Link card. The button is primary instead of secondary, the cards have a pressed state, and the surface is white with a 1px border instead of the blue tint.
- Visible: on the on-brand primary button in Canon, hover is Greece Blue 50 and pressed is Greece Blue 100. Active uses the white default fill, not the pressed fill, with a 4px bar in the new indicator role.
- Visible: every docs page now opens with the Page hero instead of a title on the white page.
- The "Back to" link in the next-page band uses the on-brand link roles. It looks the same.
- The Components card button on the home page reads "View Components" (it was "View components").
- Docs: the "Continue to" band at the end of each page now uses the Figma padding: 48px above and below and 16px at the sides on mobile, 64 and 32 on tablet, 80 and 64 from 1024px.
- Docs: the side nav is capped to the window height with its padding inside the cap, so its last links can be reached with the keyboard on a short window.

Note
- The class name `.page-hero` is reserved for the portfolio's About and Contact hero. Its rules stay in `components.css` unchanged; the docs Page hero is `.docs-hero`.
- The new roles in the four frozen modes (Klarheit, Ethos, Nøktern, Omtanke) come from the design file and pass the contrast checks, but nobody has reviewed them by eye. Treat them as unverified.
- The frozen modes keep their previous on-brand primary hover and pressed values.

## 0.5.0

A Canon-focused release. Canon is the mode in active use; the other four modes are kept but frozen until a named piece of content needs one.

Added
- Docs: a sticky bar below 1024px that names the section and page and holds a Menu button. The menu opens as a dropdown panel with "Page N of 13", marks the current page, closes on Escape, on a page pick or on a tap on the dim behind it, and moves focus to the page title after you pick a page.
- Docs: a band at the end of every page in the nav order with a "Continue to" button, a one-line description of the next page and a link back to the previous page. The order is built from `src/_data/nav.js`, so a new page joins the sequence when it is added there.
- Component styles for the primary button on a brand surface (`.button--primary.button--on-brand`), using the existing on-brand primary button roles. No new tokens.

Removed
- Docs: the Mode dropdown in the header, and the Color modes group in the side nav and menu. The mode pages are still reachable by direct link, for example `/foundations/color/klarheit/`.
- Docs: the saved color mode. The site no longer stores a choice in `localStorage`.

Changed
- Visible: the button on each mode page now reads "View this page in {mode}" and applies to that page only. Every other page opens in Canon.
- Visible: below 1024px the menu is a dropdown under a sticky bar instead of a collapsible block in the page.
- Docs: the Color modes page says the four non-Canon modes are explorations, and that a mode ships only when there is named content that needs it.
- Visible: the home page cards now show a button.
- Docs: the home page and modes page now lead with Canon, and the touch-target and contrast wording is corrected.
- No token value changed. Canon is the same as in 0.4.0, and the tokens of the other four modes are unchanged.

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
- Klarheit Dark: `--arche-text-neutral-secondary` is Neutral 200 instead of Neutral 300, so captions on the brand tint pass AA (5.3:1, was 4.03:1). The contrast check now includes this pair.
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
