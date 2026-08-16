import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
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
        tweens: resolve(
          import.meta.dirname,
          'examples/games/tweens/index.html',
        ),
        animation: resolve(
          import.meta.dirname,
          'examples/games/animation/index.html',
        ),
        atlas: resolve(import.meta.dirname, 'examples/games/atlas/index.html'),
        containers: resolve(
          import.meta.dirname,
          'examples/games/containers/index.html',
        ),
        filters: resolve(
          import.meta.dirname,
          'examples/games/filters/index.html',
        ),
        meshes: resolve(
          import.meta.dirname,
          'examples/games/meshes/index.html',
        ),
        graphics: resolve(
          import.meta.dirname,
          'examples/games/graphics/index.html',
        ),
        swipe: resolve(import.meta.dirname, 'examples/games/swipe/index.html'),
        ui: resolve(import.meta.dirname, 'examples/games/ui/index.html'),
        viewport: resolve(
          import.meta.dirname,
          'examples/games/viewport/index.html',
        ),
        'ambient-audio': resolve(
          import.meta.dirname,
          'examples/games/ambient-audio/index.html',
        ),
        substates: resolve(
          import.meta.dirname,
          'examples/games/substates/index.html',
        ),
        external: resolve(
          import.meta.dirname,
          'examples/games/external/index.html',
        ),
        'flx-invaders': resolve(
          import.meta.dirname,
          'examples/games/flx-invaders/index.html',
        ),
        'kenney-platformer': resolve(
          import.meta.dirname,
          'examples/games/kenney-platformer/index.html',
        ),
        'bench-sprites': resolve(
          import.meta.dirname,
          'examples/games/bench-sprites/index.html',
        ),
        'bench-soak': resolve(
          import.meta.dirname,
          'examples/games/bench-soak/index.html',
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
