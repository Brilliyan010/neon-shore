// Fixed scenes for screenshots: ?shot=cover draws one exported cover full frame,
// ?shot=editor shows the editor with sample photos loaded. window.__shotReady is
// set once the scene has painted, so a headless browser knows when to shoot.
// `photo` picks the sample (samples/<photo>.jpg), `caption` the words, `size`
// the export size the scene previews (square, portrait or wide).

/** Loads both sample photos and deals them across the panels, alternating. */
async function loadScenePhotos(api, first) {
  const second = first === 'boulevard' ? 'pier' : 'boulevard';
  const imgA = await api.loadImage(`samples/${first}.jpg`);
  const idA = api.addPhoto(imgA, first === 'boulevard' ? 'Boulevard' : 'Pier');
  const imgB = await api.loadImage(`samples/${second}.jpg`);
  const idB = api.addPhoto(imgB, second === 'boulevard' ? 'Boulevard' : 'Pier');
  const panels = [];
  for (let i = 0; i < 9; i++) {
    // The pier photo is a tall portrait crop: nudge its wide panels down so
    // the sitter's head stays in frame instead of the centred torso crop.
    const isPier = i % 2 === 1;
    panels.push({ photoId: isPier ? idB : idA, zoom: 1, ox: 0, oy: isPier ? 0.16 : 0 });
  }
  return panels;
}

/** Waits for the display and script fonts, then paints and signals readiness. */
async function paintReady(api) {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('40px Pacifico');
    await document.fonts.ready;
  } catch {
    // A font that fails still leaves a usable fallback drawing.
  }
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, api) {
  const photo = query.get('photo') ?? 'boulevard';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Neon Shore';
  const layout = query.get('layout') ?? 'poster5';
  const grade = query.get('grade') ?? 'vice';
  const size = query.get('size') ?? 'wide';

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    api.setPreviewSize(size);
    const panels = await loadScenePhotos(api, photo);
    api.setState({
      layout,
      grade,
      title: caption,
      subtitle,
      titleSize: 1,
      titleTilt: -2,
      titlePos: 'bottom',
      frame: true,
      grain: 0.6,
      vignette: 0.55,
      halftone: true,
      badge: true,
      panels,
    });
    await paintReady(api);
    return;
  }

  if (shot === 'editor') {
    const panels = await loadScenePhotos(api, photo);
    api.setState({
      layout,
      grade,
      title: caption,
      subtitle,
      titleSize: 1,
      titleTilt: -2,
      titlePos: 'bottom',
      frame: true,
      grain: 0.6,
      vignette: 0.55,
      halftone: true,
      badge: true,
      panels,
    });
    api.setStatus('Boulevard Queen — drag a panel photo to move it, then export a PNG.');
    await paintReady(api);
    return;
  }

  // Unknown scene: paint the default editor and signal readiness anyway.
  await paintReady(api);
}
