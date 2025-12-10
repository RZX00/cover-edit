// Core State
const state = {
  width: 980,
  height: 320,
  padding: 36,
  radius: 22,
  background: {
    c1: '#dbeafe',
    c2: '#f3e8ff',
    c3: '#f8f9fa'
  },
  texts: [
    { id: 't1', x: 36, y: 28, text: 'Mixture of Experts | Ep. 67.1', fontSize: 13, fontWeight: 500, color: 'rgba(10,18,32,0.72)', fontStyle: 'normal', fontFamily: 'Inter, sans-serif' },
    { id: 't2', x: 36, y: 120, text: 'GPT-5 vs. Claude Opus 4.1', fontSize: 64, fontWeight: 600, color: '#0A1220', fontStyle: 'normal', fontFamily: 'Inter, sans-serif' },
    { id: 't3', x: 36, y: 190, text: 'live demo', fontSize: 44, fontWeight: 400, color: '#0A1220', fontStyle: 'italic', fontFamily: "'Playfair Display', serif" }
  ],
  selectedId: null,
  bgPresets: [] // Will load from storage or defaults
};

const defaultBgPresets = [
  { name: 'Default Blue', c1: '#dbeafe', c2: '#f3e8ff', c3: '#f8f9fa' },
  { name: 'Mint Green', c1: '#43D0AD', c2: '#68DF68', c3: '#f0fdf4' }, // RGB: 67 208 173, 104 223 104
  { name: 'Sunset', c1: '#fed7aa', c2: '#fecaca', c3: '#fff7ed' }
];

const presets = [
  // 常用 Common
  { name: 'WeChat Article 微信公众号', w: 900, h: 383, category: 'common' },
  { name: 'Instagram Post', w: 1080, h: 1080, category: 'common' },
  { name: 'YouTube Thumbnail', w: 1280, h: 720, category: 'common' },
  { name: 'Twitter/X Post', w: 1200, h: 900, category: 'common' },
  { name: 'Xiaohongshu 小红书竖版', w: 900, h: 1200, category: 'common' },

  // More
  { name: 'Square 1:1', w: 1080, h: 1080, category: 'more' },
  { name: 'Landscape 16:9', w: 1920, h: 1080, category: 'more' },
  { name: 'Instagram Story', w: 1080, h: 1920, category: 'more' },
  { name: 'Instagram Portrait', w: 1080, h: 1350, category: 'more' },
  { name: 'Xiaohongshu Square', w: 1080, h: 1080, category: 'more' },
  { name: 'WeChat Video 视频号竖', w: 1080, h: 1260, category: 'more' },
  { name: 'WeChat Video 视频号横', w: 1080, h: 608, category: 'more' },
  { name: 'Bilibili Cover', w: 1280, h: 800, category: 'more' },
  { name: 'Twitter Card', w: 1200, h: 628, category: 'more' },
  { name: 'LinkedIn Post', w: 1200, h: 627, category: 'more' },
];

// DOM Elements
const els = {
  width: document.getElementById('widthInput'),
  height: document.getElementById('heightInput'),
  topLabel: document.getElementById('topLabel'),
  title: document.getElementById('titleText'),
  subtitle: document.getElementById('subtitleText'),
  pad: document.getElementById('padInput'),
  radius: document.getElementById('radiusInput'),
  c1: document.getElementById('c1'),
  c2: document.getElementById('c2'),
  c3: document.getElementById('c3'),

  // Layers UI
  layersList: document.getElementById('layersList'),
  btnAddText: document.getElementById('btnAddText'),

  // Text Properties UI (Dynamic)
  propsPanel: document.getElementById('propsPanel'),
  propText: document.getElementById('propText'),
  propSize: document.getElementById('propSize'),
  propColor: document.getElementById('propColor'),
  propFont: document.getElementById('propFont'),
  propWeight: document.getElementById('propWeight'),
  propStyle: document.getElementById('propStyle'),
  btnDeleteText: document.getElementById('btnDeleteText'),

  preview: document.getElementById('preview'),
  textLayerContainer: document.getElementById('textLayerContainer'),
  curSize: document.getElementById('curSize'),

  presetsCommon: document.getElementById('presetsCommon'),
  presetsMore: document.getElementById('presetsMore'),
  toggleMore: document.getElementById('toggleMorePresets'),
  moreContainer: document.getElementById('morePresetsContainer'),

  btnApply: document.getElementById('applySize'),
  btnJpg: document.getElementById('downloadJpg'),
  btnPng: document.getElementById('downloadPng'),
  btnSvg: document.getElementById('downloadSvg'),
  btnRandGrad: document.getElementById('randomGradient'),

  bgPresetsContainer: document.getElementById('bgPresets'),
  btnSaveBg: document.getElementById('btnSaveBg')
};

