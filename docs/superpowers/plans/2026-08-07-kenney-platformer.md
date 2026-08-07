# Kenney Platformer Sample Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `examples/games/kenney-platformer/` — a Mode-lite side-scroller using curated Kenney Platformer Pack Remastered assets (CC0), atlas→strip baking, and public boot APIs.

**Architecture:** Sample-local `atlas.ts` / `bake.ts` convert Kenney XML+PNG sheets into Flixel horizontal strips. `level.ts` builds a CSV-style number map. `game.ts` hosts Paragon-style jump feel, enemies, coins, lives, and win/lose. Assets live under the sample’s `assets/` and are loaded via `new URL(..., import.meta.url)`. Do not replace `examples/games/platformer/`.

**Tech Stack:** TypeScript, PixiJS v8 (`Texture`, `Assets` optional), Flixel-Pixi public APIs (`FlxTilemap`, `FlxSprite`, `FlxGroup`, `FlxG`, `bootGame`), Vitest (happy-dom), Playwright, Vite games config.

## Global Constraints

- Work on **`main`** only (no separate feature branch/worktree unless the user asks).
- Spec: `docs/superpowers/specs/2026-08-07-kenney-platformer-design.md` — follow it when this plan and the spec disagree on numbers/names, prefer the **spec**.
- Games samples import only `../../../src` public surface + `../_kit/*`; `npm run check:games-imports` must pass.
- Do **not** change behavior of `examples/games/platformer/`.
- Do **not** commit the full `platform-game-assets/` tree; only curated files under `examples/games/kenney-platformer/assets/`.
- Do **not** add new public package exports for atlas/bake helpers (sample-local only).
- Resolution **640×480**; world `TILE = 64`; map **100×16**; bake Kenney art at **50%**.
- Color format for any procedural pixels remains `0xRRGGBBAA` with alpha `ff` when opaque.
- Commit after each task (user previously accepted commit-per-task on this track). Use HEREDOC commit messages. Do not push unless asked.

---

## File map

| Path                                          | Responsibility                                            |
| --------------------------------------------- | --------------------------------------------------------- |
| `examples/games/kenney-platformer/assets/**`  | Curated Kenney PNG/XML + License + background             |
| `examples/games/kenney-platformer/atlas.ts`   | Parse Kenney TextureAtlas XML → `Map<string, AtlasFrame>` |
| `examples/games/kenney-platformer/bake.ts`    | Stitch atlas regions into horizontal strip `Texture`s     |
| `examples/games/kenney-platformer/level.ts`   | `TILE`/`MAP_*`, `makeMapData()`, spawn tables             |
| `examples/games/kenney-platformer/audio.ts`   | Local `AudioContext` synth blips                          |
| `examples/games/kenney-platformer/game.ts`    | `KenneyPlayState` gameplay                                |
| `examples/games/kenney-platformer/main.ts`    | `bootGame` + `window.__FLIXEL_PIXI_KENNEY__`              |
| `examples/games/kenney-platformer/index.html` | Shell (status, canvas-host, destroy)                      |
| `examples/games/kenney-platformer/README.md`  | Controls + Kenney credit                                  |
| `vite.games.config.ts`                        | Rollup input entry                                        |
| `examples/games/index.html`                   | Nav link                                                  |
| `docs/guides/making-games.md`                 | Short “Atlases & tilemaps” pointer                        |
| `.gitignore`                                  | Ignore `platform-game-assets/`                            |
| `tests/unit/kenney-atlas.test.ts`             | XML parser unit tests                                     |
| `tests/browser/kenney-platformer.spec.ts`     | Playwright smoke                                          |

---

### Task 1: Curated assets + gitignore + scaffold HTML/main

**Files:**

- Create: `examples/games/kenney-platformer/assets/**` (copied)
- Create: `examples/games/kenney-platformer/index.html`
- Create: `examples/games/kenney-platformer/main.ts` (stub)
- Create: `examples/games/kenney-platformer/game.ts` (minimal `KenneyPlayState`)
- Modify: `.gitignore` (add `platform-game-assets/`)
- Modify: `vite.games.config.ts` (add entry)
- Modify: `examples/games/index.html` (nav link)

**Interfaces:**

- Consumes: `platform-game-assets/` on disk as copy source; `bootGame` from `../_kit/boot-game`
- Produces: runnable page that sets `data-state=ready` with empty play state; assets present at paths below

