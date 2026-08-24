import { fileURLToPath } from 'node:url';

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
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
    include: ['tests/**/*.test.ts'],
  },
});
