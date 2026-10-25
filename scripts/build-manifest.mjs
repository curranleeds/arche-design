// Writes arche.manifest.json: the files a site copies from Arche, each with a SHA-256 hash,
// plus the Arche version. A site that uses Arche copies these files and checks the hashes.
//
// Run it with:  npm run manifest   (npm run build runs it for you)

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const manifestPath = join(root, "arche.manifest.json");

// The files a site copies. A folder means every file inside it.
const SHARED = [
  "src/css/tokens.css",
  "src/css/components.css",
  "src/css/case-study.css",
  "src/css/fonts.css",
  "src/assets/fonts",
  "src/assets/icons",
  "src/assets/js/theme.js",
  "src/_includes/components.njk",
  "src/_includes/theme-toggle.njk",
  "src/_includes/theme-switch.njk",
];

const walk = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => walk(join(path, name)))
    : [path];

const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

// Returns the manifest as an object. The check script uses this to compare with the file on disk.
export function buildManifest() {
  const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const files = {};
  for (const entry of SHARED) {
    for (const file of walk(join(root, entry))) {
      files[relative(root, file).split("\\").join("/")] = hash(file);
    }
  }
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
  return { arche: version, algorithm: "sha256", files: sorted };
}

export const manifestText = () => JSON.stringify(buildManifest(), null, 2) + "\n";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = buildManifest();
  writeFileSync(manifestPath, manifestText());
  console.log(`Wrote arche.manifest.json (Arche ${manifest.arche}, ${Object.keys(manifest.files).length} files)`);
}