- [ ] **Step 1: Copy curated assets**

From repo root:

```bash
SRC=platform-game-assets
DST=examples/games/kenney-platformer/assets
mkdir -p "$DST/backgrounds"
cp "$SRC/License.txt" "$DST/"
cp "$SRC/Spritesheets/spritesheet_ground.png" "$DST/"
cp "$SRC/Spritesheets/spritesheet_ground.xml" "$DST/"
cp "$SRC/Spritesheets/spritesheet_players.png" "$DST/"
cp "$SRC/Spritesheets/spritesheet_players.xml" "$DST/"
cp "$SRC/Spritesheets/spritesheet_enemies.png" "$DST/"
cp "$SRC/Spritesheets/spritesheet_enemies.xml" "$DST/"
cp "$SRC/Spritesheets/spritesheet_items.png" "$DST/"
cp "$SRC/Spritesheets/spritesheet_items.xml" "$DST/"
cp "$SRC/Spritesheets/spritesheet_hud.png" "$DST/"
cp "$SRC/Spritesheets/spritesheet_hud.xml" "$DST/"
cp "$SRC/PNG/Backgrounds/blue_grass.png" "$DST/backgrounds/"
```

Verify files exist (`ls -la "$DST"`). Do **not** copy `spritesheet_complete.*`.

- [ ] **Step 2: Ignore the full pack**

Append to `.gitignore` if not already present:

```
# Local Kenney dump — curated copies live under examples/games/kenney-platformer/assets/
platform-game-assets/
```

- [ ] **Step 3: Scaffold `index.html`**

Mirror `examples/games/platformer/index.html`: title `flixel-pixi — Kenney Platformer`, `h1` `Kenney Platformer`, same `data-testid="status"`, destroy button, `data-testid="canvas-host"`, script `./main.ts`, stylesheet `../_kit/shell.css`.

- [ ] **Step 4: Minimal `game.ts`**

```ts
import { FlxG, FlxState, FlxText } from '../../../src';

export class KenneyPlayState extends FlxState {
  lives = 3;
  coinsCollected = 0;
  status: 'play' | 'won' | 'lost' = 'play';

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff87ceeb;
    const hint = new FlxText(
      8,
      6,
      620,
      'Kenney platformer — assets loading next…',
    );
    hint.setFormat(undefined, 12, 0xff1e293b, 'left');
    hint.scrollFactor.x = 0;
    hint.scrollFactor.y = 0;
    this.add(hint);
  }
}
```

- [ ] **Step 5: Minimal `main.ts`**

Copy structure from `examples/games/platformer/main.ts`, renaming probe to `__FLIXEL_PIXI_KENNEY__`, state `KenneyPlayState`, title `'Kenney Platformer'`, and expose:

```ts
lives: () => number;
coins: () => number;
status: () => 'play' | 'won' | 'lost';
playerY: () => number; // return NaN until player exists
onFloor: () => boolean; // false until player exists
```

Use `WebAudioBackend` + `bootGame` exactly like the platformer sample.

- [ ] **Step 6: Vite + index link**

In `vite.games.config.ts` `rollupOptions.input`, add:

```ts
'kenney-platformer': resolve(
  import.meta.dirname,
  'examples/games/kenney-platformer/index.html',
),
```

In `examples/games/index.html` nav, add:

```html
<a href="./kenney-platformer/"
  ><button type="button">Kenney Platformer</button></a
>
```

- [ ] **Step 7: Smoke the scaffold**

Run: `npm run dev:games` (background), open `/kenney-platformer/`, confirm status becomes ready.

- [ ] **Step 8: Commit**

```bash
git add .gitignore vite.games.config.ts examples/games/index.html examples/games/kenney-platformer
git commit -m "$(cat <<'EOF'
feat: scaffold kenney-platformer sample with curated assets

Copy Kenney CC0 sheets into the sample folder and wire Vite/nav so the game boots an empty state.
EOF
)"
```

---

### Task 2: Atlas XML parser (TDD)

**Files:**

- Create: `examples/games/kenney-platformer/atlas.ts`
- Create: `tests/unit/kenney-atlas.test.ts`

**Interfaces:**

- Consumes: Kenney XML text strings
- Produces:

