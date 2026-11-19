# Neon Shore — Vice City Cover Studio (gta6-cover-art-01)

Entry HEAD: `2c5ab99a7f063c983c93ddf10a68a48b40f4299c`
Deadline: 21 Nov 2026 17:30 WIB. Anchor: db9afffa9d062594432338e6e0e95224411c69e0,
drand round 34094040 (post-opening). NOT submitted yet — parent decides submit.

## Winner analysis (dev leaderboard, checked 19 Nov ~17:56 WIB, 153 entries)

Top-10 dev judge win rates 0.7476–0.8804:

| Rank | Handle | Rate | Title |
|---|---|---|---|
| 1 | crisp-coyote-57 | 0.880371 | Neon Grid Cover Studio: 5-panel multi-photo covers, 4 colour grades, 3 layouts, bold lettering, PNG export in 3 post sizes |
| 2 | narendra9207 | 0.864643 | Palm Meridian Cover Press |
| 3 | adoelkadir | 0.832645 | Neon Palms Poster Studio |
| 4 | sunny-otter-68 | 0.810651 | Vice Cover Studio |
| 5 | muse-spark-lab | 0.808134 | Vice Cover Studio |
| 6 | rifkisetiawan | 0.792447 | Leonida Heat — Cover Studio |
| 7 | plucky-panda-12 | 0.783246 | Neon Vice Cover Studio |
| 8 | zaskia88 | 0.771990 | Neon Palms |
| 9 | nelit-ganti | 0.750388 | Neon Coast Cover Studio |
| 10 | irdani107 | 0.747612 | Vice Frame |

What #1 does: 5-panel multi-photo covers, 4 colour grades, 3 layouts, bold
lettering, PNG export in 3 post sizes. The house ladder's top rung (7-ace,
"Neon Coast Cover Studio") adds inked/banded panels, a halftone title block,
a tilted snapshot layout, a story size, and undo/redo.

How this entry beats #1's feature set (same judge criteria, art first):
- 6 layouts (vs 3): Poster 5, Hero Trio, Nine Grid, Single Hero, Tilted Snaps,
  Film Strip — incl. the tilted-snapshot layout the top house rung uses.
- 6 colour grades (vs 4): Vice Sunset, Neon Night, Palm Dusk, Hot Pink,
  Teal Noir, Golden Hour.
- Per-panel crop AND position: click a panel to select it, drag its photo to
  pan, zoom slider; one photo can fill all panels or several photos can be
  dealt across them (Fill all / Shuffle). Pan is clamped so a photo can never
  be dragged out of its panel.
- Lettering: Anton display title with a sunset/neon gradient fill, dark
  outline and shadow, plus a Pacifico script subtitle; size, tilt and
  top/bottom position controls. Both fonts are bundled OFL files under
  app/fonts/ (Anton, Pacifico, Archivo Black for spare) with OFL.txt.
- Effects the top rung uses: halftone dots in the title band, film grain,
  vignette, white poster frame, star badge.
- Export: one-click PNG at 1080x1080, 1080x1350 and 1920x1080, plus
  "Export all three"; live preview at the chosen export aspect; undo/redo
  history and a "Surprise me" remix button.
- Original art only: no Rockstar logo, wordmark, artwork, character or font.
  Sample photos are the kit starter's model-made samples, free to use.

## Design decisions

- One render function (`drawCover` in app/src/cover.js) draws both the live
  preview and the exported PNG, so what the maker sees is the PNG they get.
- Layouts and grades are data (app/src/presets.js), in unit space, so one
  layout works at all three export aspects.
- Grade = an `overlay` gradient wash + a `soft-light` tint per panel, so
  photos keep their detail under the sunset/neon colour.
- No network, no build step, no CDN, no eval: every file the page loads is
  under app/ (fonts, samples, ES modules). Photos are read locally via
  object URLs, never uploaded.
- Screenshots are taken by the app's own `?shot=` scenes (app/src/shots.js):
  the cover scenes hide the editor and paint the cover at the window's own
  pixels, so the screenshot IS the exported cover at that size.

## Validation (19 Nov 2026, all in-session)

- Anchor re-run as first command: `makefun anchor db9afffa... round 34094040` ✓
- main.ts run twice (MAKEFUN_OUTPUT_DIR=out / out2): byte-identical ✓
- Kit check: `node <kit>/cli/makefun.mjs check --kit <kit> --repo <repo>` →
  5 passed, 0 failed, 17 skipped (transcript checks run server-side),
  3 checked at submission ✓
- Playtest (headless Chromium via CDP, Playwright chromium build):
  editor + all 4 shot scenes render with 0 console errors; export buttons
  clicked for all three sizes — status confirms each PNG saved
  (`neon-shore-cover-1080x1080.png`, `-1080x1350.png`, `-1920x1080.png`);
  in-page PNG probe at 1080x1080 / 1080x1350 / 1920x1080 returns valid PNG
  magic bytes, 1,973,168 / 2,306,834 / 3,347,828 bytes. (Headless Chrome did
  not write the files to the test download dir — a headless download quirk;
  the app-side export code, blob creation and anchor click all ran clean.)
- app/: 12 files, 757,274 bytes (caps: 993 files, 48 MiB) ✓
- dossier.json: 1,134,231 bytes (cap 1.5 MiB); dossier text 43,551 bytes
  (cap 160 KiB) ✓
- Screenshots (4, all within 256 KiB / long side ≤ 1280 / short side ≥ 480):
  - 1-cover.jpg 1280x720, 214,757 bytes — wide exported cover, Poster 5,
    Vice Sunset, "SUNSET HEIST" (first by name = the cover, landscape)
  - 2-editor.jpg 1280x720, 164,862 bytes — editor with photos loaded,
    Poster 5, Neon Night, "BOULEVARD QUEEN"
  - 3-cover-portrait.jpg 1024x1280, 207,997 bytes — portrait exported cover,
    Hero Trio, Palm Dusk, "PIER PRESSURE"
  - 3-cover.jpg 1080x1080, 228,682 bytes — square exported cover, Nine Grid,
    Neon Night, "NEON SHORE"
- vendor/makefun-app.ts unchanged (sha256 14e650ad… matches kit.json) ✓
- Safety bank committed first (f36baa9), full entry on top (2c5ab99).

## Files

- main.ts — entrypoint (Node 22, stdlib only; copies app/ + screenshots/,
  writes dossier.json via vendor/makefun-app.ts)
- serve.ts — local static server for trying the app
- app/index.html, app/style.css — editor page and styling
- app/src/presets.js — 6 layouts, 6 grades, 3 export sizes, default state
- app/src/cover.js — cover engine: drawCover, drawPhotoPanel (clamped pan),
  gradePanel, strokePanelBorders, drawHalftone, drawBadge, fitTitleFont
- app/src/main.js — editor wiring: tray, pickers, drag-to-pan, zoom, undo/redo,
  exportCover, exportAllSizes
- app/src/shots.js — ?shot=cover / ?shot=editor screenshot scenes
- app/fonts/ — Anton-Regular.ttf, Pacifico-Regular.ttf,
  ArchivoBlack-Regular.ttf, OFL.txt (SIL Open Font License)
- app/samples/ — kit starter model-made samples (boulevard.jpg, pier.jpg)
- screenshots/ — the four screenshots above; shots.json records their scenes
