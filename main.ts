// Neon Shore Cover Studio — entrypoint (make.fun gta6-cover-art-01).
//
// Copies the app (app/) and the screenshots (screenshots/) into the output
// directory and writes /output/dossier.json with buildDossier from the kit's
// vendor/makefun-app.ts library. Node 22, standard library only, no network,
// no randomness, no clock: two runs over the same repository produce
// byte-identical output.
//
// Usage:
//   node main.ts                       -> writes to /output (the grader)
//   MAKEFUN_OUTPUT_DIR=out node main.ts -> writes to out/ (local check)

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

// The scorer's own caps, from the competition kit's RULES.txt:
// dossier text 160 KiB; at most 4 screenshots of at most 256 KiB each;
// app/ at most 993 files and directories, 48 MiB in all, paths <= 1000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
} as const;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");
if (!existsSync(join(appDir, "index.html"))) fail("app/index.html is missing");
if (!existsSync(shotsDir)) fail("screenshots/ is missing");

// Start from a clean output directory so stale files can never leak in.
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Copy app/ and screenshots/ verbatim (plain files and directories only).
cpSync(appDir, join(outDir, "app"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

// The dossier must be byte for byte what buildDossier writes from the
// copied app/ and screenshots/ — so build it from the output directory
// itself, after the copies are in place.
const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, "dossier.json"), dossier);

const shotCount = ["01-neon-shore-cover.jpg", "02-editor.jpg", "03-portrait-cover.jpg", "04-square-grid.jpg"]
  .filter((name) => existsSync(join(outDir, "screenshots", name))).length;
console.log(`Neon Shore: wrote ${outDir} (app/, ${shotCount} screenshots, dossier.json ${dossier.length} bytes)`);
