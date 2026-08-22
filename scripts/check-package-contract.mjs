import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const contract = JSON.parse(
  await readFile(join(root, 'package-artifact.json'), 'utf8'),
);
const packageJson = JSON.parse(
  await readFile(join(root, 'package.json'), 'utf8'),
);
const temporaryRoot = await mkdtemp(join(tmpdir(), 'flixel-pixi-contract-'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalJson(value) {
  return JSON.stringify(value);
}

assert(contract.version === 2, 'Unsupported package artifact contract.');
assert(
  contract.manifest && typeof contract.manifest === 'object',
  'The package manifest contract is missing.',
);

for (const [field, expected] of Object.entries(contract.manifest)) {
  const actual = packageJson[field];
  assert(
    canonicalJson(actual) === canonicalJson(expected),
    `package.json ${field} changed.\nExpected: ${canonicalJson(expected)}\nActual: ${canonicalJson(actual)}`,
  );
}

assert(
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version),
  `Package version is invalid: ${packageJson.version}.`,
);

const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8');
assert(
  changelog.includes(`## ${packageJson.version}`),
  `CHANGELOG.md has no entry for ${packageJson.version}.`,
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
    {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  [packed] = JSON.parse(stdout);
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
assert(packed, 'npm pack --dry-run did not describe an artifact.');

const actualFiles = packed.files.map(({ path }) => path).sort();
const expectedFiles = [...contract.files].sort();
assert(
  canonicalJson(actualFiles) === canonicalJson(expectedFiles),
  `Packed file set differs from package-artifact.json.\nExpected: ${expectedFiles.join(', ')}\nActual: ${actualFiles.join(', ')}`,
);
assert(
  packed.size <= contract.packedBytesMax,
  `Packed artifact is ${packed.size} bytes; budget is ${contract.packedBytesMax}.`,
);
assert(
  packed.unpackedSize <= contract.unpackedBytesMax,
  `Unpacked artifact is ${packed.unpackedSize} bytes; budget is ${contract.unpackedBytesMax}.`,
);

console.log(
  `Package contract passed: ${packageJson.name}@${packageJson.version}, ${packed.size} packed bytes, ${packed.unpackedSize} unpacked bytes, ${actualFiles.length} files.`,
);