```ts
export interface AtlasFrame {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Parse Kenney TextureAtlas XML. Keys are SubTexture name attrs (incl. .png). */
export function parseKenneyAtlasXml(xmlText: string): Map<string, AtlasFrame>;
```

- [ ] **Step 1: Write failing tests**

`tests/unit/kenney-atlas.test.ts`:

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { parseKenneyAtlasXml } from '../../examples/games/kenney-platformer/atlas';

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<TextureAtlas imagePath="sheet.png">
  <SubTexture name="grassMid.png" x="0" y="128" width="128" height="128"/>
  <SubTexture name="alienBlue_stand.png" x="10" y="20" width="128" height="256"/>
</TextureAtlas>`;

describe('parseKenneyAtlasXml', () => {
  it('maps SubTexture names to frames', () => {
    const map = parseKenneyAtlasXml(FIXTURE);
    expect(map.get('grassMid.png')).toEqual({
      name: 'grassMid.png',
      x: 0,
      y: 128,
      width: 128,
      height: 128,
    });
    expect(map.get('alienBlue_stand.png')?.height).toBe(256);
  });

  it('throws on empty atlas', () => {
    expect(() =>
      parseKenneyAtlasXml(
        '<TextureAtlas imagePath="sheet.png"></TextureAtlas>',
      ),
    ).toThrow(/SubTexture/i);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run tests/unit/kenney-atlas.test.ts`  
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `atlas.ts`**

```ts
export interface AtlasFrame {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function parseKenneyAtlasXml(xmlText: string): Map<string, AtlasFrame> {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const nodes = doc.querySelectorAll('SubTexture');
  if (nodes.length === 0) {
    throw new Error('Kenney atlas XML contains no SubTexture entries.');
  }
  const map = new Map<string, AtlasFrame>();
  for (const node of nodes) {
    const name = node.getAttribute('name');
    if (!name) continue;
    const x = Number(node.getAttribute('x'));
    const y = Number(node.getAttribute('y'));
    const width = Number(node.getAttribute('width'));
    const height = Number(node.getAttribute('height'));
    map.set(name, { name, x, y, width, height });
  }
  if (map.size === 0) {
    throw new Error('Kenney atlas XML contains no SubTexture entries.');
  }
  return map;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run tests/unit/kenney-atlas.test.ts`

- [ ] **Step 5: Commit**

```bash
git add examples/games/kenney-platformer/atlas.ts tests/unit/kenney-atlas.test.ts
git commit -m "$(cat <<'EOF'
feat: parse Kenney TextureAtlas XML for platformer sample

Add a pure atlas parser with unit coverage so strip baking can resolve named frames.
EOF
)"
```

---

### Task 3: Bake horizontal strips

**Files:**

- Create: `examples/games/kenney-platformer/bake.ts`
- Create: `tests/unit/kenney-bake.test.ts` (canvas smoke)

**Interfaces:**

- Consumes: `AtlasFrame` from `atlas.ts`; drawable `HTMLImageElement` or `CanvasImageSource`
- Produces:

```ts
import type { Texture } from 'pixi.js';
import type { AtlasFrame } from './atlas';

/**
 * Draw frames left-to-right into an outW×outH cell strip.
 * Pass `null` in `frames` to leave a fully transparent cell (tile 0).
 */
export function bakeHorizontalStrip(
  source: CanvasImageSource,
  frames: ReadonlyArray<AtlasFrame | null>,
  outW: number,
  outH: number,
): Texture;

export function requireFrame(
  atlas: Map<string, AtlasFrame>,
  name: string,
): AtlasFrame;
```

- [ ] **Step 1: Write failing bake test**

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  bakeHorizontalStrip,
  requireFrame,
} from '../../examples/games/kenney-platformer/bake';
import { parseKenneyAtlasXml } from '../../examples/games/kenney-platformer/atlas';

