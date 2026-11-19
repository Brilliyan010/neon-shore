// Neon Shore cover engine: draws a multi-panel GTA-style poster cover onto any
// 2D canvas, at any size, from a cover state and a map of loaded photos.
// One function renders both the editor's live preview and the exported PNG, so
// what the maker sees is exactly what the PNG holds.

import { LAYOUTS, GRADES } from './presets.js';

/** Draws one photo into a panel rect, cover-fit, with the panel's pan and zoom. */
export function drawPhotoPanel(ctx, img, rect, pan, W, H) {
  const px = rect.x * W;
  const py = rect.y * H;
  const pw = rect.w * W;
  const ph = rect.h * H;
  ctx.save();
  ctx.beginPath();
  if (rect.r) {
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rect.r * Math.PI) / 180);
    ctx.rect(-pw / 2, -ph / 2, pw, ph);
    ctx.clip();
    ctx.translate(-cx, -cy);
  } else {
    ctx.rect(px, py, pw, ph);
    ctx.clip();
  }
  const zoom = pan.zoom || 1;
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const iw = img.naturalWidth * base;
  const ih = img.naturalHeight * base;
  // Clamp the pan so the photo always covers the panel: a drag (or a scene
  // nudge) can never pull the photo far enough to show the background.
  const rawDx = px + (pw - iw) / 2 + (pan.ox || 0) * pw;
  const rawDy = py + (ph - ih) / 2 + (pan.oy || 0) * ph;
  const dx = Math.min(px, Math.max(px + pw - iw, rawDx));
  const dy = Math.min(py, Math.max(py + ph - ih, rawDy));
  ctx.drawImage(img, dx, dy, iw, ih);
  ctx.restore();
}