// Init
// Init
function init() {
  loadState();

  // Ensure we have defaults if state is empty/broken
  if (!state.texts || state.texts.length === 0) {
    state.texts = [
      { id: 't1', x: 36, y: 28, text: 'Mixture of Experts | Ep. 67.1', fontSize: 13, fontWeight: 500, color: 'rgba(10,18,32,0.72)', fontStyle: 'normal', fontFamily: 'Inter, sans-serif' },
      { id: 't2', x: 36, y: 120, text: 'GPT-5 vs. Claude Opus 4.1', fontSize: 64, fontWeight: 600, color: '#0A1220', fontStyle: 'normal', fontFamily: 'Inter, sans-serif' },
      { id: 't3', x: 36, y: 190, text: 'live demo', fontSize: 44, fontWeight: 400, color: '#0A1220', fontStyle: 'italic', fontFamily: "'Playfair Display', serif" }
    ];
  }

  syncStateToInputs();
  renderPresets();
  setupListeners();
  renderTextLayers();
  renderLayersList();
  renderBgPresets();
  updatePreview();
  setTimeout(scaleCardToFit, 100);
}

function syncStateToInputs() {
  if (els.width) els.width.value = state.width;
  if (els.height) els.height.value = state.height;
  if (els.pad) els.pad.value = state.padding;
  if (els.radius) els.radius.value = state.radius;
  if (els.c1) els.c1.value = state.background.c1;
  if (els.c2) els.c2.value = state.background.c2;
  if (els.c3) els.c3.value = state.background.c3;
}

// Persistence
function loadState() {
  try {
    const saved = localStorage.getItem('coverEditorState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge saved state with defaults carefully
      state.width = parsed.width || state.width;
      state.height = parsed.height || state.height;
      state.padding = parsed.padding || state.padding;
      state.radius = parsed.radius || state.radius;
      if (parsed.background) state.background = parsed.background;
      if (parsed.texts) state.texts = parsed.texts;
      if (parsed.bgPresets) state.bgPresets = parsed.bgPresets;

      // Apply to inputs
      if (els.width) els.width.value = state.width;
      if (els.height) els.height.value = state.height;
      if (els.pad) els.pad.value = state.padding;
      if (els.radius) els.radius.value = state.radius;
      if (els.c1) els.c1.value = state.background.c1;
      if (els.c2) els.c2.value = state.background.c2;
      if (els.c3) els.c3.value = state.background.c3;
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }

  // Ensure we have presets if none loaded
  if (!state.bgPresets || state.bgPresets.length === 0) {
    state.bgPresets = [...defaultBgPresets];
  }
}

function saveState() {
  // Update state from inputs before saving
  state.width = parseInt(els.width.value);
  state.height = parseInt(els.height.value);
  state.padding = parseInt(els.pad.value);
  state.radius = parseInt(els.radius.value);
  state.background.c1 = els.c1.value;
  state.background.c2 = els.c2.value;
  state.background.c3 = els.c3.value;

  localStorage.setItem('coverEditorState', JSON.stringify(state));
}

function renderPresets() {
  els.presetsCommon.innerHTML = '';
  els.presetsMore.innerHTML = '';

  presets.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'preset';
    btn.textContent = p.name;
    btn.onclick = () => applyPreset(p);

    if (p.category === 'common') {
      els.presetsCommon.appendChild(btn);
    } else {
      els.presetsMore.appendChild(btn);
    }
  });
}

