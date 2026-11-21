/* Neon Shore Cover Studio — every pixel is drawn in code.
 *
 * No network, no upload, no randomness at render time: every procedural
 * scene uses a seeded PRNG, so the same state always draws the same cover.
 * Photos the user uploads stay on their machine (FileReader only).
 * No Rockstar logo, artwork or font is used anywhere.
 */
"use strict";

/* ---------- deterministic PRNG (mulberry32) ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Vice grades ---------- */
const GRADES = [
  { id: "neon-sunset", name: "Neon Sunset", sky: ["#2b1055", "#c81d6e", "#ff7e3d", "#ffc44d"], sun: "#ffe9a8", tint: "rgba(255,46,136,0.10)", title: ["#ffffff", "#19e3ff", "#ff2e88", "#ffc44d"] },
  { id: "vice-gold", name: "Vice Gold", sky: ["#1d2a5e", "#b3541e", "#ff9a3d", "#ffd76a"], sun: "#fff3c4", tint: "rgba(255,180,60,0.10)", title: ["#ffffff", "#ffd76a", "#ff7e3d", "#fff3c4"] },
  { id: "palm-dusk", name: "Palm Dusk", sky: ["#160b33", "#5b1a63", "#d94f70", "#ff9d76"], sun: "#ffd0a8", tint: "rgba(120,60,200,0.12)", title: ["#ffffff", "#c9a7ff", "#ff5e8a", "#ffb37a"] },
  { id: "heatwave", name: "Heatwave", sky: ["#3d0c2e", "#a4133c", "#ff4d2e", "#ffcf3d"], sun: "#fff0b0", tint: "rgba(255,60,40,0.12)", title: ["#ffffff", "#ffcf3d", "#ff4d2e", "#ff8a5c"] },
  { id: "midnight-neon", name: "Midnight Neon", sky: ["#050514", "#0f1e5e", "#123a8f", "#19e3ff"], sun: "#bdf3ff", tint: "rgba(25,227,255,0.10)", title: ["#ffffff", "#19e3ff", "#7b2fff", "#ff2e88"] },
  { id: "pastel-vice", name: "Pastel Vice", sky: ["#5e3a7a", "#c97ba8", "#ffb3c8", "#ffe3a3"], sun: "#fff8e0", tint: "rgba(255,150,200,0.10)", title: ["#ffffff", "#ffd6ec", "#ff8ab8", "#ffe3a3"] },
  { id: "mono-noir", name: "Mono Noir", sky: ["#0a0a0c", "#2a2a30", "#6a6a72", "#d8d8de"], sun: "#f2f2f2", tint: "rgba(255,255,255,0.06)", title: ["#ffffff", "#d8d8de", "#8a8a92", "#ffffff"] },
  { id: "toxic-lime", name: "Toxic Lime", sky: ["#0b1f0b", "#14532d", "#4ade80", "#d9f99d"], sun: "#f7fee7", tint: "rgba(74,222,128,0.10)", title: ["#ffffff", "#a3e635", "#4ade80", "#f7fee7"] },
];

/* ---------- procedural demo scenes ---------- */
/* Each scene draws into a small offscreen canvas (540x680 portrait base).
 * `focal` is the face-aware point (0..1) the crop centres on. */
const SCENES = [
  { id: "beach", name: "Sunset Beach", focal: [0.5, 0.38] },
  { id: "boulevard", name: "Neon Boulevard", focal: [0.5, 0.55] },
  { id: "pier", name: "Pier & Wheel", focal: [0.62, 0.4] },
  { id: "skyline", name: "Vice Skyline", focal: [0.5, 0.45] },
  { id: "car", name: "Getaway Car", focal: [0.5, 0.6] },
  { id: "palms", name: "Palm Grove", focal: [0.5, 0.35] },
  { id: "neon-sign", name: "Neon Sign", focal: [0.5, 0.45] },
  { id: "portrait", name: "Portrait Sunset", focal: [0.5, 0.3] },
];

function skyGradient(ctx, w, h, grade, night) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const stops = night
    ? ["#050514", "#141038", "#3a1c5e", "#7a2a6e"]
    : grade.sky;
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (night) {
    const r = mulberry32(7);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 60; i++) {
      const x = r() * w, y = r() * h * 0.45, s = r() * 1.6 + 0.4;
      ctx.globalAlpha = 0.3 + r() * 0.7;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }
}

function drawSun(ctx, w, h, grade, night) {
  const cx = w * 0.5, cy = h * (night ? 0.22 : 0.42), rad = w * 0.16;
  const glow = ctx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, rad * 2.6);
  glow.addColorStop(0, night ? "rgba(220,240,255,0.55)" : "rgba(255,200,90,0.55)");
  glow.addColorStop(1, "rgba(255,120,80,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = night ? "#e8f4ff" : grade.sun;
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
  if (!night) { // retro sun slats
    ctx.fillStyle = grade.sky[0];
    for (let i = 0; i < 4; i++) {
      const y = cy + rad * (0.15 + i * 0.22);
      ctx.fillRect(cx - rad, y, rad * 2, rad * 0.07);
    }
  }
}

