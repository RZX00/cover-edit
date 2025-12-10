import { state, loadState, saveState, presets, defaultBgPresets, availableFonts } from './store.js';
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
    els.presetsMore = document.getElementById('presetsMore');
    els.toggleMore = document.getElementById('toggleMorePresets');
    els.moreContainer = document.getElementById('morePresetsContainer');

    els.btnApply = document.getElementById('applySize');
    els.btnJpg = document.getElementById('downloadJpg');
    els.btnPng = document.getElementById('downloadPng');
    els.btnSvg = document.getElementById('downloadSvg');
    els.btnRandGrad = document.getElementById('randomGradient');

    els.bgPresetsContainer = document.getElementById('bgPresets');
    els.btnSaveBg = document.getElementById('btnSaveBg');

    // Load State
    loadState(els);
    syncStateToInputs();

    // Render Initials
    renderPresets();
    setupListeners();
    renderTextLayers(els);
    renderLayersList(els, selectText);
    renderBgPresets();
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

    els.btnJpg.addEventListener('click', () => exportPngSimple(els, 'jpeg'));
    els.btnPng.addEventListener('click', () => exportPngSimple(els, 'png'));
    els.btnSvg.addEventListener('click', () => downloadSVGFile(els));

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
        btn.style.background = `linear-gradient(135deg, ${p.c1}, ${p.c3})`;
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

// Start
init();
