// Neon Shore editor: wires the controls to the cover engine, holds the photos,
// and exports the finished cover as a PNG in the three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, panelAtPoint } from './cover.js';
import { LAYOUTS, GRADES, EXPORT_SIZES, defaultCoverState } from './presets.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('preview');
const statusEl = document.getElementById('status');
const trayEl = document.getElementById('tray');
const layoutEl = document.getElementById('layouts');
const gradeEl = document.getElementById('grades');
const panelLabel = document.getElementById('panelLabel');
const zoomEl = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');

const photos = new Map();
let photoSeq = 0;
let state = defaultCoverState();
let selectedPanel = 0;
let previewSize = EXPORT_SIZES[0];
let history = [];
let historyIndex = -1;
let dragging = null;

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Registers a loaded image as a photo the panels can use, and shows it in the tray. */
export function addPhoto(img, name) {
  const id = `photo-${++photoSeq}`;
  photos.set(id, img);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'thumb';
  button.title = name;
  const thumb = document.createElement('canvas');
  thumb.width = 96;
  thumb.height = 96;
  const tctx = thumb.getContext('2d');
  const s = Math.max(96 / img.naturalWidth, 96 / img.naturalHeight);
  tctx.drawImage(img, (96 - img.naturalWidth * s) / 2, (96 - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
  button.appendChild(thumb);
  const label = document.createElement('span');
  label.textContent = name;
  button.appendChild(label);
  button.addEventListener('click', () => {
    assignPhotoToSelected(id);
    setStatus(`${name} is now in panel ${selectedPanel + 1}.`);
  });
  trayEl.appendChild(button);
  return id;
}

/** Makes sure the state's panel list matches the current layout's panel count. */
export function syncPanels() {
  const count = LAYOUTS[state.layout].panels.length;
  const firstId = photos.keys().next().value || null;
  while (state.panels.length < count) {
    state.panels.push({ photoId: firstId, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = count;
  if (selectedPanel >= count) selectedPanel = 0;
}

/** Puts one photo into the selected panel and redraws. */
export function assignPhotoToSelected(photoId) {
  syncPanels();
  state.panels[selectedPanel].photoId = photoId;
  pushHistory();
  redraw();
}

/** Puts the same photo into every panel: one photo, many panels. */
export function fillAllPanels(photoId) {
  syncPanels();
  for (const pan of state.panels) pan.photoId = photoId;
  pushHistory();
  redraw();
}

/** Deals the tray's photos across the panels in a shuffled order. */
export function shufflePanels() {
  syncPanels();
  const ids = [...photos.keys()];
  if (!ids.length) return;
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  state.panels.forEach((pan, i) => { pan.photoId = ids[i % ids.length]; });
  pushHistory();
  redraw();
}

/** Picks a random layout and grade and a fresh title tilt, for a one-click remix. */
export function randomizeCover() {
  const layoutIds = Object.keys(LAYOUTS);
  const gradeIds = Object.keys(GRADES);
  state.layout = layoutIds[Math.floor(Math.random() * layoutIds.length)];
  state.grade = gradeIds[Math.floor(Math.random() * gradeIds.length)];
  state.titleTilt = Math.round((Math.random() * 6 - 3) * 10) / 10;
  syncPanels();
  shufflePanels();
  buildPickers();
  setStatus(`Remixed: ${LAYOUTS[state.layout].label} in ${GRADES[state.grade].label}.`);
}

function snapshot() {
  return JSON.stringify(state);
}

function restore(json) {
  state = JSON.parse(json);
  syncPanels();
  syncControls();
  redraw();
}

/** Records the current state so Undo can step back to it. */
export function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateHistoryButtons();
}

export function undoCover() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restore(history[historyIndex]);
  updateHistoryButtons();
}

export function redoCover() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restore(history[historyIndex]);
  updateHistoryButtons();
}

function updateHistoryButtons() {
  document.getElementById('undo').disabled = historyIndex <= 0;
  document.getElementById('redo').disabled = historyIndex >= history.length - 1;
}

/** Redraws the preview canvas at the chosen export aspect. */
export function redraw() {
  syncPanels();
  const ratio = previewSize.w / previewSize.h;
  let w;
  let h;
  if (document.body.classList.contains('shot-cover')) {
    // A cover scene fills the frame: paint at the window's own pixels.
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.style.aspectRatio = '';
  } else {
    const maxW = 640;
    const maxH = 640;
    w = maxW;
    h = Math.round(w / ratio);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio);
    }
    canvas.style.aspectRatio = `${previewSize.w} / ${previewSize.h}`;
  }
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), w, h, state, photos);
  const pan = state.panels[selectedPanel];
  panelLabel.textContent = pan && pan.photoId
    ? `Panel ${selectedPanel + 1} of ${state.panels.length} — drag the photo to move it`
    : `Panel ${selectedPanel + 1} of ${state.panels.length} — pick a photo from the tray`;
  zoomEl.value = String(pan ? pan.zoom : 1);
  zoomVal.textContent = `${Math.round((pan ? pan.zoom : 1) * 100)}%`;
}

