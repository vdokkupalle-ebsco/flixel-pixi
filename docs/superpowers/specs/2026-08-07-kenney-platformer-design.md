# Kenney Platformer Sample — Design

**Date:** 2026-08-07  
**Status:** Approved — implementation plan at `docs/superpowers/plans/2026-08-07-kenney-platformer.md`  
**Track:** Sample game — real Kenney-art platformer (Mode-lite scope)  
**Relation:** Parallel to Phase 13 / game-maker DX. Does **not** claim 1.0. Does **not** replace `examples/games/platformer/` (procedural jump-feel lab).

---

## 1. Problem

The repo has a polished **procedural** platformer and a Mode-lite shooter, but no sample that shows authors how to:

1. Load **Kenney TextureAtlas XML + PNG** sheets.
2. Bake named atlas regions into **Flixel strip graphics** (`FlxTilemap` / `FlxSprite.loadGraphic` frame grids).
3. Ship a **complete side-scroller** (pits, enemies, coins, lives, win/lose) using public boot + world sync.

Authors currently have Kenney’s pack only as an untracked dump at repo root (`platform-game-assets/`). That is not a runnable sample.

## 2. Goals

1. Ship `examples/games/kenney-platformer/` — playable Mode-lite platformer with Kenney art.
2. **Curated assets committed under the sample folder** (not the full pack; not served from repo-root `platform-game-assets/`).
3. Use existing public APIs: `bootGame` / `createBrowserGame`, `FlxTilemap`, `FlxSprite` animations, `FlxGroup.recycle`, `FlxG.actions`, camera follow, collide/overlap.
4. Demonstrate atlas → strip baking as sample-local helpers (no new public package API required).
5. Wire Vite games entry, games index link, Playwright smoke, short README with Kenney CC0 credit.

## 3. Non-goals

- Committing the full `platform-game-assets/` tree.
- Replacing or rewriting `examples/games/platformer/`.
- New npm package exports (`parseKenneyAtlas` etc.) — keep helpers **inside the sample**.
- Multi-level select, shooting, water, ladders, climbing animations.
- External audio packs; use simple synth blips like the procedural platformer.
- Hard FPS gates / Phase 13 C13 completion / npm publish.
- Perfect pixel-perfect hitboxes for every Kenney silhouette (tight boxes are enough).

## 4. Decisions (locked)

| Decision | Choice |
| --- | --- |
| Location | **New** sample: `examples/games/kenney-platformer/` |
| Scope | Full Mode-lite: long side-scroller, pits, slime + fly, coins, lives, flag goal, win/lose |
| Loading | Kenney XML+PNG atlases → bake strips → `FlxTilemap` / `loadGraphic` |
| Theme | Grass ground; **blue alien** player; **slimeGreen** + **fly** enemies; gold coins; green flag |
| Assets | **Copy curated files into the game folder** under `assets/` |
| Pack at root | Leave `platform-game-assets/` untracked; use only as copy source during implementation |
| Jump feel | Port Paragon helpers from `examples/games/platformer/game.ts` (coyote, buffer, early fall, apex gravity, sticky feet) |
| Boot | `bootGame` from `examples/games/_kit/boot-game.ts` (same as other samples) |
| Resolution | **640×480** (match other games samples) |

## 5. Approaches considered

| Approach | Pros | Cons |
| --- | --- | --- |
| **1. New sample beside procedural (chosen)** | Clear roles; no Phase 12 regressions | Two platformers to maintain |
| 2. Replace `platformer/` | One sample | Loses jump-feel lab + breaks Phase 12 tests |
| 3. Shared kit atlas helpers first | Reusable | Overbuilds API before the game is fun |

## 6. Architecture

```
examples/games/kenney-platformer/
  index.html                 # shell like platformer (status, canvas-host, destroy)
  main.ts                    # bootGame + window.__FLIXEL_PIXI_KENNEY__ probe
  game.ts                    # PlayState (+ optional Menu/Win/Lose states inline)
  level.ts                   # map CSV builder + spawn tables
  atlas.ts                   # parse Kenney XML → Map<name, {x,y,w,h}>
  bake.ts                    # canvas stitch named regions → Texture / FlxGraphic strip
  audio.ts                   # synth blips (jump, coin, hurt, win, respawn) — optional split
  README.md                  # controls + Kenney credit
  assets/                    # COMMITTED curated copies
    License.txt
    backgrounds/
      blue_grass.png
    spritesheet_ground.png
    spritesheet_ground.xml
    spritesheet_players.png
    spritesheet_players.xml
    spritesheet_enemies.png
    spritesheet_enemies.xml
    spritesheet_items.png
    spritesheet_items.xml
    spritesheet_hud.png
    spritesheet_hud.xml
```

