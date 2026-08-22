import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'flixel-pixi': fileURLToPath(
        new URL('../../src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
});