function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(lean); ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = 7; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -70, 6, -140); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13);
    ctx.beginPath();
    ctx.moveTo(6, -140);
    ctx.quadraticCurveTo(6 + Math.cos(a) * 70, -140 + Math.sin(a) * 34, 6 + Math.cos(a) * 118, -140 + Math.sin(a) * 78);
    ctx.lineWidth = 5; ctx.stroke();
  }
  ctx.restore();
}

function drawSkyline(ctx, w, h, baseY, grade, night, seed) {
  const r = mulberry32(seed);
  let x = -10;
  while (x < w + 10) {
    const bw = 26 + r() * 54, bh = h * (0.16 + r() * 0.3);
    ctx.fillStyle = "#0d0714";
    ctx.fillRect(x, baseY - bh, bw, bh + 4);
    if (r() < 0.6) { // antenna
      ctx.fillRect(x + bw / 2 - 1, baseY - bh - 16 - r() * 14, 2, 16 + r() * 14);
      ctx.fillStyle = night ? "#ff2e88" : "#ff5e8a";
      ctx.fillRect(x + bw / 2 - 2, baseY - bh - 18 - r() * 14, 4, 4);
      ctx.fillStyle = "#0d0714";
    }
    // lit windows
    ctx.fillStyle = night ? "rgba(255,196,77,0.85)" : "rgba(255,220,140,0.5)";
    for (let wy = baseY - bh + 8; wy < baseY - 8; wy += 13) {
      for (let wx = x + 5; wx < x + bw - 6; wx += 11) {
        if (r() < (night ? 0.42 : 0.2)) ctx.fillRect(wx, wy, 5, 7);
      }
    }
    x += bw + 2 + r() * 8;
  }
}

