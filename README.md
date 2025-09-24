# Traces of HIV - Archive for Viral Memory

Traces of HIV is an experimental web archive that stages community memory about HIV/AIDS as an evolving performance. The interface blends live-rendered typography, a 3D model of viral data, curated reading lists, and community contributions sourced from the field. The project is developed by Elias Capelle and Paul Dombrowski as part of the HivAidsArchive/Traces of HIV research initiative.

## Live Experience

- Production: https://pauldombrowski.github.io/tracinghiv/
- Built for contemporary Chromium, Firefox, and Safari browsers on desktop and mobile.

## Key Features

- **Immersive landing stage** with a reactive glitch title (`src/TitleHeader.jsx`), custom cursor trail (`src/CursorDot.jsx`), and a Three.js HIV model rendered through React Three Fiber (`src/HivModelStage.jsx`).
- **PDF performance mode** that streams pages from `public/masti_upload_version-4.pdf`, applies parallax narration (`src/StageColumns.jsx`), and lazy-renders canvases using `pdf.js` workers for smooth scrolling.
- **Research archive overlay** backed by Firebase Firestore (`src/Archive.jsx`) with live search, responsive layouts, hover previews, and deep item detail views including related material suggestions.
- **Community shuffle view** (`src/Shuffle.jsx`) that surfaces random artefacts, keyboard shortcuts, and animated transitions to inspire serendipitous exploration.
- **Contribution workflow** (`src/Upload.jsx`) that validates metadata, enforces file-size limits, uploads assets to Firebase Storage, and writes structured entries into Firestore.
- **Context modules** for about, imprint, and bibliographies (`src/About.jsx`, `src/Imprint.jsx`, `src/RightTextComponent.js`) that pair research framing with archival theory.

## Tech Stack

- React 18 with Create React App tooling (`react-scripts`).
- React Three Fiber, Drei, and Three.js for the responsive model stage.
- Framer Motion for micro-interactions and animation choreography.
- Firebase (Firestore + Storage) for data persistence and asset delivery.
- pdf.js for high-resolution PDF rendering.
- GitHub Pages deployment via `gh-pages`.

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the development server (defaults to http://localhost:3000)
   ```bash
   npm start
   ```
3. Build a production bundle
   ```bash
   npm run build
   ```
4. Deploy to GitHub Pages (publishes `/build` to the `gh-pages` branch)
   ```bash
   npm run deploy
   ```

> Recommended: Node 18+ and npm 9+ for matching the version matrix used during development.

## Firebase Setup

The app expects a Firebase project named `hivarchive`, but any project will work as long as the config matches. The configuration is hard-coded in three modules:

- `src/Archive.jsx`
- `src/Shuffle.jsx`
- `src/Upload.jsx`

For production use you may want to move these values into environment variables (e.g., `.env` + `process.env.REACT_APP_*`) to avoid committing secrets.

### Firestore

- Enable Cloud Firestore in **production mode** (secure access rules are required; see below).
- Create a collection called `uploads`. Each document represents one archive item.
- Expected fields (create via Upload form or seed manually):
  - `title` (string)
  - `description` (string)
  - `category` (array of strings)
  - `type` (string)
  - `source` (string URL, optional)
  - `fileURLs` (array of storage URLs)
  - `thumbnailURL` (string URL, optional)
  - `additionalInfo` (array of URLs/notes)
  - `uploader` (string)
  - `motivation` (string)
  - `mood` (string)
  - `tags` (array of strings)
  - `createdAt` (timestamp; created automatically by the Upload form)

Sample security rules (adjust to your needs):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /uploads/{docId} {
      allow read: if request.time < timestamp.date(9999, 1, 1);
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

### Storage

- Enable Firebase Storage and create the following folders (created automatically on first upload):
  - `uploads/` for artefact files (max 1MB per file, up to 4 files per submission).
  - `thumbnails/` for poster frames used in listings.

Example Storage rule skeleton:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 1 * 1024 * 1024;
    }
    match /thumbnails/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 1 * 1024 * 1024;
    }
  }
}
```

## Asset Requirements

The landing stage relies on local assets bundled in `public/`:

- `masti_upload_version-4.pdf` - source document rendered in the PDF performance mode.
- `pdf.worker.min.js` - pdf.js worker file referenced from `StageColumns.jsx`.
- `hivpdf.glb` - 3D model displayed in the React Three Fiber canvas.
- `reflexions.jpg` - HDRI/environment map for reflective lighting.
- Optional hero imagery (`1.png`, `prep.png`, etc.) used across the interface.

When replacing assets, keep file names or update the corresponding imports.

## Project Layout

```
src/
├── App.js                 # Entry that mounts the main stage
├── Hauptseite.js          # Primary scene orchestration and menu logic
├── TitleHeader.jsx        # Interactive glitch headline
├── CursorDot.jsx          # Custom cursor / trail effect
├── StageColumns.jsx       # PDF renderer + parallax text pairing
├── HivModelStage.jsx      # Three.js Canvas for the HIV model
├── RedMenuOverlay.jsx     # Fullscreen overlay with drawing canvas and navigation
├── Archive.jsx            # Firestore-powered archive list + detail view
├── Shuffle.jsx            # Random artefact surfacing
├── Upload.jsx             # Contribution form posting to Firestore/Storage
├── About.jsx              # Project statement
├── Imprint.jsx            # Legal imprint
├── RightTextComponent.js  # Bibliography scroller beside PDF
└── ...
```

## Accessibility & Performance Notes

- Reduced motion preferences are honoured in scroll/animation hooks where practical.
- PDF rendering lazily loads canvases via an IntersectionObserver, keeping main-thread work manageable on mid-range devices.
- Interactive overlays manage focus, `aria` labels, and ESC/keyboard shortcuts to support keyboard navigation.
- Hover previews degrade gracefully on touch devices by disabling the floating image logic.

## Troubleshooting

- **Blank PDF column**: confirm `public/pdf.worker.min.js` exists and is reachable at runtime.
- **Firebase permission errors**: review Firestore/Storage rules and ensure authenticated access matches your deployment needs.
- **3D model missing**: check that `hivpdf.glb` and `reflexions.jpg` are present and not blocked by CORS.
- **Deployment issues**: delete the `build/` folder and rerun `npm run build` before `npm run deploy` to ensure a clean bundle.

## Roadmap Ideas

- Externalise Firebase config into environment variables and CI secrets.
- Add pagination or filtering facets to the archive table for large collections.
- Provide moderation tooling for incoming submissions.
- Extend the shuffle view with audio/visual previews when available.

---

Feel free to open issues or PRs with improvements. Contributions that strengthen archival safety, accessibility, or storytelling depth are especially welcome.