**Do not** copy: `spritesheet_complete.*`, Vector/, full PNG/Players tree, unused themes (dirt/sand/snow/planet), unused enemy colors beyond green slime + fly.

### 6.1 Runtime flow

```
main.ts
  → bootGame({ host, initialState: KenneyPlayState, 640, 480, WebAudioBackend })
  → KenneyPlayState.create()
       1. loadAssets() via Pixi Assets / fetch + Texture.from
       2. parse XML atlases (atlas.ts)
       3. bake tile strip + player strip + enemy frames + coin/flag/hud textures (bake.ts)
       4. build map from level.ts → FlxTilemap.loadMapData(...)
       5. spawn player, coins, enemies, flag
       6. HUD (lives hearts + coin count text or hud sprites)
       7. camera bounds + follow STYLE_PLATFORMER; map.follow
  → update(): Paragon jump, collide map, overlaps, pit/lives, win on flag
```

### 6.2 Asset URL loading (Vite)

Vite games root is `examples/games`. Assets must be **referenced so production build includes them**.

**Required pattern** (do not rely on a loose `public/` folder alone):

```ts
function assetUrl(relativePath: string): string {
  return new URL(`./assets/${relativePath}`, import.meta.url).href;
}
```

Load examples:

- PNG: `await Assets.load(assetUrl('spritesheet_ground.png'))` or `Texture.from(assetUrl(...))`
- XML: `await fetch(assetUrl('spritesheet_ground.xml')).then((r) => r.text())`
- Background: same for `backgrounds/blue_grass.png`

Copy source during implementation:

```bash
SRC=platform-game-assets
DST=examples/games/kenney-platformer/assets
mkdir -p "$DST/backgrounds"
cp "$SRC/License.txt" "$DST/"
cp "$SRC/Spritesheets/spritesheet_"{ground,players,enemies,items,hud}.{png,xml} "$DST/"
cp "$SRC/PNG/Backgrounds/blue_grass.png" "$DST/backgrounds/"
```

Approximate size of curated set: **~700KB** of sheets + one background (skip `spritesheet_complete` ~1MB).

---

## 7. Coordinate & scale system

Kenney ground tiles are **128×128**. Players are **128×256**. At 640×480, raw 128 tiles show only ~5 tiles across — too chunky.

**Locked scale:** bake everything at **50%**.

| Concept | Value |
| --- | --- |
| Art source tile | 128×128 |
| **World `TILE`** | **64** |
| Player source frame | 128×256 |
| Player strip frame | **64×128** |
| Enemy/item source | 128×128 |
| Enemy/item baked | **64×64** (or keep 128 and set `scale` — prefer bake to 64 for consistent collision) |
| Map size | **MAP_W = 100**, **MAP_H = 16** |
| Floor row | `FLOOR = MAP_H - 2` (= 14) |
| World pixel size | `100 * 64` × `16 * 64` = **6400 × 1024** |

Jump/move constants: **start from procedural platformer**, then tune once art hitboxes are known. Initial port (world units ≈ pixels):

| Constant | Initial value | Notes |
| --- | --- | --- |
| `JUMP_VELOCITY` | `-460` | from platformer |
| `GRAVITY` | `1300` | |
| `APEX_GRAVITY` | `650` | |
| `APEX_SPEED` | `90` | |
| `MAX_FALL` | `520` | |
| `MOVE_ACCEL` | `900` | |
| `AIR_ACCEL` | `700` | |
| `APEX_TURN_ACCEL` | `1600` | |
| `MAX_RUN` | `190` | |
| `GROUND_DRAG` | `1200` | |
| `COYOTE_TIME` | `8/60` | |
| `JUMP_BUFFER` | `7/60` | |

