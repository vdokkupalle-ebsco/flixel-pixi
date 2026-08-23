import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const gamesDist = join(rootDir, 'dist/games');
const publicGamesDir = join(rootDir, 'docs/public/games');
const particleEditorDist = join(rootDir, 'apps/particle-editor/dist');
const publicParticleEditorDir = join(rootDir, 'docs/public/particle-editor');
const particleEffectSampleDir = join(rootDir, 'examples/games/particle-effect');
const publicParticleEffectSampleDir = join(
  rootDir,
  'docs/public/downloads/campfire-particle-effect',
);

if (existsSync(gamesDist)) {
  mkdirSync(publicGamesDir, { recursive: true });
  cpSync(gamesDist, publicGamesDir, { recursive: true });
  console.log(`Copied ${gamesDist} to ${publicGamesDir}`);
} else {
  console.log('dist/games does not exist yet. Run npm run build:games first.');
}

if (existsSync(particleEditorDist)) {
  rmSync(publicParticleEditorDir, { force: true, recursive: true });
  mkdirSync(publicParticleEditorDir, { recursive: true });
  cpSync(particleEditorDist, publicParticleEditorDir, { recursive: true });
  console.log(`Copied ${particleEditorDist} to ${publicParticleEditorDir}`);
} else {
  console.log(
    'apps/particle-editor/dist does not exist yet. Run npm run build:apps first.',
  );
}

if (existsSync(particleEffectSampleDir)) {
  rmSync(publicParticleEffectSampleDir, { force: true, recursive: true });
  mkdirSync(publicParticleEffectSampleDir, { recursive: true });
  for (const filename of [
    'campfire-effect.json',
    'flame.svg',
    'ember.svg',
    'smoke.svg',
    'STARTER.txt',
  ]) {
    cpSync(
      join(particleEffectSampleDir, filename),
      join(publicParticleEffectSampleDir, filename),
    );
  }
  console.log(
    `Copied the campfire starter files to ${publicParticleEffectSampleDir}`,
  );
}