/** Builds the layout and grade picker buttons from the presets. */
export function buildPickers() {
  layoutEl.innerHTML = '';
  for (const [id, def] of Object.entries(LAYOUTS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick' + (state.layout === id ? ' active' : '');
    button.textContent = def.label;
    button.title = def.blurb;
    button.addEventListener('click', () => {
      state.layout = id;
      syncPanels();
      pushHistory();
      buildPickers();
      redraw();
      setStatus(`${def.label}: ${def.blurb}.`);
    });
    layoutEl.appendChild(button);
  }
  gradeEl.innerHTML = '';
  for (const [id, def] of Object.entries(GRADES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch' + (state.grade === id ? ' active' : '');
    button.style.background = def.swatch;
    button.textContent = def.label;
    button.title = def.label;
    button.addEventListener('click', () => {
      state.grade = id;
      pushHistory();
      buildPickers();
      redraw();
      setStatus(`Grade: ${def.label}.`);
    });
    gradeEl.appendChild(button);
  }
}

/** Reflects the state back into every control after an undo or a scene load. */
export function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('titleSize').value = String(state.titleSize);
  document.getElementById('titleTilt').value = String(state.titleTilt);
  document.getElementById('titlePos').value = state.titlePos;
  document.getElementById('frame').checked = state.frame;
  document.getElementById('grain').value = String(state.grain);
  document.getElementById('vignette').value = String(state.vignette);
  document.getElementById('halftone').checked = state.halftone;
  document.getElementById('badge').checked = state.badge;
  buildPickers();
}

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportCover(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, state, photos);
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-shore-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved neon-shore-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
}

/** Exports all three post sizes, one after another. */
export function exportAllSizes() {
  EXPORT_SIZES.forEach((size, i) => {
    setTimeout(() => exportCover(size), i * 350);
  });
  setStatus('Exporting all three sizes…');
}

function bindControls() {
  document.getElementById('upload').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      try {
        const img = await loadImage(URL.createObjectURL(file));
        const id = addPhoto(img, file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo');
        if (!state.panels.some((p) => p.photoId)) fillAllPanels(id);
        setStatus(`${file.name} loaded — click a panel, then a photo, to place it.`);
      } catch {
        setStatus(`Could not read ${file.name}.`);
      }
    }
    e.target.value = '';
    redraw();
  });
  document.getElementById('fillAll').addEventListener('click', () => {
    const firstId = photos.keys().next().value;
    if (!firstId) return;
    fillAllPanels(firstId);
    setStatus('One photo now fills every panel.');
  });
  document.getElementById('shuffle').addEventListener('click', () => {
    shufflePanels();
    setStatus('Photos shuffled across the panels.');
  });
  document.getElementById('randomize').addEventListener('click', randomizeCover);
  document.getElementById('undo').addEventListener('click', undoCover);
  document.getElementById('redo').addEventListener('click', redoCover);

  document.getElementById('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  document.getElementById('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    redraw();
  });
  document.getElementById('titleTilt').addEventListener('input', (e) => {
    state.titleTilt = Number(e.target.value);
    redraw();
  });
  document.getElementById('titlePos').addEventListener('change', (e) => {
    state.titlePos = e.target.value;
    pushHistory();
    redraw();
  });
  document.getElementById('frame').addEventListener('change', (e) => {
    state.frame = e.target.checked;
    pushHistory();
    redraw();
  });
  document.getElementById('grain').addEventListener('input', (e) => {
    state.grain = Number(e.target.value);
    redraw();
  });
  document.getElementById('vignette').addEventListener('input', (e) => {
    state.vignette = Number(e.target.value);
    redraw();
  });
  document.getElementById('halftone').addEventListener('change', (e) => {
    state.halftone = e.target.checked;
    pushHistory();
    redraw();
  });
  document.getElementById('badge').addEventListener('change', (e) => {
    state.badge = e.target.checked;
    pushHistory();
    redraw();
  });
  zoomEl.addEventListener('input', () => {
    syncPanels();
    state.panels[selectedPanel].zoom = Number(zoomEl.value);
    redraw();
  });
  zoomEl.addEventListener('change', pushHistory);

  document.querySelectorAll('[data-size]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      previewSize = EXPORT_SIZES.find((s) => s.id === button.dataset.size) || EXPORT_SIZES[0];
      redraw();
    });
  });
  document.querySelectorAll('[data-export]').forEach((button) => {
    button.addEventListener('click', () => {
      const size = EXPORT_SIZES.find((s) => s.id === button.dataset.export);
      if (size) exportCover(size);
    });
  });
  document.getElementById('exportAll').addEventListener('click', exportAllSizes);

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const hit = panelAtPoint(state.layout, x, y, canvas.width, canvas.height);
    if (hit >= 0) {
      selectedPanel = hit;
      dragging = { x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy, moved: false };
      canvas.setPointerCapture(e.pointerId);
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const pan = state.panels[selectedPanel];
    const layout = LAYOUTS[state.layout].panels[selectedPanel];
    pan.ox = dragging.ox + (x - dragging.x) / (layout.w * canvas.width);
    pan.oy = dragging.oy + (y - dragging.y) / (layout.h * canvas.height);
    if (Math.abs(x - dragging.x) + Math.abs(y - dragging.y) > 4) dragging.moved = true;
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && dragging.moved) pushHistory();
    dragging = null;
  });
}

buildPickers();
bindControls();
syncPanels();
syncControls();
pushHistory();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadImage,
    addPhoto,
    setState(next) {
      state = { ...defaultCoverState(), ...next };
      syncPanels();
      syncControls();
    },
    setPreviewSize(id) {
      previewSize = EXPORT_SIZES.find((s) => s.id === id) || EXPORT_SIZES[0];
    },
    redraw,
    setStatus,
  });
} else {
  loadImage('samples/boulevard.jpg')
    .then((img) => {
      const id = addPhoto(img, 'Boulevard');
      fillAllPanels(id);
      return loadImage('samples/pier.jpg');
    })
    .then((img) => addPhoto(img, 'Pier'))
    .catch(() => setStatus('Sample photos could not load — upload your own.'))
    .finally(() => {
      redraw();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    });
  redraw();
}
