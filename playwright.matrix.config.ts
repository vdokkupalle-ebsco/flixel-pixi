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
  testDir: './tests/browser-matrix',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:games -- --host 127.0.0.1 --port 4174',
    reuseExistingServer: process.env.CI === undefined,
    timeout: 120_000,
    url: 'http://127.0.0.1:4174',
  },
  projects: [
    {
      name: 'chromium-android',
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
    {
      name: 'webkit-ios',
      use: { ...devices['iPhone 15'], browserName: 'webkit' },
    },
  ],
});
