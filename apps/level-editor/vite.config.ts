import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        editor: fileURLToPath(new URL('./index.html', import.meta.url)),
        preview: fileURLToPath(new URL('./preview.html', import.meta.url)),
      },
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      'flixel-pixi': fileURLToPath(
        new URL('../../src/index.ts', import.meta.url),
      ),
      '@flixel-pixi/schemas': fileURLToPath(
        new URL('../../packages/schemas/src/index.ts', import.meta.url),
      ),
      '@flixel-pixi/editor-protocol': fileURLToPath(
        new URL('../../packages/editor-protocol/src/index.ts', import.meta.url),
      ),
      '@flixel-pixi/physics-planck': fileURLToPath(
        new URL('../../packages/physics-planck/src/index.ts', import.meta.url),
      ),
    },
  },
});
