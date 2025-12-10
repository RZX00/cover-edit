import { state, saveState } from './store.js';
import { renderTextLayers, renderLayersList } from './renderer.js';

let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentDragId = null;
let elsRef = null; // Store refs to elements

// Alignment threshold
const SNAP_DIST = 5;

// Guide Elements
let vGuide = null;
let hGuide = null;

function ensureGuides(container) {
    if (!vGuide) {
        vGuide = document.createElement('div');
        vGuide.className = 'snap-guide v-guide';
        vGuide.style.cssText = 'position:absolute; top:0; bottom:0; width:1px; background:#ff0044; z-index:9999; display:none; pointer-events:none; box-shadow: 0 0 2px rgba(255,255,255,0.5);';
        container.appendChild(vGuide);
    }
    if (!hGuide) {
        hGuide = document.createElement('div');
        hGuide.className = 'snap-guide h-guide';
        hGuide.style.cssText = 'position:absolute; left:0; right:0; height:1px; background:#ff0044; z-index:9999; display:none; pointer-events:none; box-shadow: 0 0 2px rgba(255,255,255,0.5);';
        container.appendChild(hGuide);
    }
    // Ensure they are attached
    if (!vGuide.parentNode || vGuide.parentNode !== container) container.appendChild(vGuide);
    if (!hGuide.parentNode || hGuide.parentNode !== container) container.appendChild(hGuide);
}

function hideGuides() {
    if (vGuide) vGuide.style.display = 'none';
    if (hGuide) hGuide.style.display = 'none';
}

// Select Helper
function selectText(id) {
    if (state.selectedId === id) return; // Optimization: Don't re-render if already selected
    state.selectedId = id;
    renderTextLayers(elsRef);
    renderLayersList(elsRef, selectText);
}

export function startDrag(e, id, els) {
    e.stopPropagation(); // Essential for preventing bubble up

    elsRef = els;
    ensureGuides(els.preview);

    // visual active state feedback could be added here
    if (state.selectedId !== id) {
        selectText(id);
    }

    isDragging = true;
    currentDragId = id;

    const el = document.getElementById(id);
    if (!el || el.isContentEditable) return; // Prevent drag if editing

    const rect = el.getBoundingClientRect();

    const scale = getCurrentScale(els);

    dragOffset.x = (e.clientX - rect.left) / scale;
    dragOffset.y = (e.clientY - rect.top) / scale;

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
    if (!isDragging || !currentDragId) return;

    // Find in texts OR images
    let t = state.texts.find(x => x.id === currentDragId);
    const isImage = !t;
    if (!t) t = state.images.find(x => x.id === currentDragId);

    if (!t) return;

    // if(isImage) { ... specific logic? No, x/y is same }

    const parentRect = elsRef.textLayerContainer.getBoundingClientRect();
    const scale = getCurrentScale(elsRef);

    // Raw new position
    let newX = (e.clientX - parentRect.left) / scale - dragOffset.x;
    let newY = (e.clientY - parentRect.top) / scale - dragOffset.y;

    // --- Smart Alignment & Snapping ---
    const el = document.getElementById(currentDragId);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const cx = newX + w / 2;
    const cy = newY + h / 2;

    let snappedX = newX;
    let snappedY = newY;

    let showV = false;
    let showH = false;

    const canvasW = state.width;
    const canvasH = state.height;

    // 1. Center Snap (Canvas)
    if (Math.abs(cx - canvasW / 2) < SNAP_DIST) {
        snappedX = canvasW / 2 - w / 2;
        showV = true;
        vGuide.style.left = (canvasW / 2) + 'px';
    }

    if (Math.abs(cy - canvasH / 2) < SNAP_DIST) {
        snappedY = canvasH / 2 - h / 2;
        showH = true;
        hGuide.style.top = (canvasH / 2) + 'px';
    }

    // 2. Snap to other elements (simple center alignment)
    // Iterate other texts
    if (!showV || !showH) {
        state.texts.forEach(other => {
            if (other.id === currentDragId) return;

            // We need DOM dims of other elements. 
            // Since state only has x/y/fontSize, we can approximate or read DOM
            const otherEl = document.getElementById(other.id);
            if (!otherEl) return;

            const ow = otherEl.offsetWidth;
            const oh = otherEl.offsetHeight;
            const ocx = other.x + ow / 2;
            const ocy = other.y + oh / 2;

            // Align Centers X
            if (!showV && Math.abs(cx - ocx) < SNAP_DIST) {
                snappedX = ocx - w / 2;
                showV = true;
                vGuide.style.left = ocx + 'px';
            }

            // Align Centers Y
            if (!showH && Math.abs(cy - ocy) < SNAP_DIST) {
                snappedY = ocy - h / 2;
                showH = true;
                hGuide.style.top = ocy + 'px';
            }

            // Align Lefts
            if (!showV && Math.abs(newX - other.x) < SNAP_DIST) {
                snappedX = other.x;
                showV = true;
                vGuide.style.left = other.x + 'px';
            }
        });
    }

    vGuide.style.display = showV ? 'block' : 'none';
    hGuide.style.display = showH ? 'block' : 'none';

    // Apply
    t.x = Math.round(snappedX);
    t.y = Math.round(snappedY);

    if (el) {
        el.style.left = t.x + 'px';
        el.style.top = t.y + 'px';
    }
}

