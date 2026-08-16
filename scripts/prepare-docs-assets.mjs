import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const gamesDist = join(rootDir, 'dist/games');
const publicGamesDir = join(rootDir, 'docs/public/games');

if (existsSync(gamesDist)) {
  mkdirSync(publicGamesDir, { recursive: true });
  cpSync(gamesDist, publicGamesDir, { recursive: true });
  console.log(`Copied ${gamesDist} to ${publicGamesDir}`);
} else {
  console.log('dist/games does not exist yet. Run npm run build:games first.');
}
