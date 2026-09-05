import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    minify: false,
    outDir: 'dist',
    rollupOptions: {
      external: ['pixi.js'],
    },
    sourcemap: true,
  },
});
