import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'examples/smoke'),
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, 'dist/smoke'),
    rollupOptions: {
      input: {
        rendering: resolve(
          import.meta.dirname,
          'examples/smoke/rendering.html',
        ),
        'sprites-text': resolve(
          import.meta.dirname,
          'examples/smoke/sprites-text.html',
        ),
        cameras: resolve(import.meta.dirname, 'examples/smoke/cameras.html'),
        tilemaps: resolve(import.meta.dirname, 'examples/smoke/tilemaps.html'),
        input: resolve(import.meta.dirname, 'examples/smoke/input.html'),
        effects: resolve(import.meta.dirname, 'examples/smoke/effects.html'),
        'platform-services': resolve(
          import.meta.dirname,
          'examples/smoke/platform-services.html',
        ),
        replay: resolve(import.meta.dirname, 'examples/smoke/replay.html'),
        debugger: resolve(import.meta.dirname, 'examples/smoke/debugger.html'),
        smoke: resolve(import.meta.dirname, 'examples/smoke/index.html'),
      },
    },
    sourcemap: true,
  },
});
