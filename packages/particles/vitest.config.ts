import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@flixel-pixi/schemas': fileURLToPath(
        new URL('../schemas/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
    include: ['tests/**/*.test.ts'],
  },
});
