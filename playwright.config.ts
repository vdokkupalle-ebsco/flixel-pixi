import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: process.env.CI === undefined ? 'list' : 'github',
  retries: process.env.CI === undefined ? 0 : 2,
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
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