function applyPreset(p) {
  els.width.value = p.w;
  els.height.value = p.h;
  updatePreview(); // triggers scale
}

function setupListeners() {
  const inputs = [els.width, els.height, els.pad, els.radius, els.c1, els.c2, els.c3];
  inputs.forEach(el => el && el.addEventListener('input', () => {
    updatePreview();
    // Debounce save
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(saveState, 500);
  }));

  // Text Property Listeners
  const textProps = [els.propText, els.propSize, els.propColor, els.propFont, els.propWeight, els.propStyle];
  textProps.forEach(el => el && el.addEventListener('input', updateTextFromProps));

  els.btnAddText.addEventListener('click', addTextLayer);
  els.btnDeleteText.addEventListener('click', deleteSelectedText);

  els.btnApply.addEventListener('click', updatePreview);
  els.toggleMore.addEventListener('click', () => {
    const isHidden = els.moreContainer.style.display === 'none';
    els.moreContainer.style.display = isHidden ? 'block' : 'none';
    els.toggleMore.innerHTML = isHidden ?
      'Show Less <span style="transform: rotate(180deg)">▼</span>' :
      'Show More Presets <span>▼</span>';
  });

  els.btnRandGrad.addEventListener('click', setRandomGradient);

  // Resize observer
  window.addEventListener('resize', () => setTimeout(scaleCardToFit, 100));

  // Background
  if (els.btnSaveBg) els.btnSaveBg.addEventListener('click', saveBgPreset);

  // Downloads
  els.btnJpg.addEventListener('click', exportJpeg);
  els.btnPng.addEventListener('click', exportPngSimple);
  els.btnSvg.addEventListener('click', downloadSVGFile);
}

function renderBgPresets() {
  if (!els.bgPresetsContainer) return;
  els.bgPresetsContainer.innerHTML = '';

  state.bgPresets.forEach((p, idx) => {
    const btn = document.createElement('div');
    btn.className = 'color-preset';
    btn.style.background = `linear-gradient(135deg, ${p.c1}, ${p.c3})`;
    btn.title = p.name;
    btn.onclick = () => applyBgPreset(p);

    // Delete button for custom presets (index > 2)
    if (idx > 2) {
      const del = document.createElement('span');
      del.textContent = '×';
      del.style.cssText = 'position:absolute; top:-4px; right:-4px; background:red; color:white; border-radius:50%; width:14px; height:14px; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer;';
      del.onclick = (e) => {
        e.stopPropagation();
        deleteBgPreset(idx);
      };
      btn.appendChild(del);
    }

    els.bgPresetsContainer.appendChild(btn);
  });
}

function applyBgPreset(p) {
  els.c1.value = p.c1;
  els.c2.value = p.c2;
  els.c3.value = p.c3;
  updatePreview();
}

function saveBgPreset() {
  const newPreset = {
    name: 'Custom ' + (state.bgPresets.length + 1),
    c1: els.c1.value,
    c2: els.c2.value,
    c3: els.c3.value
  };
  state.bgPresets.push(newPreset);
  renderBgPresets();
  saveState();
}

function deleteBgPreset(idx) {
  state.bgPresets.splice(idx, 1);
  renderBgPresets();
  saveState();
}