/* One scene painter: draws a full demo "photo" on ctx (w x h). */
function drawScene(ctx, w, h, sceneId, grade, night, seed) {
  const r = mulberry32(seed);
  skyGradient(ctx, w, h, grade, night);
  switch (sceneId) {
    case "beach": {
      drawSun(ctx, w, h, grade, night);
      ctx.fillStyle = night ? "#0a1a33" : "#1e6f8e";
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let i = 0; i < 5; i++) ctx.fillRect(w * r(), h * (0.64 + r() * 0.2), w * 0.2, 2);
      ctx.fillStyle = night ? "#1c1420" : "#e8a56b";
      ctx.fillRect(0, h * 0.84, w, h * 0.16);
      drawPalm(ctx, w * 0.12, h * 0.88, 0.9, -0.12, "#0d0714");
      drawPalm(ctx, w * 0.88, h * 0.9, 1.1, 0.14, "#0d0714");
      // tiny strolling figure
      ctx.fillStyle = "#0d0714";
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.8, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(w * 0.5 - 4, h * 0.8, 8, 22);
      break;
    }
    case "boulevard": {
      drawSun(ctx, w, h * 0.8, grade, night);
      drawSkyline(ctx, w, h, h * 0.78, grade, night, seed + 3);
      // street
      ctx.fillStyle = "#12081f"; ctx.fillRect(0, h * 0.78, w, h * 0.22);
      ctx.fillStyle = "#ffc44d";
      for (let i = 0; i < 6; i++) ctx.fillRect(w * (0.05 + i * 0.17), h * 0.88, w * 0.07, 4);
      // neon signs
      const signs = ["#ff2e88", "#19e3ff", "#ffc44d", "#a3e635"];
      for (let i = 0; i < 4; i++) {
        const sx = w * (0.08 + i * 0.22), sy = h * (0.3 + (i % 2) * 0.14);
        ctx.save(); ctx.shadowColor = signs[i]; ctx.shadowBlur = 18;
        ctx.fillStyle = signs[i]; ctx.fillRect(sx, sy, w * 0.13, h * 0.045); ctx.restore();
      }
      drawPalm(ctx, w * 0.06, h * 0.8, 0.8, -0.1, "#0d0714");
      drawPalm(ctx, w * 0.94, h * 0.8, 0.8, 0.1, "#0d0714");
      break;
    }
    case "pier": {
      drawSun(ctx, w, h, grade, night);
      ctx.fillStyle = night ? "#0a1a33" : "#1e6f8e";
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
      // ferris wheel
      const cx = w * 0.62, cy = h * 0.34, rad = w * 0.2;
      ctx.strokeStyle = "#0d0714"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = night ? "#ff2e88" : "#ffc44d";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(cx - rad, cy); ctx.lineTo(cx + rad, cy); ctx.moveTo(cx, cy - rad); ctx.lineTo(cx, cy + rad); ctx.stroke();
      // pier planks
      ctx.fillStyle = "#241428";
      ctx.beginPath(); ctx.moveTo(w * 0.3, h); ctx.lineTo(w * 0.46, h * 0.62); ctx.lineTo(w * 0.56, h * 0.62); ctx.lineTo(w * 0.78, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,196,77,0.7)"; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const t = i / 6; ctx.beginPath(); ctx.moveTo(w * (0.3 + t * 0.16), h * (1 - t * 0.38)); ctx.lineTo(w * (0.78 - t * 0.22), h * (1 - t * 0.38)); ctx.stroke(); }
      break;
    }
    case "skyline": {
      drawSun(ctx, w, h, grade, night);
      drawSkyline(ctx, w, h, h * 0.72, grade, night, seed + 5);
      ctx.fillStyle = "#0d0714"; ctx.fillRect(0, h * 0.72, w, h * 0.28);
      drawPalm(ctx, w * 0.1, h * 0.76, 1.0, -0.1, "#05030a");
      drawPalm(ctx, w * 0.9, h * 0.76, 1.2, 0.12, "#05030a");
      break;
    }
    case "car": {
      const g2 = ctx.createLinearGradient(0, 0, 0, h);
      g2.addColorStop(0, grade.sky[1]); g2.addColorStop(1, grade.sky[2]);
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h * 0.66);
      drawSun(ctx, w, h * 0.66, grade, night);
      ctx.fillStyle = "#160a24"; ctx.fillRect(0, h * 0.66, w, h * 0.34);
      ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fillRect(0, h * 0.66, w, 3);
      // sports car silhouette — low, flat profile so it reads as a car
      ctx.fillStyle = "#0d0714";
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.72);
      ctx.lineTo(w * 0.28, h * 0.685);
      ctx.lineTo(w * 0.4, h * 0.6);
      ctx.lineTo(w * 0.58, h * 0.585);
      ctx.lineTo(w * 0.7, h * 0.63);
      ctx.lineTo(w * 0.9, h * 0.67);
      ctx.lineTo(w * 0.93, h * 0.72);
      ctx.closePath(); ctx.fill();
      // cabin glass
      ctx.fillStyle = "rgba(25,227,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.615); ctx.lineTo(w * 0.56, h * 0.6);
      ctx.lineTo(w * 0.66, h * 0.635); ctx.lineTo(w * 0.44, h * 0.645);
      ctx.closePath(); ctx.fill();
      // neon underglow + wheels
      ctx.save(); ctx.shadowColor = "#ff2e88"; ctx.shadowBlur = 24;
      ctx.fillStyle = "#ff2e88"; ctx.fillRect(w * 0.08, h * 0.725, w * 0.84, 4); ctx.restore();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(w * 0.26, h * 0.72, w * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.76, h * 0.72, w * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#19e3ff";
      ctx.beginPath(); ctx.arc(w * 0.26, h * 0.72, w * 0.022, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.76, h * 0.72, w * 0.022, 0, Math.PI * 2); ctx.fill();
      // headlight beam
      const beam = ctx.createLinearGradient(w * 0.9, 0, w, 0);
      beam.addColorStop(0, "rgba(255,240,180,0.5)"); beam.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = beam; ctx.fillRect(w * 0.9, h * 0.68, w * 0.1, h * 0.05);
      break;
    }
    case "palms": {
      skyGradient(ctx, w, h, grade, night);
      drawSun(ctx, w, h, grade, night);
      drawPalm(ctx, w * 0.16, h * 1.02, 1.7, -0.22, "#0d0714");
      drawPalm(ctx, w * 0.86, h * 1.02, 1.9, 0.2, "#0d0714");
      drawPalm(ctx, w * 0.5, h * 1.05, 1.3, 0.02, "#12081f");
      break;
    }
    case "neon-sign": {
      ctx.fillStyle = night ? "#0a0616" : "#2a1245"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1d1030"; ctx.fillRect(0, h * 0.7, w, h * 0.3);
      const words = ["VICE", "CITY"];
      words.forEach((word, i) => {
        ctx.save();
        ctx.font = `700 ${Math.floor(w * 0.24)}px "Liberation Sans", Arial, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = i ? "#19e3ff" : "#ff2e88"; ctx.shadowBlur = 34;
        ctx.fillStyle = i ? "#19e3ff" : "#ff2e88";
        ctx.fillText(word, w * 0.5, h * (0.3 + i * 0.2));
        ctx.restore();
      });
      ctx.save(); ctx.shadowColor = "#ffc44d"; ctx.shadowBlur = 16;
      ctx.fillStyle = "#ffc44d"; ctx.font = `700 ${Math.floor(w * 0.07)}px "Liberation Sans", Arial, sans-serif`;
      ctx.textAlign = "center"; ctx.fillText("★ OPEN ALL NIGHT ★", w * 0.5, h * 0.62); ctx.restore();
      drawPalm(ctx, w * 0.08, h * 0.72, 0.9, -0.12, "#05030a");
      break;
    }
    case "portrait": {
      skyGradient(ctx, w, h, grade, night);
      drawSun(ctx, w, h, grade, night);
      drawSkyline(ctx, w, h, h * 0.86, grade, night, seed + 9);
      // stylised figure at the panel's right, back to the sunset
      // (the pop-out hero stands on the left, so they never collide)
      const fx = w * 0.68;
      ctx.fillStyle = "#0d0714";
      ctx.beginPath(); ctx.arc(fx, h * 0.32, w * 0.085, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(fx - w * 0.02, h * 0.38, w * 0.04, h * 0.06);
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.17, h); ctx.quadraticCurveTo(fx - w * 0.15, h * 0.5, fx, h * 0.44);
      ctx.quadraticCurveTo(fx + w * 0.15, h * 0.5, fx + w * 0.17, h); ctx.closePath(); ctx.fill();
      // hair + neon rim
      ctx.strokeStyle = "#ff2e88"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(fx, h * 0.32, w * 0.09, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      break;
    }
    default: skyGradient(ctx, w, h, grade, night);
  }
  // grade tint over the whole scene
  ctx.fillStyle = grade.tint; ctx.fillRect(0, 0, w, h);
}

/* ---------- scene cache (deterministic offscreen renders) ---------- */
const sceneCache = new Map();
function sceneCanvas(sceneId, grade, night) {
  const key = `${sceneId}|${grade.id}|${night ? "n" : "d"}`;
  if (!sceneCache.has(key)) {
    const c = document.createElement("canvas");
    c.width = 540; c.height = 680;
    const seed = 1000 + SCENES.findIndex((s) => s.id === sceneId) * 77 + (night ? 5 : 0);
    drawScene(c.getContext("2d"), 540, 680, sceneId, grade, night, seed);
    sceneCache.set(key, c);
  }
  return sceneCache.get(key);
}

/* ---------- state ---------- */
const DEFAULT_PANELS = [
  { scene: "portrait", zoom: 1.15, panX: 0, panY: 0, photo: null },
  { scene: "beach", zoom: 1.2, panX: 0, panY: 0, photo: null },
  { scene: "boulevard", zoom: 1.15, panX: 0, panY: 0, photo: null },
  { scene: "pier", zoom: 1.2, panX: 0, panY: 0, photo: null },
  { scene: "skyline", zoom: 1.15, panX: 0, panY: 0, photo: null },
  { scene: "car", zoom: 1.2, panX: 0, panY: 0, photo: null },
  { scene: "palms", zoom: 1.15, panX: 0, panY: 0, photo: null },
];

const state = {
  title: "NEON SHORE",
  subtitle: "LEONIDA",
  tagline: "Two outlaws. One last summer.",
  cast: [
    { name: "LUCIA", role: "The Getaway" },
    { name: "JASON", role: "The Wheelman" },
    { name: "RAFA", role: "The Fixer" },
  ],
  layout: 7,
  aspect: "16:9",
  grade: GRADES[0],
  night: false,
  slant: true,
  hero: true,
  review: true,
  seal: true,
  billing: true,
  panels: DEFAULT_PANELS.map((p) => ({ ...p })),
  selected: 0,
};

const ASPECTS = { "1:1": [1080, 1080], "4:5": [1080, 1350], "16:9": [1920, 1080] };

/* Panel rects in 0..1 coordinates for each layout. */
function layoutRects(n) {
  switch (n) {
    case 1: return [{ x: 0, y: 0, w: 1, h: 1 }];
    case 2: return [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }];
    case 3: return [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.5 },
      { x: 0.58, y: 0.5, w: 0.42, h: 0.5 },
    ];
    case 4: return [
      { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ];
    case 6: return [
      { x: 0, y: 0, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
    ];
    case 7: default: return [
      { x: 0, y: 0, w: 0.38, h: 1 },
      { x: 0.38, y: 0, w: 0.31, h: 1 / 3 }, { x: 0.38, y: 1 / 3, w: 0.31, h: 1 / 3 }, { x: 0.38, y: 2 / 3, w: 0.31, h: 1 / 3 },
      { x: 0.69, y: 0, w: 0.31, h: 1 / 3 }, { x: 0.69, y: 1 / 3, w: 0.31, h: 1 / 3 }, { x: 0.69, y: 2 / 3, w: 0.31, h: 1 / 3 },
    ];
  }
}

/* ---------- cover renderer ---------- */
function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `700 ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px = Math.floor(px * 0.94);
    ctx.font = `700 ${px}px ${family}`;
  }
  return px;
}

function drawChromeTitle(ctx, text, cx, cy, maxWidth, px, grade) {
  const family = '"Liberation Sans", Arial, sans-serif';
  const size = fitFont(ctx, text, maxWidth, px, family);
  ctx.save();
  ctx.font = `700 ${size}px ${family}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  // drop shadow + dark outline
  ctx.shadowColor = "rgba(0,0,0,0.65)"; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = size * 0.05;
  ctx.lineWidth = Math.max(3, size * 0.09); ctx.lineJoin = "round";
  ctx.strokeStyle = "#12081f";
  ctx.strokeText(text, cx, cy);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  // chrome gradient fill
  const grad = ctx.createLinearGradient(0, cy - size * 0.55, 0, cy + size * 0.55);
  const cols = grade.title;
  grad.addColorStop(0, cols[0]); grad.addColorStop(0.45, cols[1]);
  grad.addColorStop(0.62, cols[2]); grad.addColorStop(1, cols[3]);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
  // retro horizontal stripes, clipped to the letters
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
  ctx.clip();
  ctx.fillStyle = "rgba(18,8,31,0.28)";
  const tw = ctx.measureText(text).width;
  for (let y = cy - size * 0.5; y < cy + size * 0.55; y += size * 0.16) {
    ctx.fillRect(cx - tw / 2 - 10, y, tw + 20, size * 0.045);
  }
  // top shine
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(cx - tw / 2 - 10, cy - size * 0.52, tw + 20, size * 0.08);
  ctx.restore();
  ctx.restore();
  return size;
}

function drawHeroFigure(ctx, W, H, grade, night) {
  // Stylised pop-out cut-out: a figure stepping out of the panels, neon rim.
  const cx = W * 0.3, base = H * 1.02, s = H / 1080;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 30 * s; ctx.shadowOffsetX = 10 * s;
  ctx.fillStyle = "#0d0714";
  // coat / shoulders, narrower than before so the panels stay visible
  ctx.beginPath();
  ctx.moveTo(cx - 128 * s, base);
  ctx.quadraticCurveTo(cx - 138 * s, H * 0.64, cx - 82 * s, H * 0.55);
  ctx.quadraticCurveTo(cx - 48 * s, H * 0.5, cx, H * 0.5);
  ctx.quadraticCurveTo(cx + 48 * s, H * 0.5, cx + 82 * s, H * 0.55);
  ctx.quadraticCurveTo(cx + 138 * s, H * 0.64, cx + 128 * s, base);
  ctx.closePath(); ctx.fill();
  // head, joined to the shoulders by a neck so it never floats
  ctx.beginPath(); ctx.arc(cx, H * 0.4, 52 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 20 * s, H * 0.44, 40 * s, H * 0.08);
  // hair: a filled cap swept to one side, same silhouette colour
  ctx.beginPath();
  ctx.moveTo(cx - 54 * s, H * 0.4);
  ctx.quadraticCurveTo(cx - 58 * s, H * 0.33, cx, H * 0.33);
  ctx.quadraticCurveTo(cx + 58 * s, H * 0.33, cx + 54 * s, H * 0.4);
  ctx.quadraticCurveTo(cx + 40 * s, H * 0.36, cx, H * 0.365);
  ctx.quadraticCurveTo(cx - 40 * s, H * 0.36, cx - 54 * s, H * 0.4);
  ctx.closePath(); ctx.fill();
  // bent arm, hand raised beside the head, holding sunglasses
  ctx.strokeStyle = "#0d0714"; ctx.lineWidth = 30 * s; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 72 * s, H * 0.62);
  ctx.quadraticCurveTo(cx + 148 * s, H * 0.56, cx + 138 * s, H * 0.44);
  ctx.stroke();
  ctx.restore();
  // lapels, faint so the silhouette keeps its shape
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.moveTo(cx - 12 * s, H * 0.52); ctx.lineTo(cx - 34 * s, H * 0.72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12 * s, H * 0.52); ctx.lineTo(cx + 34 * s, H * 0.72); ctx.stroke();
  // neon rim light on the figure's left edge
  ctx.strokeStyle = grade.title[1]; ctx.lineWidth = 5 * s;
  ctx.shadowColor = grade.title[1]; ctx.shadowBlur = 18 * s;
  ctx.beginPath();
  ctx.arc(cx, H * 0.4, 52 * s, Math.PI * 0.55, Math.PI * 1.5);
  ctx.moveTo(cx - 82 * s, H * 0.55);
  ctx.quadraticCurveTo(cx - 136 * s, H * 0.64, cx - 126 * s, H * 0.98);
  ctx.stroke();
  // sunglasses glint at the raised hand
  ctx.fillStyle = grade.title[2];
  ctx.shadowColor = grade.title[2]; ctx.shadowBlur = 12 * s;
  ctx.beginPath(); ctx.arc(cx + 138 * s, H * 0.43, 8 * s, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCover(ctx, W, H, st) {
  const grade = st.grade;
  // base sky so slanted gutters read as night sky
  skyGradient(ctx, W, H, grade, st.night);
  if (st.night) drawSun(ctx, W, H * 0.5, grade, true);

  const rects = layoutRects(st.layout);
  const gutter = Math.max(4, W * 0.006);
  const slantPx = st.slant ? W * 0.028 : 0;

  rects.forEach((r, i) => {
    const p = st.panels[i % st.panels.length];
    const x = r.x * W, y = r.y * H, w = r.w * W, h = r.h * H;
    const scene = SCENES.find((s) => s.id === p.scene) || SCENES[0];
    const src = p.photo || sceneCanvas(p.scene, grade, st.night);
    const sw = src.width, sh = src.height;
    // face-aware crop: the source window is the largest window with the
    // panel's aspect that fits the source, shrunk by zoom, centred on the
    // focal point and shifted by pan.
    const vw = Math.min(sw, sh * (w / h)) / p.zoom;
    const vh = vw * (h / w);
    const focal = p.focal || scene.focal;
    const fx = focal[0] + p.panX, fy = focal[1] + p.panY;
    let sx = fx * sw - vw / 2, sy = fy * sh - vh / 2;
    sx = Math.max(0, Math.min(sw - vw, sx));
    sy = Math.max(0, Math.min(sh - vh, sy));

    ctx.save();
    // slanted parallelogram clip
    ctx.beginPath();
    ctx.moveTo(x + gutter / 2 + slantPx, y + gutter / 2);
    ctx.lineTo(x + w - gutter / 2 + slantPx, y + gutter / 2);
    ctx.lineTo(x + w - gutter / 2 - slantPx, y + h - gutter / 2);
    ctx.lineTo(x + gutter / 2 - slantPx, y + h - gutter / 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(src, sx, sy, vw, vh, x - slantPx, y, w + slantPx * 2, h);
    ctx.restore();

    // panel edge: dark gutter + neon hairline
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + gutter / 2 + slantPx, y + gutter / 2);
    ctx.lineTo(x + w - gutter / 2 + slantPx, y + gutter / 2);
    ctx.lineTo(x + w - gutter / 2 - slantPx, y + h - gutter / 2);
    ctx.lineTo(x + gutter / 2 - slantPx, y + h - gutter / 2);
    ctx.closePath();
    ctx.strokeStyle = "rgba(13,7,20,0.9)"; ctx.lineWidth = gutter;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  });

  // sunset wash over everything, then the pop-out hero
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, "rgba(255,120,80,0)");
  wash.addColorStop(1, st.night ? "rgba(10,10,40,0.25)" : "rgba(255,90,60,0.12)");
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
  if (st.hero) drawHeroFigure(ctx, W, H, grade, st.night);

  // ---- furniture: title block, cast tags, review strip, seal, billing ----
  // The title block is sized by height as well as width, so the subtitle,
  // tagline and billing block never collide on any aspect (16:9 is shortest).
  const pad = W * 0.035;
  const titlePx = drawChromeTitle(ctx, st.title || "NEON SHORE", W / 2, H * 0.8, W - pad * 2, Math.min(W * 0.115, H * 0.16), grade);
  const titleY = H * 0.8;

  // subtitle, letterspaced
  ctx.save();
  ctx.font = `700 ${Math.floor(W * 0.028)}px "Liberation Sans", Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 8;
  const sub = (st.subtitle || "LEONIDA").split("").join("  ");
  ctx.fillText(sub, W / 2, titleY + titlePx * 0.62);
  // tagline
  ctx.font = `italic 400 ${Math.floor(W * 0.02)}px "Liberation Sans", Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(st.tagline || "", W / 2, titleY + titlePx * 0.62 + H * 0.028);
  ctx.restore();

  // cast role tags, bottom-left above the title
  const cast = st.cast.filter((c) => c.name.trim());
  if (cast.length) {
    const tagH = H * 0.038, tagY = H * 0.655;
    let tx = pad;
    ctx.save();
    ctx.textBaseline = "middle";
    cast.slice(0, 3).forEach((c) => {
      ctx.font = `700 ${Math.floor(tagH * 0.42)}px "Liberation Sans", Arial, sans-serif`;
      const label = `${c.name} — ${c.role}`;
      const tw = ctx.measureText(label).width + tagH * 1.1;
      if (tx + tw > W * 0.62) return;
      ctx.fillStyle = "rgba(13,7,20,0.82)";
      ctx.beginPath(); ctx.roundRect(tx, tagY, tw, tagH, tagH / 2); ctx.fill();
      ctx.strokeStyle = grade.title[1]; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "left";
      ctx.fillText(label, tx + tagH * 0.55, tagY + tagH / 2 + 1);
      tx += tw + W * 0.012;
    });
    ctx.restore();
  }

  // review strip, top-right — box sized to the quote so nothing is cut
  if (st.review) {
    const rh = H * 0.062, ry = pad * 0.7;
    const quote = "“The definitive Vice City cover maker”";
    ctx.save();
    ctx.font = `400 ${Math.floor(rh * 0.3)}px "Liberation Sans", Arial, sans-serif`;
    const rw = Math.max(W * 0.26, ctx.measureText(quote).width + rh * 0.7);
    const rx = W - pad - rw;
    ctx.fillStyle = "rgba(13,7,20,0.78)";
    ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, 8); ctx.fill();
    ctx.strokeStyle = "#ffc44d"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#ffc44d";
    ctx.font = `700 ${Math.floor(rh * 0.42)}px "Liberation Sans", Arial, sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("★★★★★", rx + rh * 0.35, ry + rh * 0.32);
    ctx.fillStyle = "#ffffff";
    ctx.font = `400 ${Math.floor(rh * 0.3)}px "Liberation Sans", Arial, sans-serif`;
    ctx.fillText(quote, rx + rh * 0.35, ry + rh * 0.74);
    ctx.restore();
  }

  // seal / stamp, bottom-right
  if (st.seal) {
    const sr = W * 0.052, sx = W - pad - sr, sy = H * 0.68;
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(-0.22);
    ctx.strokeStyle = "#ffc44d"; ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, sr * 0.78, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ffc44d"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.floor(sr * 0.3)}px "Liberation Sans", Arial, sans-serif`;
    ctx.fillText("NEON", 0, -sr * 0.28);
    ctx.fillText("SHORE", 0, sr * 0.05);
    ctx.font = `400 ${Math.floor(sr * 0.18)}px "Liberation Sans", Arial, sans-serif`;
    ctx.fillText("★ EST. 2026 ★", 0, sr * 0.42);
    ctx.restore();
  }

  // billing block, very bottom
  if (st.billing) {
    ctx.save();
    ctx.font = `400 ${Math.floor(W * 0.011)}px "Liberation Sans", Arial, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(
      "A NEON SHORE PRODUCTION  •  “NEON SHORE”  •  STARRING LUCIA & JASON  •  MUSIC BY THE VICE CITY SOUND  •  LEONIDA  •  2026",
      W / 2, H - H * 0.012,
    );
    ctx.restore();
  }
}

/* ---------- editor ---------- */
const $ = (id) => document.getElementById(id);
const canvas = $("cover");
const ctx = canvas.getContext("2d");

function render() {
  const [w, h] = ASPECTS[state.aspect];
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  drawCover(ctx, w, h, state);
  syncPanelList();
}

function syncPanelList() {
  const list = $("panel-list");
  const rects = layoutRects(state.layout);
  list.innerHTML = "";
  rects.forEach((r, i) => {
    const p = state.panels[i];
    const row = document.createElement("div");
    row.className = "panel-row" + (state.selected === i ? " on" : "");
    const scene = SCENES.find((s) => s.id === p.scene) || SCENES[0];
    const thumb = document.createElement("span");
    thumb.className = "thumb";
    thumb.style.backgroundImage = `url(${sceneCanvas(p.scene, state.grade, state.night).toDataURL()})`;
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = i === 0 ? "HERO" : `Panel ${i + 1}`;
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", `Scene for panel ${i + 1}`);
    SCENES.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.id; o.textContent = s.name;
      if (s.id === p.scene) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => { p.scene = sel.value; p.photo = null; p.focal = null; render(); });
    row.append(thumb, tag, sel);
    row.addEventListener("click", (e) => {
      if (e.target === sel) return;
      state.selected = i;
      $("in-zoom").value = String(p.zoom);
      $("in-panx").value = String(p.panX);
      $("in-pany").value = String(p.panY);
      render();
    });
    list.appendChild(row);
  });
}

function buildGrades() {
  const wrap = $("grades");
  GRADES.forEach((g) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "grade" + (state.grade.id === g.id ? " on" : "");
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg, ${g.sky[1]}, ${g.sky[2]} 55%, ${g.sky[3]})"></span><span>${g.name}<small>${g.id}</small></span>`;
    b.addEventListener("click", () => {
      state.grade = g;
      wrap.querySelectorAll(".grade").forEach((el) => el.classList.remove("on"));
      b.classList.add("on");
      sceneCache.clear();
      render();
    });
    wrap.appendChild(b);
  });
}

