import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      'flixel-pixi': fileURLToPath(
        new URL('../../src/index.ts', import.meta.url),
      ),
    },
  },
});