// --- Text System ---
function renderTextLayers() {
  els.textLayerContainer.innerHTML = '';
  state.texts.forEach(t => {
    const el = document.createElement('div');
    el.id = t.id;
    el.className = 'text-layer';
    if (state.selectedId === t.id) el.classList.add('selected');

    el.style.left = t.x + 'px';
    el.style.top = t.y + 'px';
    el.style.fontSize = t.fontSize + 'px';
    el.style.color = t.color;
    el.style.fontWeight = t.fontWeight;
    el.style.fontStyle = t.fontStyle;
    el.style.fontFamily = t.fontFamily;
    el.textContent = t.text;

    // Drag logic
    el.addEventListener('mousedown', (e) => startDrag(e, t.id));

    // Double click to edit
    el.addEventListener('dblclick', (e) => startInlineEdit(e, t.id));

    // Render Gizmo if selected
    if (state.selectedId === t.id) {
      el.classList.add('selected');
      // Add handles
      ['tl', 'tr', 'bl', 'br'].forEach(pos => {
        const h = document.createElement('div');
        h.className = `gizmo-handle handle-${pos}`;
        h.addEventListener('mousedown', (e) => startResize(e, t.id, pos));
        el.appendChild(h);
      });
    }

    els.textLayerContainer.appendChild(el);
  });
}

function renderLayersList() {
  els.layersList.innerHTML = '';
  state.texts.forEach((t, idx) => {
    const item = document.createElement('div');
    item.className = 'layer-item';
    if (state.selectedId === t.id) item.classList.add('active');

    item.textContent = t.text.substring(0, 20) || '(Empty)';
    item.onclick = () => selectText(t.id);

    els.layersList.appendChild(item);
  });

  // Show/Hide Prop Panel
  if (state.selectedId) {
    els.propsPanel.style.display = 'block';
    const t = state.texts.find(x => x.id === state.selectedId);
    if (t) {
      els.propText.value = t.text;
      els.propSize.value = t.fontSize;
      els.propColor.value = t.color;
      els.propFont.value = t.fontFamily;
      els.propWeight.value = t.fontWeight;
      els.propStyle.value = t.fontStyle;
    }
  } else {
    els.propsPanel.style.display = 'none';
  }
}

function addTextLayer() {
  const newId = 't' + Date.now();
  state.texts.push({
    id: newId,
    x: 40,
    y: 40,
    text: 'New Text',
    fontSize: 24,
    fontWeight: 400,
    color: '#0A1220',
    fontStyle: 'normal',
    fontFamily: 'Inter, sans-serif'
  });
  selectText(newId);
}

function selectText(id) {
  state.selectedId = id;
  renderTextLayers();
  renderLayersList();
}

function deleteSelectedText() {
  if (!state.selectedId) return;
  state.texts = state.texts.filter(t => t.id !== state.selectedId);
  state.selectedId = null;
  renderTextLayers();
  renderLayersList();
}

function updateTextFromProps() {
  if (!state.selectedId) return;
  const t = state.texts.find(x => x.id === state.selectedId);
  if (!t) return;

  t.text = els.propText.value;
  t.fontSize = parseInt(els.propSize.value) || 12;
  t.color = els.propColor.value;
  t.fontFamily = els.propFont.value;
  t.fontWeight = els.propWeight.value;
  t.fontStyle = els.propStyle.value;

  renderTextLayers();
  renderLayersList();
}

// Dragging
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentDragId = null;

