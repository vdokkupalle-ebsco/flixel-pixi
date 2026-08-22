import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import {
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { chromium } from 'playwright';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const contract = JSON.parse(
  await readFile(join(root, 'package-artifact.json'), 'utf8'),
);
const temporaryRoot = await mkdtemp(join(tmpdir(), 'flixel-pixi-package-'));
const npmCache = join(temporaryRoot, 'npm-cache');
const packageDirectory = join(temporaryRoot, 'package');
const consumerDirectory = join(temporaryRoot, 'consumer');
let server;
let browser;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalJson(value) {
  return JSON.stringify(value);
}

async function run(command, arguments_, options = {}) {
  try {
    return await execute(command, arguments_, {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const details = [error.stdout, error.stderr].filter(Boolean).join('\n');
    throw new Error(
      `${command} ${arguments_.join(' ')} failed${details ? `:\n${details}` : ''}`,
      { cause: error },
    );
  }
}

async function writeConsumerFixture() {
  await mkdir(join(consumerDirectory, 'src'), { recursive: true });
  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify({ name: 'flixel-pixi-package-consumer', private: true, type: 'module' }, null, 2)}\n`,
  );
  await writeFile(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          lib: ['DOM', 'ES2022'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          strict: true,
          target: 'ES2022',
        },
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><title>Package consumer</title></head>
  <body>
    <main>
      <p data-testid="status" data-state="booting">Booting package…</p>
      <div data-testid="host"></div>
      <button data-testid="destroy" type="button">Destroy</button>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
  );
  await writeFile(
    join(consumerDirectory, 'src/main.ts'),
    `import { createBrowserGame, FlxSprite, FlxState } from 'flixel-pixi';

class PackageState extends FlxState {
  override create(): void {
    const sprite = new FlxSprite(24, 24);
    sprite.makeGraphic(16, 16, 0x22c55e);
    this.add(sprite);
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroy = document.querySelector<HTMLButtonElement>('[data-testid="destroy"]');
if (!host || !status || !destroy) throw new Error('Consumer fixture DOM is incomplete.');

try {
  const application = await createBrowserGame({
    accessibility: false,
    height: 64,
    host,
    initialState: PackageState,
    preloader: false,
    width: 64,
  });
  status.dataset.state = 'ready';
  status.textContent = 'Packed package ready';
  destroy.addEventListener('click', () => {
    application.destroy();
    status.dataset.state = 'destroyed';
    status.textContent = 'Packed package destroyed';
  });
} catch (error) {
  status.dataset.state = 'error';
  status.textContent = error instanceof Error ? error.message : String(error);
  throw error;
}
`,
  );
  await writeFile(
    join(consumerDirectory, 'runtime-check.mjs'),
    `import { FlxPoint, libraryName, upstreamBaseline } from 'flixel-pixi';

const point = new FlxPoint(2, 3);
if (point.x !== 2 || point.y !== 3) throw new Error('Root ESM export is unusable.');
if (libraryName !== 'flixel-pixi' || !upstreamBaseline.commit) {
  throw new Error('Package metadata exports are unusable.');
}

try {
  await import('flixel-pixi/dist/index.js');
  throw new Error('An undeclared deep import unexpectedly resolved.');
} catch (error) {
  if (error?.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error;
}
`,
  );
}

async function linkPixiPeer() {
  const source = join(root, 'node_modules', 'pixi.js');
  const target = join(consumerDirectory, 'node_modules', 'pixi.js');
  assert(
    (await lstat(source)).isDirectory(),
    'The repository PixiJS peer is missing.',
  );
  await symlink(
    source,
    target,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
}

function contentType(file) {
  return (
    {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.map': 'application/json; charset=utf-8',
    }[extname(file)] ?? 'application/octet-stream'
  );
}

async function startStaticServer(directory) {
  const rootWithSeparator = `${resolve(directory)}${sep}`;
  const instance = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://local').pathname,
      );
      const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
      const file = resolve(directory, requested);
      assert(
        file === resolve(directory) || file.startsWith(rootWithSeparator),
        'Invalid path.',
      );
      response.writeHead(200, { 'content-type': contentType(file) });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolveListen, reject) => {
    instance.once('error', reject);
    instance.listen(0, '127.0.0.1', resolveListen);
  });
  return instance;
}

async function closeServer(instance) {
  if (!instance) return;
  await new Promise((resolveClose, reject) => {
    instance.close((error) => (error ? reject(error) : resolveClose()));
  });
}

try {
  await mkdir(packageDirectory, { recursive: true });
  const { stdout } = await run('npm', [
    'pack',
    '--json',
    '--pack-destination',
    packageDirectory,
    '--cache',
    npmCache,
  ]);
  const [packed] = JSON.parse(stdout);
  assert(packed, 'npm pack did not describe an artifact.');

  const actualFiles = packed.files.map(({ path }) => path).sort();
  const expectedFiles = [...contract.files].sort();
  assert(
    JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
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

  const tarball = join(packageDirectory, packed.filename);
  await writeConsumerFixture();
  await run(
    'npm',
    [
      'install',
      tarball,
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
      '--cache',
      npmCache,
    ],
    { cwd: consumerDirectory },
  );
  await linkPixiPeer();

  const installedRoot = join(consumerDirectory, 'node_modules', 'flixel-pixi');
  const packageJson = JSON.parse(
    await readFile(join(installedRoot, 'package.json'), 'utf8'),
  );
  for (const [field, expected] of Object.entries(contract.manifest)) {
    const actual = packageJson[field];
    assert(
      canonicalJson(actual) === canonicalJson(expected),
      `Packed package ${field} differs from the contract.\nExpected: ${canonicalJson(expected)}\nActual: ${canonicalJson(actual)}`,
    );
  }
  assert(
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version),
    `Package version is invalid: ${packageJson.version}.`,
  );
  const changelog = await readFile(join(installedRoot, 'CHANGELOG.md'), 'utf8');
  assert(
    changelog.includes(`## ${packageJson.version}`),
    `CHANGELOG.md has no entry for ${packageJson.version}.`,
  );

  const sourceMap = JSON.parse(
    await readFile(join(installedRoot, 'dist', 'index.js.map'), 'utf8'),
  );
  const bundle = await readFile(
    join(installedRoot, 'dist', 'index.js'),
    'utf8',
  );
  assert(
    bundle.includes('//# sourceMappingURL=index.js.map'),
    'Bundle does not reference its source map.',
  );
  assert(sourceMap.sources.length > 0, 'Source map has no sources.');
  assert(
    sourceMap.sourcesContent?.length === sourceMap.sources.length,
    'Source map does not embed every original source.',
  );
  assert(
    sourceMap.sources.every(
      (source) => !source.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(source),
    ),
    'Source map exposes an absolute build-machine path.',
  );

  await run(process.execPath, [
    join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--project',
    join(consumerDirectory, 'tsconfig.json'),
  ]);
  await run(process.execPath, [
    join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build',
    consumerDirectory,
    '--outDir',
    join(consumerDirectory, 'dist'),
    '--emptyOutDir',
  ]);
  await run(process.execPath, [join(consumerDirectory, 'runtime-check.mjs')], {
    cwd: consumerDirectory,
  });

  server = await startStaticServer(join(consumerDirectory, 'dist'));
  const address = server.address();
  assert(
    address && typeof address !== 'string',
    'Static server did not expose a port.',
  );
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.locator('[data-testid="status"][data-state="ready"]').waitFor();
  assert(
    (await page.locator('canvas').count()) === 1,
    'Packed browser app did not create one canvas.',
  );
  await page.getByTestId('destroy').click();
  await page
    .locator('[data-testid="status"][data-state="destroyed"]')
    .waitFor();
  assert(
    (await page.locator('canvas').count()) === 0,
    'Packed browser app did not remove its canvas.',
  );
  assert(
    browserErrors.length === 0,
    `Packed browser app logged errors:\n${browserErrors.join('\n')}`,
  );

  console.log(
    `Package artifact passed: ${packed.filename}, ${packed.size} packed bytes, ${packed.unpackedSize} unpacked bytes, ${actualFiles.length} files.`,
  );
  console.log(
    'Clean consumer passed: ESM, TypeScript, Vite, source maps, deep-export guard, and browser boot/destroy.',
  );
} finally {
  await browser?.close();
  await closeServer(server);
  await rm(temporaryRoot, { force: true, recursive: true });
}
