import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'examples/games'),
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, 'dist/games'),
    rollupOptions: {
      input: {
        hello: resolve(import.meta.dirname, 'examples/games/hello/index.html'),
        platformer: resolve(
          import.meta.dirname,
          'examples/games/platformer/index.html',
        ),
        action: resolve(
          import.meta.dirname,
          'examples/games/action/index.html',
        ),
        external: resolve(
          import.meta.dirname,
          'examples/games/external/index.html',
        ),
        index: resolve(import.meta.dirname, 'examples/games/index.html'),
      },
    },
    sourcemap: true,
  },
  server: {
    port: 4174,
  },
});
