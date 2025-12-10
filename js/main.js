import { state, loadState, saveState, presets, defaultBgPresets, availableFonts, styleTemplates, defaultTexts } from './store.js';
import { setRandomGradient } from './utils.js';
import { renderTextLayers, renderLayersList, updatePreview, scaleCardToFit } from './renderer.js';
import { exportPngSimple, downloadSVGFile } from './export.js';
import { startDrag, startInlineEdit, startResize } from './interaction.js';

// DOM Elements Container
const els = {};

function init() {
    // Bind simple DOM elements
    els.width = document.getElementById('widthInput');
    els.height = document.getElementById('heightInput');
    els.pad = document.getElementById('padInput');
    els.radius = document.getElementById('radiusInput');
    els.c1 = document.getElementById('c1');
    els.c2 = document.getElementById('c2');
    els.c3 = document.getElementById('c3');

    els.layersList = document.getElementById('layersList');
    els.btnAddText = document.getElementById('btnAddText');
    els.imgUpload = document.getElementById('imgUpload'); // New

    els.propsPanel = document.getElementById('propsPanel');
    els.propText = document.getElementById('propText');
    els.propSize = document.getElementById('propSize');
    els.propColor = document.getElementById('propColor');
    els.propFont = document.getElementById('propFont');
    els.propWeight = document.getElementById('propWeight');
    els.propStyle = document.getElementById('propStyle');
    els.btnDeleteText = document.getElementById('btnDeleteText');

    els.preview = document.getElementById('preview');
    els.textLayerContainer = document.getElementById('textLayerContainer');
    els.curSize = document.getElementById('curSize');

    els.presetsCommon = document.getElementById('presetsCommon');
    els.presetsCommon = document.getElementById('presetsCommon');
    // els.presetsMore removed
    // els.toggleMore removed
    // els.moreContainer removed

    els.btnApply = document.getElementById('applySize');
    els.btnJpg = document.getElementById('downloadJpg');
    els.btnPng = document.getElementById('downloadPng');
    els.btnSvg = document.getElementById('downloadSvg');
    els.btnRandGrad = document.getElementById('randomGradient');

    els.bgPresetsContainer = document.getElementById('bgPresets');
    els.btnSaveBg = document.getElementById('btnSaveBg');

    // Load State
    loadState(els);

    // If state is empty (no texts, no images), load defaults
    if (state.texts.length === 0 && (state.images ? state.images.length === 0 : true)) { // Added check for state.images existence
        // Deep copy defaults
        state.texts = JSON.parse(JSON.stringify(defaultTexts));
        saveState(els);
    }

    syncStateToInputs();

    // Render Initials
    renderPresets();
    setupListeners();
    renderTextLayers(els);
    renderLayersList(els, selectText);
    renderBgPresets();
    renderStyleTemplates(); // New
    setupFontPicker(); // Init Font Picker
    updatePreview(els);

    setTimeout(() => scaleCardToFit(els), 100);
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

function setupListeners() {
    const inputs = [els.width, els.height, els.pad, els.radius, els.c1, els.c2, els.c3];
    inputs.forEach(el => el && el.addEventListener('input', () => {
        updatePreview(els);
        // Debounce save
        if (window._saveTimer) clearTimeout(window._saveTimer);
        window._saveTimer = setTimeout(() => saveState(els), 500);
    }));

    // Text Property Listeners
    const textProps = [els.propText, els.propSize, els.propColor, els.propFont, els.propWeight, els.propStyle];
    textProps.forEach(el => el && el.addEventListener('input', updateTextFromProps));

    els.btnAddText.addEventListener('click', addTextLayer);
    els.btnDeleteText.addEventListener('click', deleteSelectedText);

    // Reset Button
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm('Reset canvas to default?')) {
                state.texts = JSON.parse(JSON.stringify(defaultTexts));
                state.images = [];
                state.background = { c1: '#dbeafe', c2: '#f3e8ff', c3: '#f8f9fa', texture: false };
                renderTextLayers(els);
                updatePreview(els);
                saveState(els);
                // Also reset inputs
                if (els.c1) els.c1.value = state.background.c1;
                if (els.c2) els.c2.value = state.background.c2;
                if (els.c3) els.c3.value = state.background.c3;
            }
        });
    }

    els.btnApply.addEventListener('click', () => updatePreview(els));
    // Toggle removed as requested
    /*
    els.toggleMore.addEventListener('click', () => {
      const isHidden = els.moreContainer.style.display === 'none';
      els.moreContainer.style.display = isHidden ? 'block' : 'none';
      els.toggleMore.innerHTML = isHidden ?
        'Show Less <span style="transform: rotate(180deg)">▼</span>' :
        'Show More Presets <span>▼</span>';
    });
    */

    els.btnRandGrad.addEventListener('click', () => setRandomGradient(els, () => updatePreview(els)));

    window.addEventListener('resize', () => setTimeout(() => scaleCardToFit(els), 100));

    if (els.btnSaveBg) els.btnSaveBg.addEventListener('click', saveBgPreset);

    // Texture Toggle
    const texToggle = document.getElementById('textureToggle');
    if (texToggle) {
        texToggle.checked = state.texture;
        texToggle.addEventListener('change', (e) => {
            state.texture = e.target.checked;
            updatePreview(els);
            saveState(els);
        });
    }

    els.btnJpg.addEventListener('click', () => exportPngSimple(els, 'jpeg'));
    els.btnPng.addEventListener('click', () => exportPngSimple(els, 'png'));
    els.btnSvg.addEventListener('click', () => downloadSVGFile(els));

    if (els.imgUpload) {
        els.imgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                addImageLayer(evt.target.result);
                e.target.value = ''; // Reset
            };
            reader.readAsDataURL(file);
        });
    }

    // Canvas Double Click -> New Text
    els.preview.addEventListener('dblclick', (e) => {
        // Ignore if clicked on a text layer (bubbled up)
        if (e.target !== els.preview && e.target !== els.textLayerContainer) return;

        const rect = els.preview.getBoundingClientRect();
        const scale = els.preview.getBoundingClientRect().width / els.preview.offsetWidth; // Logic to get current visual scale if using transform
        // Actually simpler:
        const match = els.preview.style.transform.match(/scale\(([^)]+)\)/);
        const s = match ? parseFloat(match[1]) : 1;

        const x = (e.clientX - rect.left) / s;
        const y = (e.clientY - rect.top) / s;

        // Center the new text roughly (assuming ~100px width)
        addTextLayer(x - 50, y - 12);
    });

    // Global Shortcuts
    window.addEventListener('keydown', (e) => {
        // Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Ignore if user is typing in an input or contenteditable
            const active = document.activeElement;
            if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) return;

            if (state.selectedId) {
                e.preventDefault();
                deleteSelectedText();
            }
        }
    });
}

