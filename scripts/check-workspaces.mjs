import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const expectedWorkspacePatterns = ['packages/*', 'apps/*'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalJson(value) {
  return JSON.stringify(value);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function discoverWorkspaceManifests(directory) {
  const parent = join(root, directory);
  const entries = await readdir(parent, { withFileTypes: true });
  const manifests = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(parent, entry.name, 'package.json');
    try {
      manifests.push({
        directory,
        manifest: await readJson(manifestPath),
        path: `${directory}/${entry.name}/package.json`,
      });
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  return manifests;
}

const packageJson = await readJson(join(root, 'package.json'));
const packageLock = await readJson(join(root, 'package-lock.json'));

assert(
  canonicalJson(packageJson.workspaces) ===
    canonicalJson(expectedWorkspacePatterns),
  `Root workspaces must be ${canonicalJson(expectedWorkspacePatterns)}.`,
);
assert(
  canonicalJson(packageLock.packages?.['']?.workspaces) ===
    canonicalJson(expectedWorkspacePatterns),
  'package-lock.json is not synchronized with the root workspace patterns.',
);
assert(
  packageJson.name === 'flixel-pixi' && packageJson.private === false,
  'The root flixel-pixi package must remain publishable.',
);

const manifests = [
  ...(await discoverWorkspaceManifests('packages')),
  ...(await discoverWorkspaceManifests('apps')),
];
const names = new Set();

for (const { directory, manifest, path } of manifests) {
  assert(
    typeof manifest.name === 'string' &&
      manifest.name.startsWith('@flixel-pixi/'),
    `${path} must use the @flixel-pixi scope.`,
  );
  assert(!names.has(manifest.name), `Duplicate workspace: ${manifest.name}.`);
  names.add(manifest.name);

  if (directory === 'apps') {
    assert(manifest.private === true, `${path} must set private to true.`);
    continue;
  }

  if (manifest.private !== true) {
    assert(
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version),
      `${path} must declare a valid version before publication.`,
    );
    assert(
      manifest.publishConfig?.access === 'public' &&
        manifest.publishConfig?.provenance === true,
      `${path} must publish publicly with npm provenance enabled.`,
    );
  }
}

console.log(
  `Workspace contract passed: ${manifests.length} package manifest${manifests.length === 1 ? '' : 's'} across packages/* and apps/*.`,
);