function bindEditor() {
  $("in-title").addEventListener("input", (e) => { state.title = e.target.value.toUpperCase(); render(); });
  $("in-subtitle").addEventListener("input", (e) => { state.subtitle = e.target.value.toUpperCase(); render(); });
  $("in-tagline").addEventListener("input", (e) => { state.tagline = e.target.value; render(); });
  $("in-cast").addEventListener("input", (e) => {
    state.cast = e.target.value.split("\n").map((line) => {
      const [name, ...rest] = line.split("—");
      return { name: (name || "").trim().toUpperCase(), role: rest.join("—").trim() || "Cast" };
    }).filter((c) => c.name);
    render();
  });
  $("opt-review").addEventListener("change", (e) => { state.review = e.target.checked; render(); });
  $("opt-seal").addEventListener("change", (e) => { state.seal = e.target.checked; render(); });
  $("opt-billing").addEventListener("change", (e) => { state.billing = e.target.checked; render(); });
  $("opt-slant").addEventListener("change", (e) => { state.slant = e.target.checked; render(); });
  $("opt-hero").addEventListener("change", (e) => { state.hero = e.target.checked; render(); });

  document.querySelectorAll("#aspect-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      state.aspect = b.dataset.aspect;
      document.querySelectorAll("#aspect-seg button").forEach((el) => el.classList.remove("on"));
      b.classList.add("on");
      render();
    });
  });
  document.querySelectorAll("#layout-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      state.layout = Number(b.dataset.layout);
      document.querySelectorAll("#layout-seg button").forEach((el) => el.classList.remove("on"));
      b.classList.add("on");
      state.selected = Math.min(state.selected, state.layout - 1);
      render();
    });
  });

  const p = () => state.panels[state.selected];
  $("in-zoom").addEventListener("input", (e) => { p().zoom = Number(e.target.value); render(); });
  $("in-panx").addEventListener("input", (e) => { p().panX = Number(e.target.value); render(); });
  $("in-pany").addEventListener("input", (e) => { p().panY = Number(e.target.value); render(); });
  $("btn-autofill").addEventListener("click", () => {
    state.panels.forEach((panel, i) => {
      const scene = SCENES.find((s) => s.id === panel.scene) || SCENES[0];
      panel.focal = null; panel.zoom = 1.15; panel.panX = 0; panel.panY = 0;
      void scene; void i;
    });
    $("in-zoom").value = "1.15"; $("in-panx").value = "0"; $("in-pany").value = "0";
    render();
  });

  $("in-photo").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { p().photo = img; p().focal = [0.5, 0.5]; render(); };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  let shuffleCount = 0;
  $("btn-random").addEventListener("click", () => {
    shuffleCount += 1;
    state.grade = GRADES[shuffleCount % GRADES.length];
    state.panels.forEach((panel, i) => { panel.scene = SCENES[(i + shuffleCount) % SCENES.length].id; panel.photo = null; panel.focal = null; });
    sceneCache.clear();
    document.querySelectorAll(".grade").forEach((el, i) => el.classList.toggle("on", GRADES[i].id === state.grade.id));
    render();
  });
  $("btn-daynight").addEventListener("click", () => {
    state.night = !state.night;
    $("btn-daynight").textContent = state.night ? "☀ Day" : "☾ Night";
    sceneCache.clear();
    render();
  });

  // click a panel on the preview to move its focal point (face-aware crop)
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    const rects = layoutRects(state.layout);
    const idx = rects.findIndex((r) => cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h);
    if (idx < 0) return;
    state.selected = idx;
    const r = rects[idx], p2 = state.panels[idx];
    p2.focal = [
      Math.max(0.05, Math.min(0.95, (cx - r.x) / r.w)),
      Math.max(0.05, Math.min(0.95, (cy - r.y) / r.h)),
    ];
    $("in-zoom").value = String(p2.zoom);
    $("in-panx").value = String(p2.panX);
    $("in-pany").value = String(p2.panY);
    render();
  });

  $("btn-export").addEventListener("click", () => exportCover(state.aspect));
  $("btn-export-all").addEventListener("click", () => {
    ["1:1", "4:5", "16:9"].forEach((a, i) => setTimeout(() => exportCover(a), i * 350));
  });
}

