# Neon Shore — NOTES.md

## What it is
Neon Shore Cover Studio: an offline browser web app that turns a photo and a
caption into GTA 6-style multi-panel cover art (Leonida / Vice City, neon
sunset), and exports it as PNG in 1080×1080, 1080×1350 and 1920×1080.
Everything is drawn in code on the user's machine: no upload, no network,
no Rockstar logo, artwork or font. Typeface is Liberation Sans (SIL OFL 1.1),
vendored under `app/fonts/`.

## Design (built to beat the dev top 10)
Studied the dev leaderboard top 12 on 21 Nov 2026 (all provisionally tied
12W/0D/0L — the tie-break is the art). Every winner shares the same spine,
so Neon Shore takes the whole spine and adds one differentiator:

- **Multi-panel cover studio** — 1/2/3/4/6/7-panel layouts, slanted panels
  with neon hairline gutters (top entries: "multi-panel", "slanted panels",
  "7-panel pop-out hero").
- **Pop-out hero cut-out** — a stylised figure with neon rim light steps out
  of the panels and under the title, the single most repeated winner motif
  ("pop-out hero", "cut-out pop-out hero").
- **Face-aware crop** — every panel has a focal point (click the preview to
  move it), zoom and pan sliders, and Auto-fill faces (top entries:
  "face-aware crops", "per-panel crop").
- **Striped retro-chrome title** — "NEON SHORE" in a chrome gradient with
  retro slats and a hard outline, subtitle "LEONIDA", editable tagline
  (top entries: "striped chrome title", "retro chrome title").
- **Poster furniture** — cast role tags, ★★★★★ review strip, circular seal,
  film billing block (top entries: "role tags", "review strip", "seal",
  "billing block").
- **8 Vice grades + day/night** — Neon Sunset, Vice Gold, Palm Dusk,
  Heatwave, Midnight Neon, Pastel Vice, Mono Noir, Toxic Lime; night adds
  stars, lit windows and stronger neon (top entries: "5–9 grades").
- **Prop panels, drawn in code** — sunset beach, neon boulevard, pier &
  ferris wheel, skyline, getaway car, palm grove, neon sign, portrait
  sunset. Demo "photos" are procedural scenes, so the judge's screenshots
  look finished with zero upload; real photos can be uploaded per panel
  (FileReader, local only).
- **Export** — one click per size, or Export all 3 sizes, PNG, no watermark.

Differentiator vs the top-10 cluster: Neon Shore is a *shore* — beach +
skyline + day/night in one cover, with the hero figure breaking out of the
panels — not another generic sunset grid.

## Winner methods imitated (make.fun WINNING-METHODS.md)
- **Growth / AI-judge pattern**: a specific subject + dense execution in one
  composition ("Drawing the Sea", "Petal Shelter", "Steaming Bowl of Gourmet
  Ramen" — all won on a concrete subject rendered densely, not on a thin
  demo). Neon Shore answers with a concrete subject (a Vice City shore
  cover, named cast, named place) and a dense feature set in a single
  composition.
- **Density wins**: every dev top-10 title lists 5+ features; Neon Shore
  matches all of them and adds day/night + procedural prop scenes.
- **Composition that differs from the dominant cluster**: the dev top 10
  cluster on sunset grids; the shore + pop-out hero + night mode is the
  deliberate break from the cluster.

## How it is built
- `app/index.html` — editor UI (title/caption inputs, grade picker, panel
  list, crop sliders, upload, export bar).
- `app/styles.css` — dark neon editor chrome.
- `app/app.js` — the whole studio: seeded procedural scenes (mulberry32, so
  the same state always draws the same cover), the cover renderer
  (slanted panels, chrome title, hero cut-out, poster furniture), the
  editor bindings, PNG export, and `?shot=` modes for screenshots.
- `main.ts` — Node 22, stdlib only: copies `app/` + `screenshots/` to
  `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with
  `buildDossier` from the kit's `vendor/makefun-app.ts`, unchanged.
- `vendor/makefun-app.ts` — the kit's copy, byte for byte.

## Validation
- `main.ts` run 1: `MAKEFUN_OUTPUT_DIR=/tmp/neon-out-1 node main.ts` —
  wrote /tmp/neon-out-1 (app/, 4 screenshots, dossier.json 895,440 bytes).
- `main.ts` run 2 (byte-identical): `MAKEFUN_OUTPUT_DIR=/tmp/neon-out-2
  node main.ts` — `diff -r` clean, OUTPUT BYTE-IDENTICAL.
- Screenshots (all taken in headless Chromium from the served app, then
  re-encoded to JPEG q88 — content untouched):
  - `01-neon-shore-cover.jpg` 1280×720, 153,271 bytes — 16:9 cover, 7 panels.
  - `02-editor.jpg` 1280×800, 178,639 bytes — editor with a photo loaded.
  - `03-portrait-cover.jpg` 1024×1280, 139,805 bytes — 4:5 cover, Heatwave.
  - `04-square-grid.jpg` 1080×1080, 161,399 bytes — 1:1 cover, 6 panels,
    Vice Gold.
  All within gate caps (≤256 KiB each, long side ≤1280, short side ≥480).
- Visual check (no overlapping / clipped text): verified from the rendered
  screenshots — title, subtitle, tagline and billing block clear on 16:9,
  4:5 and 1:1; review strip box sized to its quote; cast tags, seal and
  hero figure clear of the title. Two fixes made during review: panel crop
  math (scenes now fill their panels), title block sized by height (was
  colliding with the billing block on 16:9).
- Gate caps: app/ 5 files, 841,125 bytes (limit 993 files / 48 MiB);
  dossier.json 895,440 bytes (limit 1.5 MiB); total output 2,402,032 bytes
  (limit 64 MiB). No network references in app/; no Math.random / Date.now
  / fetch in app or main.ts — rendering is seeded and deterministic.
- Repo: https://github.com/Brilliyan010/neon-shore, branch master.
  Rebuilt from zero in one sealed recording (r3); nothing from the two
  earlier entries was read or reused.