If the taller player sprite feels floaty/heavy after hitbox shrink, adjust jump/gravity in a single pass — do not invent a second feel system.

**Player hitbox** (after `loadGraphic` with 64×128 frames):

```ts
player.width = 28;
player.height = 48;
player.offset.x = (64 - 28) / 2;   // ~18
player.offset.y = 128 - 48;        // feet at bottom of frame (~80)
```

Tune if feet clip into tiles; collision must feel fair.

**Enemy hitboxes:**

- Slime: `width=40`, `height=32`, offset centered on 64×64 frame, bottom-aligned.
- Fly: `width=40`, `height=28`, centered.

---

## 8. Atlas parsing (`atlas.ts`)

Kenney XML shape:

```xml
<TextureAtlas imagePath="sheet.png">
  <SubTexture name="grassMid.png" x="0" y="128" width="128" height="128"/>
  ...
</TextureAtlas>
```

**API to implement:**

```ts
export interface AtlasFrame {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function parseKenneyAtlasXml(xmlText: string): Map<string, AtlasFrame>;
```

Rules:

- Use `DOMParser` in the browser (`new DOMParser().parseFromString(xmlText, 'application/xml')`).
- Read every `SubTexture`; keys are the `name` attribute **exactly** (including `.png` suffix).
- Throw a clear `Error` if XML is empty or has zero SubTextures.
- Unit-testable: pure function; optional small vitest with a fixture string in `tests/unit/` **or** keep untested if sample-only — prefer a tiny unit test for the parser (robust, ~20 lines).

---

## 9. Baking strips (`bake.ts`)

Flixel expects:

- **Tilemaps:** one texture, frames laid out in a grid of `tileWidth × tileHeight` (this sample: **horizontal strip**).
- **Sprites:** `loadGraphic(tex, animated=true, reverse=true|false, frameWidth, frameHeight)` then `addAnimation` with frame indices.

**API to implement:**

```ts
import type { Texture } from 'pixi.js';
import type { AtlasFrame } from './atlas';

/** Draw atlas regions into a horizontal strip; each cell is outW×outH. */
export function bakeHorizontalStrip(
  source: Texture,
  frames: readonly AtlasFrame[],
  outW: number,
  outH: number,
): Texture;

/** Convenience: resolve names from atlas map, throw if missing. */
export function bakeNamedStrip(
  source: Texture,
  atlas: Map<string, AtlasFrame>,
  names: readonly string[],
  outW: number,
  outH: number,
): Texture;
```

**Implementation notes (Pixi v8):**

1. Create an offscreen `HTMLCanvasElement` sized `outW * names.length` × `outH`.
2. `const ctx = canvas.getContext('2d')!`.
3. Obtain an `HTMLImageElement` / `ImageBitmap` / drawable from `source.source` (Pixi `Texture.source.resource`). If resource is not immediately drawable, load the PNG via `Image` + `assetUrl` for baking instead of going through Texture first — **simplest path:** bake from loaded `HTMLImageElement`:

```ts
async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return img;
}
```

4. For each frame index `i`, `ctx.drawImage(img, frame.x, frame.y, frame.width, frame.height, i * outW, 0, outW, outH)`.
5. `return Texture.from(canvas)` (or `FlxGraphic` via pixels if preferred — Texture is fine; pass to `loadMapData` / `loadGraphic`).

**Empty tile frame 0:** first cell must be fully transparent (clear canvas; do not draw). Map air = `0`.

---

## 10. Tile ID legend & tileset bake order

`autoTile = FlxTilemap.OFF`. `collideIndex = 1`, `drawIndex = 1`, `startingIndex = 0`.

| Map ID | Strip frame | Kenney name | Collides? | Use |
| --- | --- | --- | --- | --- |
| 0 | 0 | _(empty)_ | no | air / pits |
| 1 | 1 | `grassMid.png` | yes | default solid / ledges |
| 2 | 2 | `grassLeft.png` | yes | optional visual left cap |
| 3 | 3 | `grassRight.png` | yes | optional visual right cap |
| 4 | 4 | `grassCenter.png` | yes | filler under mid if double-thick ground |
| 5 | 5 | `grassHalf.png` | yes | thin floating platforms |