/** Washes a panel with the grade's sunset or neon colours, clipped to the panel. */
export function gradePanel(ctx, grade, rect, W, H) {
  const px = rect.x * W;
  const py = rect.y * H;
  const pw = rect.w * W;
  const ph = rect.h * H;
  ctx.save();
  ctx.beginPath();
  if (rect.r) {
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rect.r * Math.PI) / 180);
    ctx.rect(-pw / 2, -ph / 2, pw, ph);
    ctx.clip();
    ctx.translate(-cx, -cy);
  } else {
    ctx.rect(px, py, pw, ph);
    ctx.clip();
  }
  const wash = ctx.createLinearGradient(px, py, px + pw * 0.25, py + ph);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = grade.overlayAlpha;
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/** Strokes the white gutters that split the panels, like a printed poster. */
export function strokePanelBorders(ctx, layout, W, H) {
  const lw = Math.max(2, Math.round(W * 0.004));
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = lw;
  for (const rect of layout.panels) {
    const px = rect.x * W;
    const py = rect.y * H;
    const pw = rect.w * W;
    const ph = rect.h * H;
    ctx.beginPath();
    if (rect.r) {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      ctx.translate(cx, cy);
      ctx.rotate((rect.r * Math.PI) / 180);
      ctx.rect(-pw / 2, -ph / 2, pw, ph);
      ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.rect(px, py, pw, ph);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A small noise tile, built once, tiled over the cover for film grain.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 64);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = tile;
  return tile;
}

/** Dots a halftone screen across the title band, a print-poster touch. */
export function drawHalftone(ctx, W, H, bandTop, bandBottom, accent) {
  const step = Math.max(7, Math.round(W * 0.011));
  ctx.save();
  ctx.fillStyle = accent;
  for (let y = bandTop + step / 2; y < bandBottom; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const row = Math.round((y - bandTop) / step);
      const xx = x + (row % 2 ? step / 2 : 0);
      const r = step * 0.16 + ((y - bandTop) / Math.max(1, bandBottom - bandTop)) * step * 0.2;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.arc(xx, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Draws the star badge in a corner: a ringed circle with a star and the year. */
export function drawBadge(ctx, cx, cy, r, accent) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(12, 2, 24, 0.72)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r * 0.52 : r * 0.22;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(r * 0.34)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', 0, r * 0.62);
  ctx.restore();
}

/** Fits the title to the cover width, shrinking it until it fits. */
export function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

/**
 * Draws the whole cover: panels with their photos and grade, the frame, the
 * title block with its gradient lettering and script subtitle, and the effects.
 * `photos` maps a photo id to a loaded image element. Panels whose photo is
 * missing draw as a deep purple placeholder so the cover never breaks.
 */
export function drawCover(ctx, W, H, state, photos) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.poster5;
  const grade = GRADES[state.grade] || GRADES.vice;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#150722';
  ctx.fillRect(0, 0, W, H);

  layout.panels.forEach((rect, i) => {
    const pan = state.panels[i] || { photoId: null, zoom: 1, ox: 0, oy: 0 };
    const img = pan.photoId ? photos.get(pan.photoId) : null;
    if (img) {
      drawPhotoPanel(ctx, img, rect, pan, W, H);
      gradePanel(ctx, grade, rect, W, H);
    } else {
      ctx.save();
      ctx.fillStyle = '#2a1140';
      ctx.fillRect(rect.x * W, rect.y * H, rect.w * W, rect.h * H);
      const g = ctx.createLinearGradient(0, rect.y * H, 0, (rect.y + rect.h) * H);
      g.addColorStop(0, grade.top);
      g.addColorStop(1, grade.bottom);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = g;
      ctx.fillRect(rect.x * W, rect.y * H, rect.w * W, rect.h * H);
      ctx.restore();
    }
  });
  strokePanelBorders(ctx, layout, W, H);

  if (state.frame) {
    const fw = Math.max(3, Math.round(W * 0.007));
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = fw;
    ctx.strokeRect(fw / 2, fw / 2, W - fw, H - fw);
    ctx.restore();
  }

  // Title block: a dark scrim rising from the foot (or falling from the top),
  // then the script subtitle and the big gradient title, tilted a touch.
  const bandH = H * 0.24;
  const top = state.titlePos === 'top';
  const bandTop = top ? 0 : H - bandH;
  const bandBottom = top ? bandH : H;
  const scrim = top
    ? ctx.createLinearGradient(0, 0, 0, bandH)
    : ctx.createLinearGradient(0, H - bandH, 0, H);
  scrim.addColorStop(top ? 0 : 1, 'rgba(10, 1, 22, 0.88)');
  scrim.addColorStop(top ? 1 : 0, 'rgba(10, 1, 22, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandTop, W, bandH);

  if (state.halftone) drawHalftone(ctx, W, H, bandTop, bandBottom, grade.accent);

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const cx = W / 2;
  const tilt = ((state.titleTilt || 0) * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, top ? bandH * 0.62 : H - bandH * 0.42);
  ctx.rotate(tilt);
  if (subtitle) {
    const subSize = Math.max(14, Math.round(H * 0.038 * (state.titleSize || 1)));
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillText(subtitle, 0, -H * 0.085 * (state.titleSize || 1));
    ctx.shadowBlur = 0;
  }
  if (title) {
    const startSize = Math.round(H * 0.115 * (state.titleSize || 1));
    const size = fitTitleFont(ctx, title, W * 0.92, startSize);
    const grad = ctx.createLinearGradient(0, -size * 0.75, 0, size * 0.25);
    grad.addColorStop(0, grade.titleTop);
    grad.addColorStop(1, grade.titleBottom);
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16, 2, 28, 0.92)';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.03;
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = grad;
    ctx.fillText(title, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.restore();

  if (state.badge) {
    const r = Math.max(18, Math.round(W * 0.038));
    drawBadge(ctx, W - r - W * 0.03, r + W * 0.03, r, grade.accent);
  }

  if (state.grain > 0) {
    const tile = getGrainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.05 + state.grain * 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (state.vignette > 0) {
    const v = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(5,0,12,${0.5 * state.vignette})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}

/** Hit-tests a point on the preview canvas: returns the topmost panel index, or -1. */
export function panelAtPoint(layoutId, x, y, W, H) {
  const layout = LAYOUTS[layoutId] || LAYOUTS.poster5;
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const r = layout.panels[i];
    if (x >= r.x * W && x <= (r.x + r.w) * W && y >= r.y * H && y <= (r.y + r.h) * H) return i;
  }
  return -1;
}
