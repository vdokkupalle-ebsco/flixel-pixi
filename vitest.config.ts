import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/index.ts',
        // DOM/browser integration is exercised by the Playwright gate.
        'src/audio/web-audio-backend.ts',
        'src/browser/create-browser-game.ts',
        'src/debugger/flx-debugger.ts',
        'src/storage/indexed-db-backend.ts',
      ],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        branches: 88,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    include: ['tests/unit/**/*.test.ts'],
  },
});
