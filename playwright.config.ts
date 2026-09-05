import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  ...(process.env.CI === undefined ? {} : { workers: 1 }),
  reporter: process.env.CI === undefined ? 'list' : 'github',
  retries: process.env.CI === undefined ? 0 : 1,
  snapshotPathTemplate:
    '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev:smoke -- --host 127.0.0.1 --port 4173',
      reuseExistingServer: process.env.CI === undefined,
      timeout: 120_000,
      url: 'http://127.0.0.1:4173',
    },
    {
      command: 'npm run dev:games -- --host 127.0.0.1 --port 4174',
      reuseExistingServer: process.env.CI === undefined,
      timeout: 120_000,
      url: 'http://127.0.0.1:4174',
    },
    {
      command:
        'npm run dev --workspace @flixel-pixi/level-editor -- --host 127.0.0.1 --port 4176',
      reuseExistingServer: process.env.CI === undefined,
      timeout: 120_000,
      url: 'http://127.0.0.1:4176',
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      grep: /@cross-browser/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      grep: /@cross-browser/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
