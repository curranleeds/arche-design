# Arche Design System

Arche (AR-kee, from the Greek *arche*, "first principle") is the design system behind my personal brand. This repo is its documentation site: the tokens, type, color and components, and the reasons behind them.

It began as the design system for my portfolio at [curranleeds.com](https://curranleeds.com) and is written so other designers and teams could use it.

This README tells how Arche came to be, what has been decided, and what is still open. For how to run and publish the site, skip to [Run it on your computer](#run-it-on-your-computer).

## How Arche came to be

**October 2026: a brand becomes a system.** I built my personal brand and portfolio site on a small design system: a Figma file with variables for color, spacing and role tokens, 45 text styles, and a set of components. The site's CSS is generated from that Figma file, so the design and the code share one source.

Once it worked for the portfolio, I saw it could do more than one job. A design system that holds up in regulated healthcare work (WCAG AA, visible focus, clear states, dark mode) is useful beyond a portfolio. The first step was to document it in public, so this site came first. It doubles as a portfolio piece and as a demo of how I think about systems.

**One system, five color modes.** I then rethought the system as one system with several color modes, not one fixed palette. Each mode takes its character from one of the four national traditions in my heritage, Swiss, Norwegian, Swedish and Greek, plus a default. That pushed the name too: a system with modes for several traditions needed a name that belonged to none of them.

**The name.** The working name was "Leeds Design System", after me. That did not fit a system meant to be shared. "Koine" (Greek for "common" or "shared") came next, and I set it aside while I looked at other options, including "Common" and "Meridian". I settled on **Arche**: the Greek word for a beginning and a first principle. It describes how the system works. It starts from a few rules and lets everything else follow.

The mode name "Ethos" was chosen over "Arche" for the Greek mode, because "Ethos" points at character and "Arche" now names the whole system.

## What has been decided

| Decision | Choice |
|---|---|
| System name | Arche Design System (pronounced AR-kee) |
| Repo and npm package name | `arche-design` |
| Source of truth | The Figma file "Arche Design System": tokens, text styles and components |
| Modes | Canon (`canon`, default), Klarheit (`klarheit`, Swiss), Nøktern (`noktern`, Norwegian), Omtanke (`omtanke`, Swedish), Ethos (`ethos`, Greek) |
| What a mode changes | Only the semantic color roles. Primitives, type, spacing, grid, corner radius, motion and component structure are the same in every mode. |
| What a mode never changes | Status colors: Alert/Error, Success and Warning |
| How components read color | From semantic roles, never from color primitives |
| Code names | Plain ASCII in code, file names, CSS and token paths. Display names can keep the ø. |
| Hosting | A free Cloudflare Workers address first, with no custom domain yet |
| Search engines | The site asks not to be indexed (`noindex`) until it is ready |
| Variable prefix | Every CSS variable starts with `--arche-` (for example `--arche-primary-500`). This protects against name collisions when Arche sits next to other stylesheets. `npm run check` enforces it. |
| Norway Red | The logo, plus one device per mode that uses it: Canon's end mark and Nøktern's Cross. Never on text, controls, validation or cards. |

**Runtime hooks.** Arche exposes a few runtime hooks: `--arche-site-nav-offset`, `--arche-lb-max` and `--arche-lb-ratio`. A host site sets them with JavaScript. If it does not, the CSS fallbacks apply.

## Still open

- **Mode colors.** The color primitives so far are Greece Blue `#014488`, Sweden Blue `#005293`, Norway Blue `#003698`, Sweden Yellow `#FFCD00`, Norway Red `#D21034`, Swiss Red `#FF0000` on screen and in digital (also the Alert/Error color) and `#DA291C` in print, black and white. The five modes are built into the tokens as of release 0.3.0.
- **License.** Not chosen yet. Until one is added, the code is visible but not licensed for reuse. The fonts keep their own license (SIL Open Font License).
- **Domain.** Not bought yet.

## Where modes fit

The system has three layers. Modes go in the middle one.

1. **Primitives:** raw colors such as `--arche-primary-500`. The same in every mode.
2. **Semantic roles:** names by job, such as `--arche-text-brand-primary` or `--arche-surface-neutral-base`. This is where a mode changes values. Canon is the default set.
3. **Components:** read only roles, so they never change between modes.

Dark and light work with a `data-theme` attribute on the `<html>` tag. A mode is a second attribute, `data-mode`, with one block of role values per mode, each with a light and a dark version, listing only the roles that differ from Canon. No attribute means Canon. Status colors stay out of every mode block. The docs site has a Mode menu in its header that sets the attribute and remembers the choice in `localStorage`; it is for the docs only, and components never read it.

## What is in the docs site today

Version 0.3.0: the foundations (color, type, spacing and grid, motion and focus, accessibility), a color page for each of the five modes with its contrast ratios, and seven components (button, link, form field, theme controls, stat strip, quote, list row). Every color, size and contrast ratio on the foundations pages is read from `tokens/figma-tokens.json` when the site builds, so the docs cannot drift from the tokens. The demo numbers and quotes on the component pages are placeholders, not results.

## How a site updates Arche

A site that uses Arche records which Arche version it uses. It copies the files listed in `arche.manifest.json` (the CSS, fonts, icons, `theme.js` and the shared templates), each with a SHA-256 hash (a fingerprint of the file's contents). The site then checks its copies against those hashes, so it knows when a file has changed or drifted. `npm run manifest` rebuilds the manifest here, and `npm run build` does it for you.

## How it was made

I made the design decisions and set the rules. I used Claude and Claude Code as working tools to build the documentation site and to draft copy, and I review what goes public.

## Run it on your computer

You need Node.js 20 or newer.

```
npm install
npm start
```

`npm install` downloads the build tool (Eleventy). `npm start` builds the site and serves it at http://localhost:8080, and rebuilds when you save a file. `npm run build` writes the finished site to `_site/`.

## What is in here

| Path | What it is |
|---|---|
| `src/css/tokens.css` | The design tokens as CSS variables. Generated from Figma. Do not edit by hand. |
| `src/css/components.css`, `src/css/case-study.css` | Component styles. They read only role tokens. |
| `src/css/fonts.css`, `src/assets/fonts/` | Archivo and Work Sans, self-hosted (SIL Open Font License). Both include the Latin accents, including ø. Neither includes Greek script. |
| `src/css/docs.css` | Styles for the documentation pages only. |
| `tokens/figma-tokens.json` | Export of the Figma variables. The foundations pages are built from it. |
| `src/_data/` | `tokens.js` prepares the token data. `nav.js` is the side navigation. `site.js` holds the site name and URL. |
| `src/foundations/`, `src/components/` | One page per topic. |
| `.eleventy.js` | Build settings, the icon helper and the `demo` helper that shows live HTML next to its code. |

## Add a component page

1. Copy a file in `src/components/` and rename it.
2. Change the front matter at the top (`title`, `lead`, `permalink`).
3. Put the live example between `{% demo "Caption" %}` and `{% enddemo %}`. The site shows it and prints its HTML underneath.
4. Add the page to `src/_data/nav.js`.

## Publish with Cloudflare

The site is served by Cloudflare as a Workers project with static assets. It builds from this repo each time you push to `main`. The live address is https://arche-design.curranleeds.workers.dev.

- Build command: `npm run build`
- Output folder: `_site`, set in `wrangler.jsonc` (`assets.directory`)
- Node version: 20, set in `.node-version`, so no `NODE_VERSION` variable is needed in the dashboard

`url` in `src/_data/site.js` holds the live address so canonical links are right. Change it if the address changes (for example, with a custom domain). When the site is ready to be found, remove the `noindex` line in `src/_includes/base.njk`.