// Actions
function selectText(id) {
    state.selectedId = id;
    renderTextLayers(els);
    renderLayersList(els, selectText);

    // Sync Font Picker Label
    const t = state.texts.find(x => x.id === id);
    if (t) {
        const fontObj = availableFonts.find(f => f.value === t.fontFamily);
        const pickerLabel = document.querySelector('#propFont span');
        if (pickerLabel) pickerLabel.textContent = fontObj ? fontObj.name : 'Select Font';
    }
}

function addTextLayer(x, y) {
    const newId = 't' + Date.now();
    // Default position if not provided
    const posX = (x !== undefined) ? Math.round(x) : 40;
    const posY = (y !== undefined) ? Math.round(y) : 40;

    state.texts.push({
        id: newId,
        x: posX,
        y: posY,
        text: 'New Text',
        fontSize: 24,
        fontWeight: 400,
        color: '#0A1220',
        fontStyle: 'normal',
        fontFamily: 'Inter, sans-serif'
    });
    selectText(newId);
    saveState(els);
}

function deleteSelectedText() {
    if (!state.selectedId) return;
    state.texts = state.texts.filter(t => t.id !== state.selectedId);
    // Image delete
    if (state.images) state.images = state.images.filter(i => i.id !== state.selectedId);

    state.selectedId = null;
    renderTextLayers(els);
    renderLayersList(els, selectText);
    saveState(els);
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

    renderTextLayers(els);
    renderLayersList(els, selectText);
    saveState(els);
}

// Presets Logic
function renderPresets() {
    els.presetsCommon.innerHTML = '';
    // els.presetsMore.innerHTML = ''; // Not used anymore

    presets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'preset';
        btn.textContent = p.name;
        btn.onclick = () => {
            els.width.value = p.w;
            els.height.value = p.h;
            updatePreview(els);
        };
        els.presetsCommon.appendChild(btn);
    });
}

function renderBgPresets() {
    if (!els.bgPresetsContainer) return;
    els.bgPresetsContainer.innerHTML = '';

    state.bgPresets.forEach((p, idx) => {
        const btn = document.createElement('div');
        btn.className = 'color-preset';
        btn.style.background = `linear - gradient(135deg, ${p.c1}, ${p.c3})`;
        btn.title = p.name;
        btn.onclick = () => {
            els.c1.value = p.c1;
            els.c2.value = p.c2;
            els.c3.value = p.c3;
            updatePreview(els);
        };

        if (idx > 2) {
            const del = document.createElement('span');
            del.textContent = '×';
            del.style.cssText = 'position:absolute; top:-4px; right:-4px; background:red; color:white; border-radius:50%; width:14px; height:14px; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer;';
            del.onclick = (e) => {
                e.stopPropagation();
                state.bgPresets.splice(idx, 1);
                renderBgPresets();
                saveState(els);
            };
            btn.appendChild(del);
        }

        els.bgPresetsContainer.appendChild(btn);
    });
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
    saveState(els);
}

