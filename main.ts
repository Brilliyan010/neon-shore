// Neon Shore — Vice City Cover Studio, handed in for gta6-cover-art-01.
// A Node 22 program, standard library only. It copies the app (app/ : plain
// static files, an offline cover maker with no build step and no network
// request) and the screenshots (screenshots/ : the exported covers and the
// editor at work) from beside this file into /output, then writes
// /output/dossier.json with the vendored make.fun library — the summary the
// judge reads. Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in
// for /output, e.g. `MAKEFUN_OUTPUT_DIR=out node main.ts`.
//
// The app itself: six multi-panel layouts, six sunset/neon colour grades,
// per-panel crop and position, editable gradient title lettering, film grain,
// vignette and halftone, and one-click PNG export at 1080x1080, 1080x1350
// and 1920x1080. Photos are read on the maker's own machine, never uploaded.
// Every font ships under app/fonts/ under the SIL Open Font License.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copies a directory tree from the repo into the output directory. */
function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

// The program is deterministic: it writes only the repo's files and the dossier
// the library builds from them, so two runs write the same bytes — the grader
// runs it twice and compares. Nothing here reads the clock, the network or
// any path outside this repository.
copyTree(join(here, 'app'), join(out, 'app'));
if (existsSync(join(here, 'screenshots'))) {
  copyTree(join(here, 'screenshots'), join(out, 'screenshots'));
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the other limits refuse an entry the scorer would refuse — more than
// 4 screenshots or one over 256 KiB, more than 993 files in app/ or 48 MiB of
// app files in all, or a path under app/ over 1000 bytes. app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
