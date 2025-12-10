export function hexToHslString(hex) {
    const hsl = hexToHsl(hex);
    const h = Math.round(hsl[0] * 360);
    const s = Math.round(hsl[1] * 100);
    const l = Math.round(hsl[2] * 100);
    return `hsla(${h}, ${s}%, ${l}%, 0.7)`;
}

export function hexToHsl(hex) {
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

export function hslToHex(h, s, l) {
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

export function setRandomGradient(els, updatePreview) {
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

    if (els.c1) els.c1.value = adjustedColors[0];
    if (els.c2) els.c2.value = adjustedColors[1];
    if (els.c3) els.c3.value = adjustedColors[2];

    updatePreview();
}

export function escapeXml(unsafe) {
    return unsafe.replace(/[&<>"]+/g, function (c) {
        switch (c) { case '&': return '&amp;'; case '<': return '&lt;'; case '>': return '&gt;'; case '"': return '&quot;'; }
    });
}

export function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
