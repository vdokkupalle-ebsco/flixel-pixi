import { rm } from 'node:fs/promises';

const generatedDirectories = [
  'coverage',
  'dist',
  'playwright-report',
  'reports',
  'temp',
  'test-results',
];

await Promise.all(
  generatedDirectories.map((directory) =>
    rm(new URL(`../${directory}`, import.meta.url), {
      force: true,
      recursive: true,
    }),
  ),
);
