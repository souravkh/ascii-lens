# ASCII Lens

Turn any image into colorful ASCII art, right in your browser. Upload a photo, pick a color mode, zoom in to see the detail, and download the result as a text file or a PNG.

![color mode](https://img.shields.io/badge/mode-color-blueviolet) ![low detail mode](https://img.shields.io/badge/mode-low%20detail-teal) ![bw mode](https://img.shields.io/badge/mode-black%20%26%20white-lightgrey) ![spectrum mode](https://img.shields.io/badge/mode-spectrum-orange)

## What it does

1. You upload an image.
2. The app samples it into a grid of characters — darker areas get denser characters (`@`, `#`, `%`), lighter areas get sparser ones (`.`, `:`, ` `).
3. Each character is colored based on the mode you pick.
4. You can zoom in/out to inspect it, and download the final art.

## Color modes

| Mode | What you get |
|---|---|
| **Color** | Each character uses the real color sampled from that part of your photo, slightly brightened so it is easy to see on the black background. |
| **Low detail** | A softer color view with reduced visual detail. It keeps the original image size while making the subject less immediately recognizable. |
| **Black & white** | Every character is a shade of grey based on how bright that spot in the photo is — no color, just light and dark. |
| **Spectrum** | Characters are colored using a rainbow gradient instead of the photo's real colors — good for a more artistic, less literal look. |

## Features

- Upload any image (JPG, PNG, etc.)
- Switch between Color / Low detail / Black & White / Spectrum instantly
- Zoom slider (1%–300%) to inspect detail, with smooth scrolling
- Download as a `.txt` file (plain ASCII text) or a `.png` image (with colors baked in)

## Requirements

Before you start, make sure you have:

- **Node.js** version 18 or higher — [download here](https://nodejs.org/)
- **npm** (comes bundled with Node.js)

To check what you already have installed, run:
```bash
node -v
npm -v
```

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/souravkh/ascii-lens.git

# 2. Move into the project folder
cd ascii-lens

# 3. Install dependencies
npm install
```

## Running the project

**Start the development server:**
```bash
npm run dev
```
This will print a local URL (usually `http://localhost:5173`) — open it in your browser to use the app. Any changes you make to the code will show up instantly (hot reload).

**Build for production:**
```bash
npm run build
```
This creates an optimized version of the app in a `dist/` folder, ready to be deployed anywhere that serves static files (Vercel, Netlify, GitHub Pages, etc.).

**Preview the production build locally:**
```bash
npm run preview
```

**Check code quality (lint):**
```bash
npm run lint
```

## Project structure

```
ascii-lens/
├── public/                      # Static assets (favicon, icons)
├── src/
│   ├── assets/                  # Image and SVG assets
│   ├── App.tsx                  # Root component — just renders the feature
│   ├── main.tsx                 # App entry point
│   ├── index.css / App.css      # Global styles (Tailwind)
│   └── feature/
│       └── asciiimagechanger/   # The whole ASCII-conversion feature lives here
│           ├── components/
│           │   ├── AsciiCanvas.tsx          # Renders the ASCII grid on screen
│           │   ├── BackgroundEffect.tsx     # Background effect wrapper
│           │   ├── Controls.tsx             # Buttons, mode switcher, zoom slider (UI only)
│           │   └── MatrixRainBackground.tsx # Matrix rain background animation
│           ├── hooks/
│           │   └── useAsciiConverter.ts     # Core logic: turns an image into a character grid
│           ├── utils/
│           │   ├── colorUtils.ts            # Functions that decide what color each character gets
│           │   ├── exportUtils.ts           # Turns the grid into a downloadable PNG
│           │   └── gridUtils.ts             # Helpers for building/exporting the grid as text
│           ├── index.ts                     # Public entry point for this feature
│           ├── AsciiArtConverter.tsx        # Main component — ties everything together
│           ├── AsciiArtConverter_2.tsx      # Alternative main component implementation
│           ├── constants.ts                 # Fixed settings (grid size, font size, etc.)
│           └── types.ts                     # Shared TypeScript types
├── package.json
└── vite.config.ts
```

## Tech stack

- [React 19](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Vite](https://vite.dev/) — dev server & build tool
- [Tailwind CSS](https://tailwindcss.com/) — styling

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.