function startDrag(e, id) {
  e.stopPropagation();
  selectText(id);
  isDragging = true;
  currentDragId = id;

  const el = document.getElementById(id);
  const rect = el.getBoundingClientRect();
  const parentRect = els.textLayerContainer.getBoundingClientRect();

  // Calculate offset relative to the element's top-left
  // Current logic for x/y is relative to the container (textLayerContainer)
  // We need to account for zooming (transform scale)
  const scale = getCurrentScale();

  dragOffset.x = (e.clientX - rect.left) / scale;
  dragOffset.y = (e.clientY - rect.top) / scale;

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
  if (!isDragging || !currentDragId) return;

  const t = state.texts.find(x => x.id === currentDragId);
  if (!t) return;

  const parentRect = els.textLayerContainer.getBoundingClientRect();
  const scale = getCurrentScale();

  // Calculate new position relative to container
  let newX = (e.clientX - parentRect.left) / scale - dragOffset.x;
  let newY = (e.clientY - parentRect.top) / scale - dragOffset.y;

  // Snap to grid or simple int
  t.x = Math.round(newX);
  t.y = Math.round(newY);

  const el = document.getElementById(currentDragId);
  if (el) {
    el.style.left = t.x + 'px';
    el.style.top = t.y + 'px';
  }
}

saveState();
}

// --- Inline Edit ---
function startInlineEdit(e, id) {
  e.stopPropagation();
  const el = document.getElementById(id);
  if (!el) return;

  el.contentEditable = true;
  el.focus();

  // Select all text
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finishEdit = () => {
    el.contentEditable = false;
    const t = state.texts.find(x => x.id === id);
    if (t) {
      t.text = el.innerText; // Update model
      renderLayersList(); // Update sidebar list
      saveState();
    }
    renderTextLayers(); // Re-render to cleanup
  };

  el.addEventListener('blur', finishEdit, { once: true });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // CMD+Enter to save? or just Enter. Let's do Shift+Enter for new line
      e.preventDefault();
      el.blur();
    }
  });
}

// --- Resize Logic ---
let isResizing = false;
let resizeStart = { x: 0, y: 0, fontSize: 0 };
let currentResizeId = null;
let resizeHandle = null;

function startResize(e, id, handle) {
  e.stopPropagation();
  e.preventDefault(); // Prevent text selection
  isResizing = true;
  currentResizeId = id;
  resizeHandle = handle;

  const t = state.texts.find(x => x.id === id);
  resizeStart.x = e.clientX;
  resizeStart.y = e.clientY;
  resizeStart.fontSize = t.fontSize;

  window.addEventListener('mousemove', onResize);
  window.addEventListener('mouseup', endResize);
}

function onResize(e) {
  if (!isResizing || !currentResizeId) return;
  const t = state.texts.find(x => x.id === currentResizeId);

  // Simple distance based scaling
  // Determine direction based on handle
  // For simplicity, let's just use vertical drag distance to scale
  // Up = grow, Down = shrink? Or standard corner drag behavior

  const scale = getCurrentScale();
  const dx = (e.clientX - resizeStart.x) / scale;
  const dy = (e.clientY - resizeStart.y) / scale;

  // If dragging BR (Bottom Right), moving right/down increases size
  let delta = 0;
  if (resizeHandle.includes('b')) delta = dy;
  else delta = -dy; // Top handles: moving up (negative dy) increases size

  // Just use one dimension for simplicity to avoid aspect ratio complexity for now (fonts rely on size)
  // Or better: Use distance from center?
  // Let's stick to "delta Y determines size change" for intuitive corner dragging.

  const newSize = Math.max(8, resizeStart.fontSize + delta);
  t.fontSize = Math.round(newSize);

  // Update DOM immediately for smoothness
  const el = document.getElementById(currentResizeId);
  if (el) el.style.fontSize = t.fontSize + 'px';

  // Update Props Panel
  if (els.propSize) els.propSize.value = t.fontSize;
}

function endResize() {
  isResizing = false;
  currentResizeId = null;
  resizeHandle = null;
  window.removeEventListener('mousemove', onResize);
  window.removeEventListener('mouseup', endResize);
  renderTextLayers(); // Clean re-render
  saveState();
}

function getCurrentScale() {
  // Parse scale from transform style string
  // transform: scale(0.5)
  const match = els.preview.style.transform.match(/scale\(([^)]+)\)/);
  return match ? parseFloat(match[1]) : 1;
}