describe('bakeHorizontalStrip', () => {
  it('creates a strip with N cells', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, 0, 128, 128);

    const frame = { name: 'a.png', x: 0, y: 0, width: 128, height: 128 };
    const tex = bakeHorizontalStrip(canvas, [null, frame], 64, 64);
    expect(tex.width).toBe(128); // 2 * 64
    expect(tex.height).toBe(64);
  });

  it('requireFrame throws on missing name', () => {
    const atlas = parseKenneyAtlasXml(
      `<TextureAtlas><SubTexture name="a.png" x="0" y="0" width="1" height="1"/></TextureAtlas>`,
    );
    expect(() => requireFrame(atlas, 'missing.png')).toThrow(/missing\.png/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run tests/unit/kenney-bake.test.ts`

- [ ] **Step 3: Implement `bake.ts`**

```ts
import { Texture } from 'pixi.js';

import type { AtlasFrame } from './atlas';

export function requireFrame(
  atlas: Map<string, AtlasFrame>,
  name: string,
): AtlasFrame {
  const frame = atlas.get(name);
  if (!frame) throw new Error(`Missing atlas frame "${name}".`);
  return frame;
}

export function bakeHorizontalStrip(
  source: CanvasImageSource,
  frames: ReadonlyArray<AtlasFrame | null>,
  outW: number,
  outH: number,
): Texture {
  if (frames.length === 0) throw new RangeError('frames must be non-empty');
  if (outW <= 0 || outH <= 0)
    throw new RangeError('out dimensions must be positive');

  const canvas = document.createElement('canvas');
  canvas.width = outW * frames.length;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    if (frame === null) continue;
    ctx.drawImage(
      source,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      i * outW,
      0,
      outW,
      outH,
    );
  }

  return Texture.from(canvas);
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run tests/unit/kenney-bake.test.ts`

- [ ] **Step 5: Commit**

```bash
git add examples/games/kenney-platformer/bake.ts tests/unit/kenney-bake.test.ts
git commit -m "$(cat <<'EOF'
feat: bake Kenney atlas regions into Flixel strip textures

Support transparent empty cells so tilemaps can keep air as index 0.
EOF
)"
```

---

### Task 4: Level data

**Files:**

- Create: `examples/games/kenney-platformer/level.ts`
- Create: `tests/unit/kenney-level.test.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks except constants used by game later
- Produces:

```ts
export const TILE = 64;
export const MAP_W = 100;
export const MAP_H = 16;
export const FLOOR = MAP_H - 2; // 14

export function makeMapData(): number[]; // length MAP_W * MAP_H, values 0..5

export const PLAYER_SPAWN: { readonly tx: number; readonly ty: number };
export const COIN_SPOTS: readonly (readonly [number, number])[]; // length 14
export const SLIME_SPOTS: readonly {
  readonly tx: number;
  readonly ty: number;
  readonly left: number; // world px min X for patrol
  readonly right: number; // world px max X for patrol
}[]; // length 4
export const FLY_SPOTS: readonly {
  readonly tx: number;
  readonly ty: number;
  readonly amp: number; // px
}[]; // length 3
export const FLAG_SPOT: { readonly tx: number; readonly ty: number };
```

- [ ] **Step 1: Write failing level tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  COIN_SPOTS,
  FLAG_SPOT,
  FLOOR,
  FLY_SPOTS,
  MAP_H,
  MAP_W,
  PLAYER_SPAWN,
  SLIME_SPOTS,
  TILE,
  makeMapData,
} from '../../examples/games/kenney-platformer/level';

describe('kenney level', () => {
  it('has expected dimensions and spawn counts', () => {
    expect(TILE).toBe(64);
    expect(MAP_W).toBe(100);
    expect(MAP_H).toBe(16);
    const data = makeMapData();
    expect(data).toHaveLength(MAP_W * MAP_H);
    expect(data.every((v) => Number.isInteger(v) && v >= 0 && v <= 5)).toBe(
      true,
    );
    expect(COIN_SPOTS).toHaveLength(14);
    expect(SLIME_SPOTS).toHaveLength(4);
    expect(FLY_SPOTS).toHaveLength(3);
    expect(PLAYER_SPAWN.tx).toBeGreaterThanOrEqual(1);
    expect(FLAG_SPOT.tx).toBeGreaterThan(PLAYER_SPAWN.tx);
  });

  it('has solid floor with at least one pit of air', () => {
    const data = makeMapData();
    const floorTiles = data.slice(FLOOR * MAP_W, FLOOR * MAP_W + MAP_W);
    expect(floorTiles.some((v) => v === 0)).toBe(true);
    expect(floorTiles.filter((v) => v > 0).length).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run tests/unit/kenney-level.test.ts`

- [ ] **Step 3: Implement `level.ts`**

Port structure from `examples/games/platformer/game.ts` `makeMapData` / `fillRow` / `COIN_SPOTS`, adapting to `MAP_W=100`, `MAP_H=16`, `TILE=64`:

- Fill `FLOOR` with `1` (`grassMid`), `FLOOR+1` with `4` (`grassCenter`).
- Cut three pits (clear both floor rows to `0`), e.g. columns `[18,22)`, `[44,49)`, `[72,78)`.
- Add ledges at `FLOOR-3` / `FLOOR-5` with spans reachable by jump (≤3 tiles vertical steps).
- End walls: columns `0` and `MAP_W-1` solid for all rows.
- `PLAYER_SPAWN = { tx: 3, ty: FLOOR - 1 }`.
- Place 14 coin tile spots above ground/ledges (not inside solids).
- 4 slime spots on solid floor segments with `left`/`right` in **world pixels** (`tx * TILE` bounds).
- 3 fly spots in air with `amp` around `40–70`.
- `FLAG_SPOT` on the rightmost goal ledge.

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run tests/unit/kenney-level.test.ts`

- [ ] **Step 5: Commit**

```bash
git add examples/games/kenney-platformer/level.ts tests/unit/kenney-level.test.ts
git commit -m "$(cat <<'EOF'
feat: author kenney-platformer tilemap and spawn tables

Define the Mode-lite course layout, pits, coins, enemies, and flag spots in code.
EOF
)"
```

---

### Task 5: Asset load helpers + tilemap + player (playable walk/jump)

**Files:**

- Create: `examples/games/kenney-platformer/audio.ts`
- Modify: `examples/games/kenney-platformer/game.ts` (full create/update for player+map)
- Modify: `examples/games/kenney-platformer/main.ts` (probe `playerY` / `onFloor`)

**Interfaces:**

- Consumes: `parseKenneyAtlasXml`, `bakeHorizontalStrip`, `requireFrame`, `level.ts` exports
- Produces: playable state with tilemap + Paragon jump; probe methods work

**Asset URL helper** (put at top of `game.ts` or tiny `assets.ts` — keep in `game.ts` if short):

```ts
function assetUrl(path: string): string {
  return new URL(`./assets/${path}`, import.meta.url).href;
}

async function loadImage(path: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = assetUrl(path);
  await img.decode();
  return img;
}

async function loadAtlas(xmlPath: string) {
  const text = await fetch(assetUrl(xmlPath)).then((r) => {
    if (!r.ok) throw new Error(`Failed to fetch ${xmlPath}`);
    return r.text();
  });
  return parseKenneyAtlasXml(text);
}
```

**Tile strip bake (exact names):**

```ts
const groundImg = await loadImage('spritesheet_ground.png');
const groundAtlas = await loadAtlas('spritesheet_ground.xml');
const tileFrames = [
  null,
  requireFrame(groundAtlas, 'grassMid.png'),
  requireFrame(groundAtlas, 'grassLeft.png'),
  requireFrame(groundAtlas, 'grassRight.png'),
  requireFrame(groundAtlas, 'grassCenter.png'),
  requireFrame(groundAtlas, 'grassHalf.png'),
];
const tilesTex = bakeHorizontalStrip(groundImg, tileFrames, TILE, TILE);
```

**Player strip:**

```ts
const playerImg = await loadImage('spritesheet_players.png');
const playerAtlas = await loadAtlas('spritesheet_players.xml');
const playerNames = [
  'alienBlue_stand.png',
  'alienBlue_walk1.png',
  'alienBlue_walk2.png',
  'alienBlue_jump.png',
  'alienBlue_hit.png',
] as const;
const playerTex = bakeHorizontalStrip(
  playerImg,
  playerNames.map((n) => requireFrame(playerAtlas, n)),
  64,
  128,
);
```

Because `create()` is sync in Flixel, **load assets before `bootGame`** in `main.ts` OR make `KenneyPlayState.create` kick off async and gate gameplay — **preferred pattern for this sample:**

1. In `main.ts`, before `bootGame`, call `await preloadKenneyAssets()` exported from `game.ts` that fills a module-level `KenneyAssets` object.
2. `KenneyPlayState.create` uses the preloaded textures synchronously.

```ts
// game.ts
export type KenneyAssets = {
  tiles: Texture;
  player: Texture;
  // later tasks fill: slime, fly, coin, flag, hearts, background
  background: HTMLImageElement | Texture;
};

let assets: KenneyAssets | null = null;

export async function preloadKenneyAssets(): Promise<KenneyAssets> {
  // load + bake all needed for Task 5; later tasks extend this function
  assets = { ... };
  return assets;
}

function requireAssets(): KenneyAssets {
  if (!assets) throw new Error('Call preloadKenneyAssets() before bootGame');
  return assets;
}
```

In `main.ts`: `await preloadKenneyAssets()` then `bootGame(...)`.

- [ ] **Step 1: Implement `audio.ts`**

Port `createSynthBlip` + a small `playSfx(kind)` helper from `examples/games/platformer/game.ts`. Support kinds: `'jump' | 'coin' | 'hurt' | 'respawn' | 'win'`. Export:

```ts
export type SfxKind = 'jump' | 'coin' | 'hurt' | 'respawn' | 'win';
export function playKenneySfx(kind: SfxKind): void;
```

Use a module-level `AudioContext` resumed on each play (same pattern as platformer).

- [ ] **Step 2: Implement preload + map + player + Paragon update**

In `KenneyPlayState.create`:

- `FlxG.worldBounds.make(0, 0, MAP_W * TILE, MAP_H * TILE)`
- Background sprite from `assets/backgrounds/blue_grass.png` (load in preload), `scrollFactor.x = 0.15`, add first
- `new FlxTilemap().loadMapData(makeMapData(), MAP_W, tilesTex, { tileWidth: TILE, tileHeight: TILE, collideIndex: 1 })`
- Player at `PLAYER_SPAWN.tx * TILE`, `PLAYER_SPAWN.ty * TILE - 48` (adjust so feet on floor)
- `loadGraphic(playerTex, true, true, 64, 128)`
- Hitbox: `width=28`, `height=48`, `offset.x=(64-28)/2`, `offset.y=128-48`
- Physics constants from spec §7
- `addAnimation('idle',[0], 1, true)`, `walk([1,2], 10, true)`, `jump([3])`, `hit([4])`
- Bind `FlxG.actions.bind('jump', 'SPACE', 'W', 'UP')`
- HUD text placeholder
- `FlxG.camera.setBounds(...); follow(player, FlxCamera.STYLE_PLATFORMER); map.follow(camera, 0, true)`

In `update`: port Paragon block from platformer, but jump buffer/release via `FlxG.actions` for jump (`justPressed`/`pressed`/`justReleased` — if actions lack `justReleased`, use `FlxG.keys.justReleased('SPACE')` plus check W/UP, or keep SPACE as primary for early-fall). Simplest: use `FlxG.keys` for LEFT/RIGHT/SPACE exactly like platformer for jump feel fidelity; still bind actions for jump as alternate — **locked:** mirror platformer keys for movement/jump (`LEFT`/`RIGHT`/`SPACE`) to avoid action-release gaps; optionally also accept W/UP via `FlxG.keys.pressed('W')` etc.

Pit respawn: update `#spawnX` on ground; if `player.y > camera.scroll.y + camera.height` → respawn (no life loss yet — Task 7 adds lives).

- [ ] **Step 3: Update `main.ts` probe**

`playerY` / `onFloor` read from `KenneyPlayState` like platformer.

- [ ] **Step 4: Manual verify**

`npm run dev:games` → walk, jump, land on ledges, fall in pit and respawn.

- [ ] **Step 5: Commit**

```bash
git add examples/games/kenney-platformer
git commit -m "$(cat <<'EOF'
feat: load Kenney tiles and playable blue alien platforming

Preload atlases, bake strips, and port Paragon jump feel onto the Kenney tilemap.
EOF
)"
```

---

### Task 6: Coins, flag, HUD text, win state

**Files:**

- Modify: `examples/games/kenney-platformer/game.ts` (`preloadKenneyAssets` + gameplay)
- Modify: `examples/games/kenney-platformer/audio.ts` if win/coin kinds missing

**Interfaces:**

- Consumes: `COIN_SPOTS`, `FLAG_SPOT`; items atlas `coinGold.png`, `flagGreen1.png`, `flagGreen2.png`
- Produces: coin collection; flag → `status='won'`; HUD shows counts; `R` restarts via `FlxG.switchState(new KenneyPlayState())`

- [ ] **Step 1: Extend preload**

Bake or single-frame textures:

```ts
// items sheet
coin: Texture; // 32×32 or 64×64 from coinGold.png
flagStrip: Texture; // bake flagGreen1, flagGreen2 at 64×64
```

Use `bakeHorizontalStrip` for flag (2 frames). For coin, bake a 1-frame strip or `Texture` from a small canvas draw of that region.

- [ ] **Step 2: Spawn coins + flag in create**

```ts
this.coins = new FlxGroup<FlxSprite>();
for (const [tx, ty] of COIN_SPOTS) {
  const c = new FlxSprite(tx * TILE + 16, ty * TILE + 16);
  c.loadGraphic(assets.coin);
  this.coins.add(c);
}
this.add(this.coins);

this.flag = new FlxSprite(FLAG_SPOT.tx * TILE, FLAG_SPOT.ty * TILE - 32);
this.flag.loadGraphic(assets.flagStrip, true, false, 64, 64);
this.flag.addAnimation('wave', [0, 1], 6, true);
this.flag.play('wave');
this.add(this.flag);
```

- [ ] **Step 3: Overlaps + win**

In update (only if `status === 'play'`):

- Coin overlap → `kill()`, `coinsCollected++`, `playKenneySfx('coin')`
- Flag overlap → `status = 'won'`; `playKenneySfx('win')`; show overlay text `YOU WIN — R to restart`

When `status !== 'play'`: skip input/physics mutations; on `FlxG.keys.justPressed('R')` → `FlxG.switchState(new KenneyPlayState())`.

HUD: `lives ${this.lives} · coins ${this.coinsCollected}/${COIN_SPOTS.length}` (+ win/lose line).

Credit line: small `FlxText` bottom or HTML note — at least set page footer in `index.html`: `<p class="credit">Art: Kenney.nl (CC0)</p>`.

- [ ] **Step 4: Manual verify** — collect coins, touch flag, R restarts.

- [ ] **Step 5: Commit**

```bash
git add examples/games/kenney-platformer
git commit -m "$(cat <<'EOF'
feat: add Kenney coins, goal flag, and win restart

Complete the collectible loop and Mode-lite win condition for the sample.
EOF
)"
```

---

### Task 7: Slimes, flies, lives, hurt, lose

**Files:**

- Modify: `examples/games/kenney-platformer/game.ts`

**Interfaces:**

- Consumes: `SLIME_SPOTS`, `FLY_SPOTS`; enemies atlas frames
- Produces: 4 slimes, 3 flies; enemy touch −1 life + invuln; 0 lives → `status='lost'`

**Enemy strips in preload:**

```ts
slimeStrip: // slimeGreen.png, slimeGreen_move.png → 64×64
flyStrip:   // fly.png, fly_move.png → 64×64
```

**Slime class** (in `game.ts`):

```ts
class Slime extends FlxSprite {
  leftBound = 0;
  rightBound = 0;
  spawn(x: number, y: number, left: number, right: number): void {
    this.reset(x, y);
    this.leftBound = left;
    this.rightBound = right;
    this.velocity.x = 60;
    this.play('move');
  }
}
```

- `loadGraphic(slimeStrip, true, true, 64, 64)`; hitbox ~40×32 bottom-aligned
- anim `move: [0,1]`
- each update: if `x < leftBound` → `velocity.x = 60`, facing RIGHT; if `x > rightBound` → reverse
- `FlxG.collide(this.slimes, this.map)`

**Fly class:**

```ts
class Fly extends FlxSprite {
  homeY = 0;
  amp = 40;
  t = 0;
  // update: t += elapsed; y = homeY + Math.sin(t * 2) * amp
}
```

**Lives / hurt:**

```ts
#invuln = 0;
// on enemy overlap while #invuln <= 0 && status==='play':
//   lives -= 1; playKenneySfx('hurt'); #invuln = 1.5;
//   player.play('hit'); small knockback
// if lives <= 0: status='lost'
// each frame: #invuln = max(0, #invuln - elapsed); blink alpha
```

**Pit:** falling below view → lose 1 life + respawn (if lives remain) else lose. Play `respawn` or `hurt` SFX.

Spawn all enemies in `create` from tables (no recycle required; fixed counts). Use `FlxGroup<Slime>` / `FlxGroup<Fly>`.

- [ ] **Step 1: Implement enemies + lives as above**

- [ ] **Step 2: Manual verify** — get hit, see lives drop, die, R restart; stomp not required.

- [ ] **Step 3: Commit**

```bash
git add examples/games/kenney-platformer/game.ts
git commit -m "$(cat <<'EOF'
feat: add Kenney enemies, lives, and lose state

Wire slime patrols, flying pests, invulnerability, and pit/life failure paths.
EOF
)"
```

---

### Task 8: README, making-games blurb, Playwright, verify

**Files:**

- Create: `examples/games/kenney-platformer/README.md`
- Create: `tests/browser/kenney-platformer.spec.ts`
- Modify: `docs/guides/making-games.md`
- Modify: `main.ts` / `game.ts` if probe fields incomplete

**Interfaces:**

- Consumes: `window.__FLIXEL_PIXI_KENNEY__` with `ready`, `lives`, `onFloor`, destroy path
- Produces: green e2e smoke; docs pointer

- [ ] **Step 1: Write `README.md`**

Include:

- How to run: `npm run dev:games` → open `/kenney-platformer/`
- Controls: `←→` move, `SPACE` jump, `R` restart after win/lose
- Art credit: Kenney Platformer Pack Remastered, CC0, https://kenney.nl
- Note: curated subset under `assets/`; full pack not in repo

- [ ] **Step 2: Docs blurb**

Append to `docs/guides/making-games.md`:

```md
## Atlases & tilemaps

For Kenney-style TextureAtlas XML → Flixel strips → `FlxTilemap`, see
`examples/games/kenney-platformer/` (`atlas.ts`, `bake.ts`, `level.ts`).
```

- [ ] **Step 3: Playwright spec**

```ts
import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Kenney Platformer sample', () => {
  test('boots, lands on floor, exposes lives, destroys cleanly', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/kenney-platformer/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 20_000 },
    );

    await page.waitForTimeout(1500);
    const grounded = await page.evaluate(
      () => window.__FLIXEL_PIXI_KENNEY__?.onFloor?.() ?? false,
    );
    expect(grounded).toBe(true);

    const lives = await page.evaluate(
      () => window.__FLIXEL_PIXI_KENNEY__?.lives?.() ?? 0,
    );
    expect(lives).toBe(3);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});
```

Add matching `Window` interface augmentation in `main.ts` (and a `*.d.ts` if other samples do — follow platformer’s `declare global` in `main.ts`).

- [ ] **Step 4: Run checks**

```bash
npm run check:games-imports
npm run typecheck
npx vitest run tests/unit/kenney-atlas.test.ts tests/unit/kenney-bake.test.ts tests/unit/kenney-level.test.ts
npx playwright test tests/browser/kenney-platformer.spec.ts
```

Fix failures before committing.

- [ ] **Step 5: Commit**

```bash
git add examples/games/kenney-platformer/README.md docs/guides/making-games.md tests/browser/kenney-platformer.spec.ts examples/games/kenney-platformer/main.ts
git commit -m "$(cat <<'EOF'
test: add Kenney platformer smoke and sample docs

Document the atlas/tilemap sample and guard boot/floor/lives with Playwright.
EOF
)"
```

---

## Spec coverage self-review

| Spec requirement                              | Task                                          |
| --------------------------------------------- | --------------------------------------------- |
| New sample, keep procedural platformer        | 1 (scaffold), never edits platformer gameplay |
| Curated assets in game folder                 | 1                                             |
| Ignore full pack                              | 1                                             |
| Atlas XML parse                               | 2                                             |
| Bake strips + empty tile 0                    | 3                                             |
| Map 100×16, TILE 64, spawns                   | 4                                             |
| Grass + blue alien + Paragon jump             | 5                                             |
| Coins, flag, win, R restart                   | 6                                             |
| Slime + fly, 3 lives, lose                    | 7                                             |
| Vite, index, README, making-games, Playwright | 1 + 8                                         |
| No new public package API                     | all helpers under sample                      |
| Acceptance criteria §16                       | Tasks 5–8 manual + e2e                        |

**Placeholder scan:** none intentional.  
**Type consistency:** `KenneyPlayState.status`, `preloadKenneyAssets`, `parseKenneyAtlasXml`, `bakeHorizontalStrip`, `TILE=64` used uniformly.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-07-kenney-platformer.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — run tasks in this session with executing-plans checkpoints

Which approach?