Bake order array (exact):

```ts
const TILE_NAMES = [
  null, // frame 0 — skip draw
  'grassMid.png',
  'grassLeft.png',
  'grassRight.png',
  'grassCenter.png',
  'grassHalf.png',
] as const;
```

Implement empty frame by inserting a blank cell or baking with a sentinel. **Simplest:** bake names for frames 1–5 only into a strip that still starts with an empty cell of width TILE (clear first rect).

Minimum viable map art: **only use tile ID `1` (grassMid) + `0`** for the whole CSV; left/right/center/half are optional polish. Implement all six frames in the strip anyway so the level can use them later without rebaking.

---

## 11. Level layout (`level.ts`)

### 11.1 Map generation (code-built CSV / number[], not an external editor file)

Mirror the procedural platformer’s structure, scaled to `MAP_W=100`, `MAP_H=16`, `TILE=64`:

1. Fill floor row `FLOOR` and `FLOOR+1` with solid tiles (`1` / `4`).
2. Cut **3 pits** (clear floor tiles to `0`), widths ~3–5 tiles, spaced along the run.
3. Add floating ledges (rows `FLOOR-3` … `FLOOR-6`) with spans reachable by the jump arc (ledges step ≤3 tiles vertically — same rule as procedural sample).
4. Solid end walls on columns `0` and `MAP_W-1`.
5. Goal ledge near the right end.

Export:

```ts
export const TILE = 64;
export const MAP_W = 100;
export const MAP_H = 16;
export const FLOOR = MAP_H - 2;

export function makeMapData(): number[]; // length MAP_W * MAP_H

export const PLAYER_SPAWN: { tx: number; ty: number }; // e.g. { tx: 3, ty: FLOOR - 1 }

export const COIN_SPOTS: readonly [number, number][]; // tile coords, ~12–16 coins
export const SLIME_SPOTS: readonly { tx: number; ty: number; left: number; right: number }[];
export const FLY_SPOTS: readonly { tx: number; ty: number; amp: number }[];
export const FLAG_SPOT: { tx: number; ty: number };
```

**Spawn counts (locked targets):**

- Coins: **14**
- Slimes: **4** (patrol between `left`/`right` tile X bounds)
- Flies: **3** (vertical bob with `amp` in pixels)
- Flag: **1** at far right on goal ledge

### 11.2 Background

- Add a `FlxSprite(0,0)` with `blue_grass.png` (scaled to cover 640×480 or tiled).
- `scrollFactor.x = 0.15`, `scrollFactor.y = 0` (parallax lite).
- Or set `FlxG.camera.bgColor` to a grass-sky hex and still draw the PNG stretched behind the map — prefer PNG for “real assets” demo.
- Background must be added **before** the tilemap in the state so it draws under world objects.

---

## 12. Entities & gameplay

### 12.1 Input

```ts
FlxG.actions.bind('jump', 'SPACE', 'W', 'UP');
// Movement: keep LEFT/RIGHT via FlxG.keys.pressed (match platformer) OR bind moveLeft/moveRight — either OK; prefer keys for move + actions for jump to match platformer feel docs.
```

HUD hint text: `←→ move · SPACE jump`.

### 12.2 Player

- Class can be inline in `game.ts` or `Player extends FlxSprite`.
- Strip names (exact):

```ts
const PLAYER_FRAMES = [
  'alienBlue_stand.png', // 0
  'alienBlue_walk1.png', // 1
  'alienBlue_walk2.png', // 2
  'alienBlue_jump.png',  // 3
  'alienBlue_hit.png',   // 4
] as const;
```

- `loadGraphic(strip, true, true, 64, 128)` — **`reverse=true`** so `facing` flips walk.
- Animations:
  - `idle`: `[0]`, low rate
  - `walk`: `[1, 2]`, ~8–10 fps, looped
  - `jump`: `[3]`
  - `hit`: `[4]`
- Facing: when moving left set `facing = FlxObject.LEFT`, right → `RIGHT`.
- Animation select each frame: grounded + |vx|>30 → walk; grounded → idle; air → jump; during hurt flash → hit.

### 12.3 Slime

