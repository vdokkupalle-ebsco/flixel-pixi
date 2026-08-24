import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import {
  copyFile,
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
const adapterRoot = join(root, 'packages', 'physics-planck');
const planckRoot = join(root, 'node_modules', 'planck');
const exampleRoot = join(root, 'examples', 'games', 'physics-playground');
const temporaryRoot = await mkdtemp(
  join(tmpdir(), 'flixel-pixi-physics-playground-'),
);
const packageDirectory = join(temporaryRoot, 'packages');
const consumerDirectory = join(temporaryRoot, 'consumer');
const npmCache = join(temporaryRoot, 'npm-cache');
let server;
let browser;

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function pack(packageRoot) {
  const { stdout } = await run(
    'npm',
    [
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      packageDirectory,
      '--cache',
      npmCache,
    ],
    { cwd: packageRoot },
  );
  const [packed] = JSON.parse(stdout);
  assert(packed, `npm pack did not describe ${packageRoot}.`);
  return join(packageDirectory, packed.filename);
}

async function writeConsumerFixture() {
  await mkdir(consumerDirectory, { recursive: true });
  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'flixel-pixi-packed-physics-playground',
        private: true,
        type: 'module',
      },
      null,
      2,
    )}\n`,
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
        include: ['*.ts'],
      },
      null,
      2,
    )}\n`,
  );
  await Promise.all(
    ['game.ts', 'index.html', 'main.ts', 'style.css'].map((file) =>
      copyFile(join(exampleRoot, file), join(consumerDirectory, file)),
    ),
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
  await writeConsumerFixture();

  const engineTarball = await pack(root);
  const adapterTarball = await pack(adapterRoot);
  const planckTarball = await pack(planckRoot);
  await run(
    'npm',
    [
      'install',
      engineTarball,
      adapterTarball,
      planckTarball,
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--cache',
      npmCache,
    ],
    { cwd: consumerDirectory },
  );
  await linkPixiPeer();

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
  await page.waitForFunction(
    () =>
      (globalThis.__FLIXEL_PIXI_PHYSICS__?.snapshot?.().sensorEntries ?? 0) > 0,
  );

  const snapshot = await page.evaluate(() =>
    globalThis.__FLIXEL_PIXI_PHYSICS__?.snapshot?.(),
  );
  assert(snapshot?.bodies === 12, 'Packed playground body count is incorrect.');
  assert(
    Number.isFinite(snapshot.dynamicY),
    'Packed playground did not advance its dynamic bodies.',
  );
  const query = await page.evaluate(() =>
    globalThis.__FLIXEL_PIXI_PHYSICS__?.queryAt?.(100, 440),
  );
  assert(query?.includes('floor'), 'Packed playground point query failed.');
  assert(
    (await page.locator('canvas').count()) === 1,
    'Packed playground did not create one canvas.',
  );

  await page.locator('[data-action="destroy"]').click();
  await page
    .locator('[data-testid="status"][data-state="destroyed"]')
    .waitFor();
  assert(
    (await page.locator('canvas').count()) === 0,
    'Packed playground did not remove its canvas.',
  );
  assert(
    browserErrors.length === 0,
    `Packed playground logged errors:\n${browserErrors.join('\n')}`,
  );

  console.log(
    'Packed physics playground passed: root and adapter tarballs typecheck, bundle, boot, simulate, query, and destroy in a clean consumer.',
  );
} finally {
  await browser?.close();
  await closeServer(server);
  await rm(temporaryRoot, { force: true, recursive: true });
}
