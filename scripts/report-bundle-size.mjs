import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { gzipSync } from 'node:zlib';

const bundleUrl = new URL('../dist/index.js', import.meta.url);
const reportDirectoryUrl = new URL('../reports/', import.meta.url);
const reportUrl = new URL('bundle-size.json', reportDirectoryUrl);
const bundle = await readFile(bundleUrl);
const report = {
  file: 'dist/index.js',
  gzipBytes: gzipSync(bundle).byteLength,
  rawBytes: bundle.byteLength,
};

await mkdir(reportDirectoryUrl, { recursive: true });
await writeFile(reportUrl, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