function addImageLayer(src) {
    const newId = 'img' + Date.now();

    // Create an image object to get natural dimensions
    const img = new Image();
    img.onload = () => {
        // Limit max initial size
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > 300) {
            h = (300 / w) * h;
            w = 300;
        }

        state.images.push({
            id: newId,
            src: src,
            x: 50,
            y: 50,
            width: Math.round(w),
            height: Math.round(h),
            type: 'image'
        });
        // Select it
        state.selectedId = newId;
        renderTextLayers(els); // We will update this function to also render images
        saveState(els);
    };
    img.src = src;
}

// Font Picker Logic
function setupFontPicker() {
    const trigger = document.getElementById('propFont');
    const dropdown = document.getElementById('fontDropdown');
    const displaySpan = trigger.querySelector('span');

    // Toggle Dropdown
    trigger.addEventListener('click', (e) => {
        // Prevent toggle if clicking on scrollbar or inside
        if (e.target.closest('.font-dropdown')) return;

        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) renderFontOptions();
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target)) dropdown.style.display = 'none';
    });

    function renderFontOptions() {
        dropdown.innerHTML = '';
        availableFonts.forEach(font => {
            const opt = document.createElement('div');
            opt.className = 'font-option';
            opt.textContent = font.name;
            opt.style.fontFamily = font.value; // Show in its own font

            // Highlight selected
            const currentT = state.texts.find(x => x.id === state.selectedId);
            if (currentT && currentT.fontFamily === font.value) {
                opt.classList.add('selected');
            }

            // Hover Preview
            opt.addEventListener('mouseenter', () => {
                if (state.selectedId) {
                    const el = document.getElementById(state.selectedId);
                    if (el) el.style.fontFamily = font.value;
                }
            });

            // Click Select
            opt.addEventListener('click', () => {
                if (state.selectedId) {
                    const t = state.texts.find(x => x.id === state.selectedId);
                    if (t) {
                        t.fontFamily = font.value;
                        saveState(els);
                        displaySpan.textContent = font.name;

                        // Re-render to ensure persistence (although hover changed visual style, we need to ensure state is clean)
                        renderTextLayers(els);
                        // Keep selection
                        state.selectedId = t.id;
                        const el = document.getElementById(t.id);
                        if (el) el.classList.add('selected');
                        updateTextFromProps(); // Sync inputs
                    }
                }
                dropdown.style.display = 'none';
            });

            dropdown.appendChild(opt);
        });
    }

    // Revert on Mouse Leave Container (if not clicked)
    dropdown.addEventListener('mouseleave', () => {
        if (state.selectedId) {
            const t = state.texts.find(x => x.id === state.selectedId);
            if (t) {
                const el = document.getElementById(state.selectedId);
                if (el) el.style.fontFamily = t.fontFamily; // Revert to stored state
            }
        }
    });
}



function renderStyleTemplates() {
    const container = document.getElementById('styleTemplates');
    if (!container) return;

    container.innerHTML = '';
    styleTemplates.forEach(tmpl => {
        const btn = document.createElement('div');
        btn.className = 'preset'; // Reuse preset style
        btn.style.textAlign = 'center';
        btn.style.height = '40px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.background = `linear - gradient(135deg, ${tmpl.c1}, ${tmpl.c3})`;
        // If background is dark, text white, else black
        // Simple heuristic
        btn.style.color = tmpl.c1.startsWith('#0') || tmpl.c1.startsWith('#1') ? 'white' : 'black';
        btn.style.border = '1px solid rgba(0,0,0,0.1)';
        btn.textContent = tmpl.name;

        btn.onclick = () => applyStyleTemplate(tmpl);
        container.appendChild(btn);
    });
}

function applyStyleTemplate(tmpl) {
    // Apply Background
    state.background.c1 = tmpl.c1;
    state.background.c2 = tmpl.c2;
    state.background.c3 = tmpl.c3;
    state.texture = tmpl.texture;

    // Update inputs
    if (els.c1) els.c1.value = tmpl.c1;
    if (els.c2) els.c2.value = tmpl.c2;
    if (els.c3) els.c3.value = tmpl.c3;
    const texToggle = document.getElementById('textureToggle');
    if (texToggle) texToggle.checked = tmpl.texture;

    // Apply Fonts (Smartly map to first 3 text layers if exist)
    if (tmpl.fonts && state.texts.length > 0) {
        state.texts.forEach((t, i) => {
            const style = tmpl.fonts[Math.min(i, tmpl.fonts.length - 1)];
            if (style) {
                if (style.font) t.fontFamily = style.font;
                if (style.weight) t.fontWeight = style.weight;
                if (style.color) t.color = style.color;
            }
        });
    }

    renderTextLayers(els);
    updatePreview(els);
    saveState(els);
}

// Start
init();