function endDrag() {
    isDragging = false;
    currentDragId = null;
    hideGuides();
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
    saveState(elsRef);
}

// --- Inline Edit ---
export function startInlineEdit(e, id, els) {
    e.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;

    // Cleanup drag listeners if double click happened fast
    endDrag();

    el.contentEditable = true;
    el.focus();
    el.style.cursor = 'text';

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finishEdit = () => {
        el.contentEditable = false;
        el.style.cursor = 'move';
        const t = state.texts.find(x => x.id === id);
        if (t) {
            t.text = el.innerText; // Update model
            renderLayersList(els, selectText); // Update sidebar list
            saveState(els);
        }
        renderTextLayers(els); // Re-render to cleanup
    };

    el.addEventListener('blur', finishEdit, { once: true });
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
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

export function startResize(e, id, handle, els) {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    elsRef = els;
    isResizing = true;
    currentResizeId = id;
    resizeHandle = handle;

    const t = state.texts.find(x => x.id === id);
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    resizeStart.fontSize = t ? t.fontSize : 0;
    if (!t) {
        // Image support
        const img = state.images.find(x => x.id === id);
        if (img) {
            resizeStart.w = img.width;
            resizeStart.h = img.height;
            resizeStart.xPos = img.x;
            resizeStart.yPos = img.y;
        }
    }

    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', endResize);
}

function onResize(e) {
    if (!isResizing || !currentResizeId) return;

    let target = state.texts.find(x => x.id === currentResizeId);
    let isImage = false;
    if (!target) {
        target = state.images.find(x => x.id === currentResizeId);
        isImage = true;
    }
    if (!target) return;

    const scale = getCurrentScale(elsRef);
    const dx = (e.clientX - resizeStart.x) / scale;
    const dy = (e.clientY - resizeStart.y) / scale;

    if (isImage) {
        // Image Resize Logic
        // Locked aspect ratio? For now simple free resize or locked. Let's do free for MVP or lock if corners.
        // Usually corner resize locks aspect on shift, but web tools often just resize w/h.
        // Let's implement simple corner resize updating width/height.

        let newW = target.width;
        let newH = target.height;

        // Determine direction based on handle
        if (resizeHandle.includes('r')) newW = Math.max(20, resizeStart.w + dx);
        if (resizeHandle.includes('l')) newW = Math.max(20, resizeStart.w - dx); // logic might need offset adjustment in startResize if we want correct anchor
        if (resizeHandle.includes('b')) newH = Math.max(20, resizeStart.h + dy);
        if (resizeHandle.includes('t')) newH = Math.max(20, resizeStart.h - dy);

        // Simplification: Standard Gizmo usually requires updating x/y for top/left handles. 
        // For MVP V2, let's just support Bottom-Right resize to keep math simple, OR just update w/y correctly.

        // Let's stick to simple "delta affects size"
        // If handle is 'br', dx adds to width, dy adds to height.
        if (resizeHandle === 'br') {
            target.width = Math.max(20, resizeStart.w + dx);
            target.height = Math.max(20, resizeStart.h + dy);
        } else if (resizeHandle === 'bl') {
            // Change width and X
            // Too complex for single function patch? 
            // Let's just allow BR resizing for images for now or crude implementation.
            // Actually, let's simply map dx/dy to size.
            target.width = Math.max(20, resizeStart.w + (resizeHandle.includes('l') ? -dx : dx));
            target.height = Math.max(20, resizeStart.h + (resizeHandle.includes('t') ? -dy : dy));

            // If we change Left, we must change X.
            if (resizeHandle.includes('l')) target.x = resizeStart.xPos + dx;
            // If Top, change Y.
            if (resizeHandle.includes('t')) target.y = resizeStart.yPos + dy;
        } else {
            // other handles
            target.width = Math.max(20, resizeStart.w + (resizeHandle.includes('l') ? -dx : dx));
            target.height = Math.max(20, resizeStart.h + (resizeHandle.includes('t') ? -dy : dy));
            if (resizeHandle.includes('l')) target.x = resizeStart.xPos + dx;
            if (resizeHandle.includes('t')) target.y = resizeStart.yPos + dy;
        }

        const el = document.getElementById(currentResizeId);
        if (el) {
            el.style.width = target.width + 'px';
            el.style.height = target.height + 'px';
            el.style.left = target.x + 'px';
            el.style.top = target.y + 'px';
        }

    } else {
        // Text Resize Logic (Font Size)
        let delta = 0;
        if (resizeHandle.includes('b')) delta = dy;
        else delta = -dy;

        const newSize = Math.max(8, resizeStart.fontSize + delta);
        target.fontSize = Math.round(newSize);

        const el = document.getElementById(currentResizeId);
        if (el) el.style.fontSize = target.fontSize + 'px';

        if (elsRef.propSize) elsRef.propSize.value = target.fontSize;
    }
}

function endResize() {
    isResizing = false;
    currentResizeId = null;
    resizeHandle = null;
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', endResize);
    renderTextLayers(elsRef);
    saveState(elsRef);
}

function getCurrentScale(els) {
    const match = els.preview.style.transform.match(/scale\(([^)]+)\)/);
    return match ? parseFloat(match[1]) : 1;
}
