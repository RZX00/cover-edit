# Cover Artist

A lightweight, browser-based cover image editor for social media.

## Features
- **Dynamic Text Layers**: Drag, resize, and edit text directly on canvas.
- **Smart Alignment**: Snap-to-center and snap-to-object guides.
- **Layout Presets**: One-click sizes for WeChat, Instagram, YouTube, etc.
- **Backgrounds**: Gradient presets and custom color support.
- **Export**: Save as PNG, JPG, or SVG / Project JSON.
- **Local Storage**: Auto-save your work.

## Technology
- **Vanilla JS (ES Modules)**: No build step required.
- **CSS Grid/Flexbox**: Responsive UI.
- **Google Fonts**: Integrated popular fonts.

## Development
To run locally:
```bash
npx serve .
# or
python -m http.server
```

## Deployment
This is a static site. Simply drag and drop this folder into [Vercel](https://vercel.com) or configure a Git repo.
- **Entry Point**: `index.html`
- **Build Command**: (None)
- **Output Directory**: (Root)
