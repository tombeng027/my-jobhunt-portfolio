import { defineConfig } from 'vite';

// Use relative paths so the built site works when deployed under a subpath (e.g. GitHub Pages)
export default defineConfig({
  base: './',
});
