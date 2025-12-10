import { state } from './store.js';
import { hexToRgba, escapeXml } from './utils.js';

export function generateSVGString(w, h, els) {
    const pad = parseInt(els.pad.value) || 36;
    const radius = parseInt(els.radius.value) || 22;

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

export function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function downloadSVGFile(els) {
    const w = parseInt(els.width.value);
    const h = parseInt(els.height.value);
    const svg = generateSVGString(w, h, els);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `cover_${w}x${h}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportPngSimple(els, type = 'png') {
    const w = parseInt(els.width.value);
    const h = parseInt(els.height.value);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const radius = parseInt(els.radius.value);
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
        ctx.fillText(t.text, t.x, t.y + t.fontSize); // Canvas draws from baseline
    });

    const dataUrl = canvas.toDataURL('image/' + type);
    downloadDataUrl(dataUrl, `cover_${w}x${h}.${type}`);
}
