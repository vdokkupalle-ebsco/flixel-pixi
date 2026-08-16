import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const docsDir = join(rootDir, 'docs');
const versionsJsonPath = join(docsDir, '.vitepress/versions.json');

const targetVersion = process.argv[2] || 'v0.1.0-rc.5';
const isNext = targetVersion === 'next';
const destDir = join(docsDir, 'versions', targetVersion);

console.log(`Snapshotting documentation for ${targetVersion} to ${destDir}...`);

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

// Copy guide and api if they exist
const guideDir = join(docsDir, 'guide');
const apiDir = join(docsDir, 'api');

if (existsSync(guideDir)) {
  cpSync(guideDir, join(destDir, 'guide'), { recursive: true });
}

if (existsSync(apiDir)) {
  cpSync(apiDir, join(destDir, 'api'), { recursive: true });
}

// Write a custom index.md for this version
const versionTitle = isNext ? 'Next (Development)' : targetVersion;
const versionNotice = isNext
  ? 'Development version — these docs describe the current main branch and may contain unreleased APIs.'
  : `You are viewing archived documentation for ${targetVersion}.`;

const indexMd = `---
title: Documentation (${versionTitle})
description: Flixel-Pixi documentation for ${versionTitle}.
editLink: false
---

# Flixel-Pixi Documentation — ${versionTitle}

::: ${isNext ? 'warning' : 'tip'} ${isNext ? 'Development Version' : 'Historical Snapshot'}
${versionNotice} [View latest documentation →](/)
:::

## Sections

- [Guides & Tutorials](./guide/)
- [API Reference](./api/)

`;

writeFileSync(join(destDir, 'index.md'), indexMd, 'utf8');

// Update versions.json if not present
if (existsSync(versionsJsonPath)) {
  const versionsData = JSON.parse(readFileSync(versionsJsonPath, 'utf8'));
  const versionClean = targetVersion.replace(/^v/, '');
  const exists = versionsData.versions.some(
    (v) => v.version === versionClean || v.tag === targetVersion,
  );

  if (!exists && !isNext) {
    versionsData.versions.unshift({
      version: versionClean,
      tag: targetVersion,
      path: `/versions/${targetVersion}/`,
      label: targetVersion,
    });
    writeFileSync(
      versionsJsonPath,
      JSON.stringify(versionsData, null, 2),
      'utf8',
    );
    console.log(`Updated versions.json with ${targetVersion}`);
  }
}

console.log(
  `Successfully created documentation snapshot for ${targetVersion}!`,
);
