import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Use relative paths so the built site works when deployed under a subpath (e.g. GitHub Pages)
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        insurtechPrototype: resolve(__dirname, 'insurtech-prototype.html'),
      },
    },
  },
});
