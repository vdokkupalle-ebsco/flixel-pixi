#!/usr/bin/env node
/**
 * Public API guard: examples/games may only import the engine via the public package
 * entry (or the repo root `src` / `src/index` re-export), never deep modules.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const gamesDir = join(root, 'examples', 'games');

const IMPORT_RE = /(?:from|import)\s+['"]([^'"]+)['"]/g;

/** Paths that count as the public engine surface. */
function isAllowedEngineImport(specifier) {
  if (specifier === 'flixel-pixi') return true;
  // Relative path ending at src or src/index (with optional .ts/.js)
  if (/\/src(?:\/index)?(?:\.(?:ts|js|mts|mjs))?$/.test(specifier)) return true;
  if (specifier === '../../../src' || specifier === '../../../src/index')
    return true;
  if (specifier === '../../src' || specifier === '../../src/index') return true;
  if (specifier === '../src' || specifier === '../src/index') return true;
  return false;
}

function isDeepEngineImport(specifier) {
  // Anything under src/ that isn't the barrel
  if (!specifier.includes('/src/') && !specifier.startsWith('src/')) {
    // Also catch alias-style deep imports if added later
    return false;
  }
  if (isAllowedEngineImport(specifier)) return false;
  return /[/\\]src[/\\](?!index(?:\.(?:ts|js))?$).+/.test(specifier);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

const files = await walk(gamesDir);
const violations = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1];
    if (isDeepEngineImport(specifier)) {
      violations.push({
        file: relative(root, file),
        specifier,
      });
    }
  }
}

if (violations.length > 0) {
  console.error('Sample-game public-import guard failed:\n');
  for (const v of violations) {
    console.error(`  ${v.file}\n    → ${v.specifier}`);
  }
  console.error(
    '\nGames must import the engine only from `flixel-pixi` or `.../src` (barrel).',
  );
  process.exit(1);
}

console.log(
  `Sample-game public-import guard passed (${files.length} files under examples/games).`,
);
