import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
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
  test: {
    environment: 'happy-dom',
    coverage: { reporter: ['text', 'json-summary'] },
  },
});