- Frames: `slimeGreen.png`, `slimeGreen_move.png` (optional `slimeGreen_hit.png` on death).
- Patrol: `velocity.x = ±60`; reverse at `left`/`right` world bounds **or** on wall collide with map.
- `FlxG.collide(slime, map)` each update.
- On player overlap (and player not invulnerable): hurt player (see lives).

### 12.4 Fly

- Frames: `fly.png`, `fly_move.png`.
- Motion: hold spawn X; `y = homeY + Math.sin(time * speed) * amp`.
- No map collide required.
- Same hurt-on-overlap as slime.

### 12.5 Coins

- Texture: `coinGold.png` baked/scaled to 32×32 or 64×64.
- On overlap: `kill()`, `coinsCollected++`, play coin SFX.
- Prefer `FlxGroup` of sprites created in `create()` (exists true); no need to recycle.

### 12.6 Flag (goal)

- Frames: `flagGreen1.png`, `flagGreen2.png` — animate 2-frame wave.
- On player overlap: enter **Win** state (or set `phase = 'won'`, freeze player, show overlay text + “R to restart”).

### 12.7 Lives, hurt, pits

| Rule | Behavior |
| --- | --- |
| Start lives | **3** |
| Enemy touch | −1 life; 1.5s invulnerability (blink `alpha` 0.4/1); knockback optional small −vx |
| Lives hit 0 | **Lose** overlay; freeze; R restart |
| Fall below camera bottom / world | −1 life, respawn at last grounded X (like platformer `#spawnX`) **or** at `PLAYER_SPAWN` if you want simpler — **prefer last grounded X** |
| Restart | `FlxG.switchState(new KenneyPlayState())` or reset fields — switchState is cleaner |

Expose on probe: `lives()`, `coins()`, `won()`, `lost()`.

### 12.8 HUD

Minimum viable (acceptable):

- `FlxText` top-left: `lives N · coins K/14` with `scrollFactor` 0,0.

Polished (preferred if time):

- Three `hudHeart_full` / `hudHeart_empty` sprites (scaled ~0.35) + `hudCoin` + `FlxText` count.
- All HUD nodes `scrollFactor = 0`.

Footer credit (small `FlxText` or HTML under canvas): `Art: Kenney.nl (CC0)`.

### 12.9 Audio

Copy the procedural platformer’s local `AudioContext` + synth pattern (`#playSfx`). Kinds: `jump`, `coin`, `hurt`, `respawn`, `win`. Do not depend on game `WebAudioBackend` buffers for these one-shots (same race lesson as platformer).

### 12.10 Win / lose presentation

Keep in one state with a `status: 'play' | 'won' | 'lost'` field:

- On won/lost: stop player input; show centered `FlxText`; press `R` → new `KenneyPlayState`.
- Optional: `FlxButton` Restart — not required.

---

## 13. `KenneyPlayState` update order (exact)

Each `update()`:

1. If `status !== 'play'`: handle R restart; `super.update()`; return.
2. Invuln timer countdown; blink alpha.
3. Paragon jump/move block (port from platformer; jump via `FlxG.actions.justPressed('jump')` / `justReleased` / pressed — map buffer to jump action).
4. `super.update()`.
5. `FlxG.collide(player, map)`.
6. `FlxG.collide(slimes, map)` (group collide).
7. Update slime patrol reverse; update fly bob (`elapsed` accumulate).
8. Coin overlaps → collect.
9. If not invuln: enemy overlaps → hurt.
10. Flag overlap → win.
11. Pit check → hurt+respawn or lose.
12. Update animations + HUD text/hearts.
13. Camera already following — no manual scroll.

**Important:** `createBrowserGame` / `bootGame` already runs world sync; do **not** manually call renderer sync. Dynamic `add` is fine.

---

## 14. Wiring & repo integration

### 14.1 `vite.games.config.ts`

Add rollup input:

```ts
'kenney-platformer': resolve(
  import.meta.dirname,
  'examples/games/kenney-platformer/index.html',
),
```

### 14.2 `examples/games/index.html`

Add nav button link to `./kenney-platformer/`.

### 14.3 `main.ts` probe

```ts
window.__FLIXEL_PIXI_KENNEY__ = {
  destroyed: false,
  ready: false,
  // after boot:
  lives: () => number,
  coins: () => number,
  status: () => 'play' | 'won' | 'lost',
  playerY: () => number,
  onFloor: () => boolean,
};
```

