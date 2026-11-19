// Neon Shore cover presets: the panel layouts and colour grades the editor offers.
// Every panel rect is in unit space (0..1 of the cover), so one layout works at
// 1080x1080, 1080x1350 and 1920x1080 alike. `r` is a tilt in degrees for layouts
// whose panels lean like taped-up snapshots.

/** The six panel layouts, from the classic five-panel poster to a single hero. */
export const LAYOUTS = {
  poster5: {
    label: 'Poster 5',
    blurb: 'Classic multi-panel poster: one hero, four scenes',
    panels: [
      { x: 0.0, y: 0.0, w: 0.56, h: 1.0 },
      { x: 0.56, y: 0.0, w: 0.44, h: 0.34 },
      { x: 0.56, y: 0.34, w: 0.22, h: 0.33 },
      { x: 0.78, y: 0.34, w: 0.22, h: 0.33 },
      { x: 0.56, y: 0.67, w: 0.44, h: 0.33 },
    ],
  },
  trio: {
    label: 'Hero Trio',
    blurb: 'One wide hero above two scenes',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.62 },
      { x: 0.0, y: 0.62, w: 0.5, h: 0.38 },
      { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
    ],
  },
  grid9: {
    label: 'Nine Grid',
    blurb: 'A 3 x 3 contact sheet of moments',
    panels: [
      { x: 0.0, y: 0.0, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 0.0, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 0.0, w: 1 / 3, h: 1 / 3 },
      { x: 0.0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 0.0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
  },
  hero: {
    label: 'Single Hero',
    blurb: 'One photo, full bleed, big lettering',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0 }],
  },
  tilted: {
    label: 'Tilted Snaps',
    blurb: 'Overlapping snapshots, taped at an angle',
    panels: [
      { x: 0.04, y: 0.03, w: 0.6, h: 0.7, r: -4 },
      { x: 0.44, y: 0.16, w: 0.54, h: 0.64, r: 3 },
      { x: 0.14, y: 0.6, w: 0.74, h: 0.36, r: -1.5 },
    ],
  },
  strip: {
    label: 'Film Strip',
    blurb: 'Four tall frames side by side',
    panels: [
      { x: 0.0, y: 0.0, w: 0.25, h: 1.0 },
      { x: 0.25, y: 0.0, w: 0.25, h: 1.0 },
      { x: 0.5, y: 0.0, w: 0.25, h: 1.0 },
      { x: 0.75, y: 0.0, w: 0.25, h: 1.0 },
    ],
  },
};

/** The six colour grades: each paints a sunset or neon wash over every panel. */
export const GRADES = {
  vice: {
    label: 'Vice Sunset',
    swatch: 'linear-gradient(135deg,#ff9a3d,#ff2e88 55%,#7b2ff7)',
    top: '#ff9a3d',
    bottom: '#c62b8a',
    overlayAlpha: 0.5,
    tint: '#ff5e3a',
    tintAlpha: 0.22,
    accent: '#ffd166',
    titleTop: '#ffffff',
    titleBottom: '#ffd166',
  },
  neon: {
    label: 'Neon Night',
    swatch: 'linear-gradient(135deg,#00f5d4,#00bbff 45%,#ff2e88)',
    top: '#00f5d4',
    bottom: '#ff2e88',
    overlayAlpha: 0.55,
    tint: '#00bbff',
    tintAlpha: 0.2,
    accent: '#00f5d4',
    titleTop: '#ffffff',
    titleBottom: '#7df9e8',
  },
  dusk: {
    label: 'Palm Dusk',
    swatch: 'linear-gradient(135deg,#f7b733,#6a3093 60%,#1a0533)',
    top: '#f7b733',
    bottom: '#6a3093',
    overlayAlpha: 0.5,
    tint: '#b06ab3',
    tintAlpha: 0.22,
    accent: '#f7b733',
    titleTop: '#fff3d6',
    titleBottom: '#f7b733',
  },
  hotpink: {
    label: 'Hot Pink',
    swatch: 'linear-gradient(135deg,#ff7ad9,#ff2e88 50%,#a100f2)',
    top: '#ff7ad9',
    bottom: '#a100f2',
    overlayAlpha: 0.55,
    tint: '#ff2e88',
    tintAlpha: 0.25,
    accent: '#ff7ad9',
    titleTop: '#ffffff',
    titleBottom: '#ff9de2',
  },
  noir: {
    label: 'Teal Noir',
    swatch: 'linear-gradient(135deg,#2ec4b6,#0f4c5c 55%,#011627)',
    top: '#2ec4b6',
    bottom: '#0f4c5c',
    overlayAlpha: 0.5,
    tint: '#2ec4b6',
    tintAlpha: 0.18,
    accent: '#90e0d4',
    titleTop: '#eafffb',
    titleBottom: '#90e0d4',
  },
  golden: {
    label: 'Golden Hour',
    swatch: 'linear-gradient(135deg,#ffe259,#ffa751 55%,#e65c00)',
    top: '#ffe259',
    bottom: '#e65c00',
    overlayAlpha: 0.45,
    tint: '#ffb347',
    tintAlpha: 0.22,
    accent: '#ffe259',
    titleTop: '#fffbe8',
    titleBottom: '#ffe259',
  },
};

/** The three post sizes the app exports, in one click each. */
export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** A fresh cover state: the defaults a new visitor (or a screenshot scene) starts from. */
export function defaultCoverState() {
  return {
    layout: 'poster5',
    grade: 'vice',
    title: 'SUNSET HEIST',
    subtitle: 'Neon Shore',
    titleSize: 1.0,
    titleTilt: -2,
    titlePos: 'bottom',
    frame: true,
    grain: 0.6,
    vignette: 0.55,
    halftone: true,
    badge: true,
    panels: [],
  };
}
