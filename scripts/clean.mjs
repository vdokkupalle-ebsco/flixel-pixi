import { readdir, rm } from 'node:fs/promises';

const generatedDirectories = [
  'coverage',
  'dist',
  'playwright-report',
  'reports',
  'temp',
  'test-results',
];

const workspaceArtifacts = [];
for (const workspaceRoot of ['packages', 'apps']) {
  const entries = await readdir(
    new URL(`../${workspaceRoot}/`, import.meta.url),
    {
      withFileTypes: true,
    },
  );
  for (const entry of entries) {
    if (entry.isDirectory()) {
      workspaceArtifacts.push(
        `${workspaceRoot}/${entry.name}/dist`,
        `${workspaceRoot}/${entry.name}/tsconfig.build.tsbuildinfo`,
      );
    }
  }
}

await Promise.all(
  [...generatedDirectories, ...workspaceArtifacts].map((artifact) =>
    rm(new URL(`../${artifact}`, import.meta.url), {
      force: true,
      recursive: true,
    }),
  ),
);
