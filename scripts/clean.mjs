import { readdir, rm } from 'node:fs/promises';

const generatedDirectories = [
  'coverage',
  'dist',
  'playwright-report',
  'reports',
  'temp',
  'test-results',
];

const workspaceDirectories = [];
for (const workspaceRoot of ['packages', 'apps']) {
  const entries = await readdir(
    new URL(`../${workspaceRoot}/`, import.meta.url),
    {
      withFileTypes: true,
    },
  );
  for (const entry of entries) {
    if (entry.isDirectory()) {
      workspaceDirectories.push(`${workspaceRoot}/${entry.name}/dist`);
    }
  }
}

await Promise.all(
  [...generatedDirectories, ...workspaceDirectories].map((directory) =>
    rm(new URL(`../${directory}`, import.meta.url), {
      force: true,
      recursive: true,
    }),
  ),
);
