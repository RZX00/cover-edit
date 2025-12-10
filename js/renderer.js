import { state } from './store.js';
import { startDrag, startInlineEdit, startResize } from './interaction.js';
import { hexToRgba, escapeXml } from './utils.js';

export function renderTextLayers(els) {
    els.textLayerContainer.innerHTML = '';

    // Clear any existing guides
    const existingGuides = els.preview.querySelectorAll('.snap-guide');
    existingGuides.forEach(g => g.remove());

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
        el.addEventListener('mousedown', (e) => startDrag(e, t.id, els));

        // Double click to edit
        el.addEventListener('dblclick', (e) => startInlineEdit(e, t.id, els));

        // Render Gizmo if selected
        if (state.selectedId === t.id) {
            el.classList.add('selected');
            // Add handles
            ['tl', 'tr', 'bl', 'br'].forEach(pos => {
                const h = document.createElement('div');
                h.className = `gizmo-handle handle-${pos}`;
                h.addEventListener('mousedown', (e) => startResize(e, t.id, pos, els));
                el.appendChild(h);
            });
        }

        els.textLayerContainer.appendChild(el);
    });

    // Render Images
    if (state.images) {
        state.images.forEach(img => {
            const el = document.createElement('div');
            el.id = img.id;
            el.className = 'image-layer';
            el.style.position = 'absolute';
            el.style.left = img.x + 'px';
            el.style.top = img.y + 'px';
            el.style.width = img.width + 'px';
            el.style.height = img.height + 'px';
            el.style.backgroundImage = `url(${img.src})`;
            el.style.backgroundSize = 'cover';
            el.style.cursor = 'move';
            el.style.userSelect = 'none'; // Prevent browser native drag

            if (state.selectedId === img.id) el.classList.add('selected');

            el.addEventListener('mousedown', (e) => startDrag(e, img.id, els));

            // Gizmo for Image
            if (state.selectedId === img.id) {
                el.style.outline = '1px solid #BFC7FF';
                ['tl', 'tr', 'bl', 'br'].forEach(pos => {
                    const h = document.createElement('div');
                    h.className = `gizmo-handle handle-${pos}`;
                    h.addEventListener('mousedown', (e) => startResize(e, img.id, pos, els));
                    el.appendChild(h);
                });

                // Add delete button?
            }

            els.textLayerContainer.appendChild(el);
        });
    }
}

export function renderLayersList(els, selectText) {
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

export function updatePreview(els) {
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

    // CSS Gradient implementation
    const g1 = `radial-gradient(circle at 85% 20%, ${hexToRgba(state.background.c1, 0.7)} 0%, ${hexToRgba(state.background.c1, 0)} 40%)`;
    const g2 = `radial-gradient(circle at 15% 80%, ${hexToRgba(state.background.c2, 0.6)} 0%, ${hexToRgba(state.background.c2, 0)} 50%)`;

    els.preview.style.backgroundImage = `${g1}, ${g2}`;

    // Texture
    const tex = document.getElementById('textureOverlay');
    if (tex) tex.style.display = state.texture ? 'block' : 'none';

    // Re-scale if needed
    scaleCardToFit(els);

    // Also update size label
    if (els.curSize) els.curSize.textContent = `${w} x ${h}`;
}

export function scaleCardToFit(els) {
    const stage = document.querySelector('.preview-stage');
    if (!stage || !els.preview) return;

    const stageW = stage.clientWidth - 64;
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
    els.preview.style.transform = `scale(${scale})`;
}
