
export const state = {
    width: 980,
    height: 320,
    padding: 36,
    radius: 22,
    background: {
        c1: '#dbeafe',
        c2: '#f3e8ff',
        c2: '#f3e8ff',
        c3: '#f8f9fa'
    },
    texture: false, // New
    texts: [],
    images: [],
    selectedId: null,
    bgPresets: []
};

export const defaultBgPresets = [
    { name: 'Default Blue', c1: '#dbeafe', c2: '#f3e8ff', c3: '#f8f9fa' },
    { name: 'Mint Green', c1: '#43D0AD', c2: '#68DF68', c3: '#f0fdf4' },
    { name: 'Sunset', c1: '#fed7aa', c2: '#fecaca', c3: '#fff7ed' }
];

export const defaultTexts = [
    { id: 't1', x: 36, y: 28, text: 'Mixture of Experts | Ep. 67.1', fontSize: 13, fontWeight: 500, color: 'rgba(10,18,32,0.72)', fontStyle: 'normal', fontFamily: 'Inter, sans-serif' },
    { id: 't2', x: 36, y: 120, text: 'GPT-5 vs. Claude Opus 4.1', fontSize: 64, fontWeight: 600, color: '#0A1220', fontStyle: 'normal', fontFamily: 'Inter, sans-serif' },
    { id: 't3', x: 36, y: 190, text: 'live demo', fontSize: 44, fontWeight: 400, color: '#0A1220', fontStyle: 'italic', fontFamily: "'Playfair Display', serif" }
];

export const availableFonts = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Lato', value: "'Lato', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Oswald', value: "'Oswald', sans-serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Dancing Script', value: "'Dancing Script', cursive" },
    { name: 'Lobster', value: "'Lobster', cursive" },
    { name: 'Pacifico', value: "'Pacifico', cursive" },
    { name: 'Lobster', value: "'Lobster', cursive" },
    { name: 'Pacifico', value: "'Pacifico', cursive" },
    { name: 'Monospace', value: 'monospace' },
    { name: 'System UI', value: 'system-ui, sans-serif' }
];

export const styleTemplates = [
    {
        name: 'Tech Minimal',
        c1: '#0f172a', c2: '#1e293b', c3: '#020617',
        texture: true,
        fonts: [
            { id: 't1', font: 'Inter, sans-serif', weight: 400, color: '#94a3b8' },
            { id: 't2', font: 'Inter, sans-serif', weight: 700, color: '#ffffff' },
            { id: 't3', font: 'monospace', weight: 400, color: '#38bdf8' }
        ]
    },
    {
        name: 'Elegant',
        c1: '#fdf4ff', c2: '#fae8ff', c3: '#ffffff',
        texture: true,
        fonts: [
            { id: 't1', font: "'Playfair Display', serif", weight: 400, color: '#701a75' },
            { id: 't2', font: "'Playfair Display', serif", weight: 600, color: '#4a044e' },
            { id: 't3', font: "'Playfair Display', serif", weight: 400, color: '#a21caf' }
        ]
    },
    {
        name: 'Pop Bold',
        c1: '#bef264', c2: '#fde047', c3: '#ffffff',
        texture: false,
        fonts: [
            { id: 't1', font: "'Oswald', sans-serif", weight: 700, color: '#000000' },
            { id: 't2', font: "'Oswald', sans-serif", weight: 700, color: '#000000' },
            { id: 't3', font: "'Oswald', sans-serif", weight: 500, color: '#000000' }
        ]
    }
];

export const presets = [
    { name: 'WeChat Article 微信公众号', w: 900, h: 383, category: 'common' },
    { name: 'Instagram Post', w: 1080, h: 1080, category: 'common' },
    { name: 'YouTube Thumbnail', w: 1280, h: 720, category: 'common' },
    { name: 'Twitter/X Post', w: 1200, h: 900, category: 'common' },
    { name: 'Xiaohongshu 小红书竖版', w: 900, h: 1200, category: 'common' },
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

export function loadState(els) {
    try {
        const saved = localStorage.getItem('coverEditorState');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.width = parsed.width || state.width;
            state.height = parsed.height || state.height;
            state.padding = parsed.padding || state.padding;
            state.radius = parsed.radius || state.radius;
            if (parsed.background) state.background = parsed.background;
            if (parsed.background) state.background = parsed.background;
            if (parsed.texts) state.texts = parsed.texts;
            if (parsed.images) state.images = parsed.images;
            if (parsed.bgPresets) state.bgPresets = parsed.bgPresets;
        }
    } catch (e) {
        console.error('Failed to load state', e);
    }

    // Defaults
    if (!state.texts || state.texts.length === 0) {
        state.texts = [...defaultTexts];
    }
    if (!state.bgPresets || state.bgPresets.length === 0) {
        state.bgPresets = [...defaultBgPresets];
    }
}

export function saveState(els) {
    // If els provided, sync from inputs first (optional, but robust)
    if (els) {
        if (els.width) state.width = parseInt(els.width.value);
        if (els.height) state.height = parseInt(els.height.value);
        if (els.pad) state.padding = parseInt(els.pad.value);
        if (els.radius) state.radius = parseInt(els.radius.value);
        if (els.c1) state.background.c1 = els.c1.value;
        if (els.c2) state.background.c2 = els.c2.value;
        if (els.c3) state.background.c3 = els.c3.value;
    }
    localStorage.setItem('coverEditorState', JSON.stringify(state));
}
