import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = join(root, 'packages', 'physics-planck');
const temporaryRoot = await mkdtemp(
  join(tmpdir(), 'flixel-pixi-physics-contract-'),
);
const contract = JSON.parse(
  await readFile(join(packageRoot, 'package-artifact.json'), 'utf8'),
);
const manifest = JSON.parse(
  await readFile(join(packageRoot, 'package.json'), 'utf8'),
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(contract.version === 1, 'Unsupported physics adapter contract.');
assert(
  manifest.private === true,
  'The Planck adapter must stay private until its prerelease is approved.',
);
assert(
  manifest.dependencies?.planck === '1.4.2',
  'The evaluated Planck.js version must remain pinned exactly.',
);
assert(
  manifest.peerDependencies?.['flixel-pixi'] !== undefined,
  'The adapter must declare flixel-pixi as a peer dependency.',
);

let packed;
try {
  const { stdout } = await execute(
    'npm',
    [
      'pack',
      '--dry-run',
      '--json',
      '--ignore-scripts',
      '--cache',
      temporaryRoot,
    ],
    { cwd: packageRoot, maxBuffer: 10 * 1024 * 1024 },
  );
  [packed] = JSON.parse(stdout);
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}

assert(packed, 'npm pack --dry-run did not describe the physics adapter.');
const actualFiles = packed.files.map(({ path }) => path).sort();
const expectedFiles = [...contract.files].sort();
assert(
  JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
  `Packed physics adapter files changed.\nExpected: ${expectedFiles.join(', ')}\nActual: ${actualFiles.join(', ')}`,
);
assert(
  packed.size <= contract.packedBytesMax,
  `Physics adapter is ${packed.size} packed bytes; budget is ${contract.packedBytesMax}.`,
);
assert(
  packed.unpackedSize <= contract.unpackedBytesMax,
  `Physics adapter is ${packed.unpackedSize} unpacked bytes; budget is ${contract.unpackedBytesMax}.`,
);

const { createPlanckPhysicsBackend } = await import(
  pathToFileURL(join(packageRoot, 'dist', 'index.js')).href
);
const backend = createPlanckPhysicsBackend();
assert(
  backend.capabilities.shapes.includes('box') &&
    backend.native.world.getBodyCount() === 0,
  'Built physics adapter did not initialize with its declared capabilities.',
);
backend.destroy();

console.log(
  `Physics adapter contract passed: ${packed.size} packed bytes, ${packed.unpackedSize} unpacked bytes, ${actualFiles.length} files.`,
);