function scaleCardToFit() {
  const stage = document.querySelector('.preview-stage');
  if (!stage || !els.preview) return;

  const stageW = stage.clientWidth - 64; // padding
  const stageH = stage.clientHeight - 64;

  const cardW = parseInt(els.width.value) || 980;
  const cardH = parseInt(els.height.value) || 320;

  if (cardW === 0 || cardH === 0) return;

  const scale = Math.min(
    stageW / cardW,
    stageH / cardH,
    1
  );

  els.preview.style.width = `${cardW}px`;
  els.preview.style.height = `${cardH}px`;

  // Use transform for scaling from center
  els.preview.style.transform = `scale(${scale})`;
}

// --- Gradient Helpers (Keep existing logic) ---
function hexToHslString(hex) {
  const hsl = hexToHsl(hex);
  const h = Math.round(hsl[0] * 360);
  const s = Math.round(hsl[1] * 100);
  const l = Math.round(hsl[2] * 100);
  return `hsla(${h}, ${s}%, ${l}%, 0.7)`;
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = c => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function setRandomGradient() {
  const gradientSets = [
    ['#FFE5E5', '#FFB3BA', '#FFDFBA'],
    ['#E5F3FF', '#B3D9FF', '#FFE5B3'],
    ['#F0E5FF', '#D9B3FF', '#E5FFB3'],
    ['#FFE5F0', '#FFB3D9', '#B3FFE5'],
    ['#E5FFE5', '#B3FFB3', '#FFE5FF'],
    ['#FFF0E5', '#FFDFB3', '#E5F0FF'],
    ['#E5F0E5', '#B3DFB3', '#F0E5F0'],
    ['#FFE5DF', '#FFB3A7', '#DFE5FF'],
    ['#F5E5FF', '#E5B3FF', '#E5FFE5'],
    ['#E5FFF5', '#B3FFD9', '#FFE5F5']
  ];
  const randomSet = gradientSets[Math.floor(Math.random() * gradientSets.length)];
  const adjustedColors = randomSet.map(color => {
    const hsl = hexToHsl(color);
    hsl[1] = Math.max(0.2, Math.min(0.8, hsl[1] + (Math.random() - 0.5) * 0.3));
    hsl[2] = Math.max(0.7, Math.min(0.95, hsl[2] + (Math.random() - 0.5) * 0.2));
    return hslToHex(hsl[0], hsl[1], hsl[2]);
  });

  els.c1.value = adjustedColors[0];
  els.c2.value = adjustedColors[1];
  els.c3.value = adjustedColors[2];
  updatePreview();
}

// --- Preview Update ---
function updatePreview() {
  const w = parseInt(els.width.value) || 980;
  const h = parseInt(els.height.value) || 320;
  const rad = parseInt(els.radius.value) || 0;
  const pad = parseInt(els.pad.value) || 0;

  // Update state
  state.width = w;
  state.height = h;
  state.radius = rad;
  state.padding = pad;
  state.background.c1 = els.c1.value;
  state.background.c2 = els.c2.value;
  state.background.c3 = els.c3.value;

  // Apply to Preview DOM
  els.preview.style.width = w + 'px';
  els.preview.style.height = h + 'px';
  els.preview.style.borderRadius = rad + 'px';
  els.preview.style.backgroundColor = state.background.c3;

  // CSS Gradient implementation matching the export logic
  // Grad 1: Top-Rightish
  const g1 = `radial-gradient(circle at 85% 20%, ${hexToRgba(state.background.c1, 0.7)} 0%, ${hexToRgba(state.background.c1, 0)} 40%)`;
  // Grad 2: Bottom-Leftish
  const g2 = `radial-gradient(circle at 15% 80%, ${hexToRgba(state.background.c2, 0.6)} 0%, ${hexToRgba(state.background.c2, 0)} 50%)`;

  els.preview.style.backgroundImage = `${g1}, ${g2}`;

  // Re-scale if needed
  scaleCardToFit();

  // Also update size label
  if (els.curSize) els.curSize.textContent = `${w} x ${h}`;
}

// --- Export Functions (Simplified for now, will enhance in Phase 4) ---
function escapeXml(unsafe) {
  return unsafe.replace(/[&<>"]+/g, function (c) {
    switch (c) { case '&': return '&amp;'; case '<': return '&lt;'; case '>': return '&gt;'; case '"': return '&quot;'; }
  });
}

function generateSVGString(w, h) {
  const pad = parseInt(els.pad.value) || 36;
  const radius = parseInt(els.radius.value) || 22;
  const titleSize = Math.max(32, w * 0.065);
  const subtitleSize = Math.max(18, w * 0.045);

  const svg = `<?xml version="1.0" encoding="utf-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="grad1" cx="85%" cy="20%" r="40%">
        <stop offset="0%" stop-color="${els.c1.value}" stop-opacity="0.7" />
        <stop offset="100%" stop-color="${els.c1.value}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="grad2" cx="15%" cy="80%" r="50%">
        <stop offset="0%" stop-color="${els.c2.value}" stop-opacity="0.6" />
        <stop offset="100%" stop-color="${els.c2.value}" stop-opacity="0" />
      </radialGradient>
      <style>
        .card{font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; fill:#0A1220}
      </style>
    </defs>
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="${els.c3.value}" />
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="url(#grad1)" />
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="url(#grad2)" />
    <g class="card">
      ${state.texts.map(t => `
        <text x="${t.x}" y="${t.y + t.fontSize}" 
              style="font-size:${t.fontSize}px; font-weight:${t.fontWeight}; font-style:${t.fontStyle}; font-family:${t.fontFamily}; fill:${t.color}">
          ${escapeXml(t.text)}
        </text>
      `).join('')}
    </g>
  </svg>`;
  return svg;
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadSVGFile() {
  const w = parseInt(els.width.value);
  const h = parseInt(els.height.value);
  const svg = generateSVGString(w, h);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `cover_${w}x${h}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJpeg() {
  // Use Canvas drawing similar to original code, but simplified
  exportPngSimple('jpeg');
}

function exportPngSimple(type = 'png') {
  const w = parseInt(els.width.value);
  const h = parseInt(els.height.value);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Re-implement basic drawing logic
  const radius = parseInt(els.radius.value);
  const pad = parseInt(els.pad.value);

  // Bg
  ctx.fillStyle = els.c3.value;
  ctx.fillRect(0, 0, w, h);

  // Gradients
  const g1 = ctx.createRadialGradient(w * 0.85, h * 0.2, 0, w * 0.85, h * 0.2, w * 0.4);
  g1.addColorStop(0, hexToRgba(els.c1.value, 0.7));
  g1.addColorStop(1, hexToRgba(els.c1.value, 0));
  ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);

  const g2 = ctx.createRadialGradient(w * 0.15, h * 0.8, 0, w * 0.15, h * 0.8, w * 0.5);
  g2.addColorStop(0, hexToRgba(els.c2.value, 0.6));
  g2.addColorStop(1, hexToRgba(els.c2.value, 0));
  ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);

  // Text
  state.texts.forEach(t => {
    ctx.font = `${t.fontStyle} ${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`;
    ctx.fillStyle = t.color;
    // Canvas draws text from bottom-left by default roughly, but let's align with SVG 'y' which is baseline mostly.
    // However, we used y + fontsize in SVG to approximate top-left origin system if we want, 
    // but standard SVG text y is baseline.
    // In our data model, let's treat (x,y) as top-left for easy dragging.
    ctx.textBaseline = 'top';
    ctx.fillText(t.text, t.x, t.y);
  });

  const mime = type === 'jpeg' ? 'image/jpeg' : 'image/png';
  downloadDataUrl(canvas.toDataURL(mime, 0.95), `cover.${type}`);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

init();
