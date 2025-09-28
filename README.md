# Traces of HIV — Archive for Viral Memory

Traces of HIV is an experimental web archive that stages community memory about HIV/AIDS through immersive visuals, archival metadata, and participatory submissions.

## Overview
- Immersive landing scene with custom typography, glitch animation, and a React Three Fiber HIV model.
- Scroll-based PDF performance mode paired with contextual copy and interactive overlays.
- Firebase-backed archive, shuffle explorer, and upload flow for community contributions.

## Tech Stack
- React 18 with Create React App tooling (`react-scripts`).
- React Three Fiber, Drei, and Three.js for 3D rendering.
- Framer Motion for motion design and transitions.
- Firebase (Firestore + Storage) for data persistence; configuration lives in the source tree and should be scoped to public-safe credentials.
- pdf.js for streaming high-resolution PDF canvases.

## Development
```bash
npm install
npm start
npm run build
```

## Deployment
- GitHub Pages using `npm run deploy` (publishes `build/` to the `gh-pages` branch).
- Production domain: https://tracing-hiv.com/

## Project Layout Highlights
- `src/App.js` — entry point wiring the main routes and overlay layers.
- `src/Hauptseite.js` — primary scene composition and menu coordination.
- `src/HivModelStage.jsx` — Canvas setup for the 3D model.
- `src/Archive.jsx`, `src/Shuffle.jsx`, `src/Upload.jsx` — archive views and contribution flow.
- `public/` — static assets including the HIV model (`hivpdf.glb`), PDF performance document, and supporting imagery.

## Notes
- Firebase access should be constrained to the minimum privileges required for the public experience. Rotate credentials if they are ever exposed outside the repository.
- Keep asset filenames aligned with the imports in the source; update imports when swapping files.