function exportCover(aspect) {
  const [w, h] = ASPECTS[aspect];
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  drawCover(off.getContext("2d"), w, h, { ...state, aspect });
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `neon-shore-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, "image/png");
}

/* ---------- shot mode (for screenshots) ---------- */
function applyShotMode() {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot");
  if (!shot) return false;
  document.body.classList.add("shot");
  document.title = "Neon Shore — rendering";
  if (shot === "portrait") { state.aspect = "4:5"; state.layout = 3; state.grade = GRADES[3]; }
  if (shot === "square") { state.aspect = "1:1"; state.layout = 6; state.grade = GRADES[1]; }
  if (shot === "cover") { state.aspect = "16:9"; state.layout = 7; state.grade = GRADES[0]; }
  if (shot === "editor") { document.body.classList.remove("shot"); }
  return true;
}

/* ---------- init ---------- */
buildGrades();
bindEditor();
const isShot = applyShotMode();
if (document.fonts && document.fonts.load) {
  Promise.all([
    document.fonts.load('700 100px "Liberation Sans"'),
    document.fonts.load('400 40px "Liberation Sans"'),
  ]).then(() => { render(); document.title = "Neon Shore — ready"; })
    .catch(() => { render(); document.title = "Neon Shore — ready"; });
}
render();
if (isShot) document.title = "Neon Shore — ready";
