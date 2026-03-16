# Job Hunt Portfolio

This workspace contains a portfolio website scaffolded with Vite (vanilla JavaScript).

## Workflow

1. Make content and UI changes on the `development` branch.
2. Validate with `npm run build` inside `portfolio-site`.
3. Merge `development` into `main` to trigger GitHub Pages deployment.

Patch notes for release-sized updates are tracked in `docs/PATCHNOTES.md`.

## Getting started

1. Install dependencies:

   ```bash
   cd portfolio-site
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   ```

## Where to edit

- `portfolio-site/index.html`: main HTML entry
- `portfolio-site/src/main.js`: app entry JS
- `portfolio-site/src/style.css`: global styles
- `portfolio-site/public/documentation.html`: public-facing portfolio documentation
- `docs/PATCHNOTES.md`: repository patch notes and release log

## Release status

- Current release work was prepared on `development` during March 2026.
- Production deployment is handled by `.github/workflows/deploy.yml` after merge to `main`.