Mirror platformer’s destroy button + status `data-state` (`loading` | `ready` | `destroyed` | `error`).

### 14.4 Playwright

Add `tests/browser/kenney-platformer.spec.ts` (or a describe block in a new phase file):

1. `goto /kenney-platformer/`
2. Wait `data-state=ready` (timeout ≥15s — asset decode)
3. Assert `onFloor()` true after ~1.2s settle
4. Assert `lives() === 3`
5. Click destroy → `destroyed`

No need to automate full win path in v1.

### 14.5 Docs

- Sample `README.md`: controls, how to run (`npm run dev:games` → open `/kenney-platformer/`), Kenney CC0 + link `www.kenney.nl`, note assets are a curated subset of Platformer Pack Remastered.
- One paragraph in `docs/guides/making-games.md` under a “Atlases & tilemaps” heading pointing at this sample.
- Do **not** add long PORTING_PLAN phase unless already editing it for another reason — optional one-line mention.

### 14.6 Import guard

`npm run check:games-imports` must pass — import game code from `../../../src` (or package name if samples use that); kit only from `../_kit/`. No deep relative imports into `src/internal`.

### 14.7 `.gitignore`

Ensure `platform-game-assets/` remains ignored if it was intentionally untracked. **Do not** gitignore `examples/games/kenney-platformer/assets/`.

---

## 15. File-by-file implementation checklist

Use this order when executing:

1. **Copy assets** into `examples/games/kenney-platformer/assets/` (commands in §6.2).
2. **Scaffold** `index.html`, `main.ts` stub, empty `KenneyPlayState` that boots and sets ready.
3. **`atlas.ts` + `bake.ts`** (+ optional unit test for XML parse).
4. **`level.ts`** map + spawn tables.
5. **`game.ts`** load → bake → tilemap → player → camera (walk/jump on grass, no enemies yet).
6. Coins + HUD + SFX.
7. Slimes + flies + lives/hurt/invuln.
8. Flag + win/lose + R restart.
9. Vite entry + index link + Playwright + README + making-games blurb.
10. Manual playtest: clear pits, reach flag, die to slime, fall in pit, destroy button.
11. `npm run check:games-imports`, `npm run typecheck`, targeted e2e.

---

## 16. Acceptance criteria

- [ ] Sample runs via `npm run dev:games` at `/kenney-platformer/`.
- [ ] Grass tilemap visible; blue alien walks/jumps with Paragon feel.
- [ ] ≥3 pits require jumps; camera follows; world wider than one screen.
- [ ] Coins collectible; lives start at 3; slime + fly deal damage.
- [ ] Flag triggers win; 0 lives triggers lose; R restarts.
- [ ] Curated assets live under sample `assets/` and are committed; full pack not committed.
- [ ] Kenney credited in README (and on-screen or page footer).
- [ ] Playwright smoke green; `check:games-imports` green.
- [ ] Existing `platformer/` sample untouched in behavior.

## 17. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Hitbox / foot clipping | Explicit width/height/offset; tune after first visual boot |
| Bake fails (Texture resource not drawable) | Bake from `HTMLImageElement.decode()` path |
| Vite build omits assets | Always use `new URL(..., import.meta.url)` |
| XML name typos | Centralize name constants; throw if atlas missing key |
| Jump feel wrong at TILE=64 | Single constant tweak pass; keep Paragon structure |
| Large PNGs slow CI e2e | 15s ready timeout; curated sheets only |

## 18. Out-of-scope follow-ups (explicitly deferred)

- Promoting `atlas.ts` / `bake.ts` into `src/` public API.
- Tiled/JSON map editor pipeline.
- More Kenney themes (sand, snow) as level skins.
- Stomp-to-kill enemies.
- Checkpoint flags mid-level.

---

## 19. Spec self-review

- No TBDs left for v1 decisions (scale, map size, enemy set, asset paths).
- No contradiction with “assets in game folder” vs root pack (root = copy source only).
- Scope matches Mode-lite; non-goals list keeps YAGNI.
- Lower-model executable: file tree, APIs, tile legend, update order, checklist, acceptance.
