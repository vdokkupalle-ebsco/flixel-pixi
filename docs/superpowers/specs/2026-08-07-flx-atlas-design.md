# FlxG.atlas + Unified Sprite Animation — Design

**Date:** 2026-08-07  
**Status:** Approved for planning  
**Index basis:** 0-based `framesByNumber` (confirmed)  
**Track:** Engine DX — atlas loading + animation API  
**Relation:** Promotes Kenney sample `atlas.ts` / `bake.ts` ideas into a public `FlxG.atlas` API; Kenney (and other) samples can migrate afterward.

---

## 1. Problem

Authors have three common atlas sources (TextureAtlas **XML**, TexturePacker/Pixi **JSON**, **fixed-size grids**) but flixel-pixi only eats **horizontal strips** via `loadGraphic` / `FlxTilemap`. The Kenney sample reinvented XML parse + strip bake locally.

Separately, proposing both `addAnimation` and `createAnimation` (plus loop/once play helpers) would split the animation API. We want **one** register path and **one** play path that work for strip indices and atlas frames.

## 2. Goals

1. **`FlxG.atlas`** — load/get atlases by key from XML, JSON, or fixed width/height.
2. **Frame pickers** on the atlas — prefix ranges (with padding), numeric index ranges/lists, single `getFrame`.
3. **Unified `FlxSprite.addAnimation` + `play`** — accept strip indices *or* atlas frames; play takes `{ loop, speed, force }` with sensible defaults.
4. Keep **GPU-cheap named frames** (texture views); bake a sprite-local strip only when needed for index-based `FlxAnim` playback.
5. **Back-compat** with existing `addAnimation(name, frames, frameRate, looped)` and `play(name, force: boolean)`.

## 3. Non-goals

- Runtime atlas **packing** (stitching arbitrary loose images into a new atlas). We only **load** existing atlases.
- Spine / skeletal animation.
- Removing `loadGraphic` strip workflow.
- Changing `FlxTilemap` in v1 beyond optional helper “bake selected frames to strip texture” if needed by samples later.
- Migrating every sample in the same PR (Kenney migration can follow).

## 4. Approaches considered

| Approach | Pros | Cons |
| --- | --- | --- |
| **1. `FlxG.atlas` + unified sprite anim (chosen)** | Clear ownership; Flixel DX; one play API | Touches `FlxAnim` / `play` slightly |
| 2. Pixi `Spritesheet` only | Less code | Poor Flixel fit |
| 3. Sample-only helpers | No API surface | Every game recopies |

## 5. Architecture

```
FlxG.atlas                          ← registry facade (like FlxG.actions)
  load(key, image, meta) → FlxAtlas
  get(key) → FlxAtlas
  has / remove / clear (remove/clear optional but recommended)

FlxAtlas
  frames: named map + ordered list
  getFrame(name)
  framesByPrefix(prefix, start, end, opts?)
  framesByNumber(start, end) | framesByNumber(indices[])
  source texture (shared)

FlxSprite
  addAnimation(name, number[] | FlxAtlasFrameList, …legacy)
  play(name, forceBoolean | PlayOptions)
```

Named atlas frames are **regions of one shared texture**. When `addAnimation` receives an atlas frame list, the sprite ensures a **compatible strip graphic** (bake those regions in order into a horizontal strip, cache by content key when practical) then stores `0..n-1` indices in `FlxAnim`.

---

## 6. `FlxG.atlas` API

```ts
/** Fixed-grid atlas descriptor. */
export interface FlxAtlasGridMeta {
  readonly frameWidth: number;
  readonly frameHeight: number;
}

/** Third argument to load: path to XML/JSON, or grid size. */
export type FlxAtlasMeta = string | FlxAtlasGridMeta;

export class FlxAtlasRegistry {
  /**
   * Load an atlas and store it under `key`.
   * - meta string ending in .xml / content-type XML → TextureAtlas SubTexture
   * - meta string ending in .json → TexturePacker/Pixi JSON hash or array
   * - meta object → uniform grid; frame names "0","1",… in row-major order
   */
  load(
    key: string,
    imageUrl: string,
    meta: FlxAtlasMeta,
  ): Promise<FlxAtlas>;

  /** Return a previously loaded atlas; throw if missing. */
  get(key: string): FlxAtlas;

  has(key: string): boolean;

  /** Drop one atlas from the registry (does not destroy in-flight sprites). */
  remove(key: string): void;

  /** Clear the registry. */
  clear(): void;
}
```

**Wiring:** `FlxG.atlas` getter resolves a context service (same pattern as `FlxG.actions`), or a process-wide singleton if assets are already global via Pixi `Assets`. Prefer attaching to the same lifetime as `FlxAssets` / game context so `destroy` can `clear()`.

**Example:**

```ts
await FlxG.atlas.load('player', './assets/spritesheet_players.png', './assets/spritesheet_players.xml');
await FlxG.atlas.load('tiles', './assets/tiles.png', { frameWidth: 64, frameHeight: 64 });

const playerAtlas = FlxG.atlas.get('player');
```

---

## 7. `FlxAtlas` frame model & pickers

```ts
export interface FlxAtlasFrame {
  readonly name: string;
  readonly texture: Texture; // view into shared sheet (Pixi frame/rect)
  readonly index: number;    // stable order index in this atlas
}

export type FlxAtlasFrameList = readonly FlxAtlasFrame[];

export interface FlxAtlasPrefixOptions {
  /** Digit width for the numeric suffix. Must be >= 1. Default 1. */
  readonly padding?: number;
}

export class FlxAtlas {
  readonly key: string;
  /** Shared base texture. */
  readonly texture: Texture;

  getFrame(name: string): FlxAtlasFrame;

  /**
   * Inclusive range: prefix + padded number.
   * padding 1 → walk_1; padding 2 → walk_01. padding < 1 throws.
   * If exact key missing, retry with `.png` suffix (Kenney).
   */
  framesByPrefix(
    prefix: string,
    start: number,
    end: number,
    options?: FlxAtlasPrefixOptions,
  ): FlxAtlasFrameList;

  /** Inclusive index range in atlas order (0-based or 1-based — see below). */
  framesByNumber(start: number, end: number): FlxAtlasFrameList;

  /** Explicit indices in atlas order. */
  framesByNumber(indices: readonly number[]): FlxAtlasFrameList;
}
```

### Index basis for `framesByNumber`

**Locked: 0-based indices** into atlas order (grid left-to-right, top-to-bottom; XML/JSON = insertion/document order).  
Document clearly. Call sites use `framesByNumber(0, 1)` or `framesByNumber([0, 1, 3])`.

> Note: Earlier conversation examples used `1, 2` colloquially; the engine API is **0-based** to match `addAnimation` strip indices and avoid off-by-one confusion with Flixel.

If product preference is 1-based inclusive for author DX, flip this before implementation — default in this spec is **0-based**.

### Prefix padding

```ts
function formatSuffix(n: number, padding: number): string {
  // padding >= 1
  return String(n).padStart(padding, '0');
}
// framesByPrefix('walk_', 1, 2, { padding: 2 }) → walk_01, walk_02
```

### JSON support (v1)

Support common TexturePacker/Pixi shapes:

- `{ frames: { [name]: { frame: {x,y,w,h} } } }` (hash)
- `{ frames: [ { filename, frame } ] }` (array)

Ignore rotation/trim in v1 unless cheap; if `rotated: true`, throw a clear unsupported error rather than silently wrong UVs.

---

## 8. Unified sprite animation API

### `addAnimation`

```ts
// Preferred (frames only)
addAnimation(name: string, frames: readonly number[] | FlxAtlasFrameList): void;

// Legacy Flixel-compatible
addAnimation(
  name: string,
  frames: readonly number[],
  frameRate?: number,
  looped?: boolean,
): void;
```

**Behavior:**

| `frames` type | Action |
| --- | --- |
| `number[]` | Validate against current graphic frame count; store indices |
| `FlxAtlasFrameList` | Bake ordered regions into a strip (or reuse cache), `loadGraphic` if needed, store `0..n-1` |

Legacy `frameRate` / `looped` become **defaults** for `play(name)` when no options object is passed:

- `defaultSpeed = frameRate > 0 ? frameRate / FlxG.updateFramerate : 1`
- `defaultLoop = looped ?? true` (preserve today’s default **looped = true** for legacy)

New two-arg `addAnimation` defaults: `defaultLoop = false`, `defaultSpeed = 1` (aligned with new `play` defaults).

### `play`

```ts
interface FlxAnimationPlayOptions {
  /** Default false for the options-object form. */
  loop?: boolean;
  /** Relative to update rate; 1 = one anim frame per update. Must be > 0. */
  speed?: number;
  /** Restart if already playing this anim. Default false. */
  force?: boolean;
}

play(name: string, force?: boolean): void;
play(name: string, options?: FlxAnimationPlayOptions): void;
```

**Dispatch:** if 2nd arg is `boolean` → legacy force flag, use animation defaults for loop/speed. If 2nd arg is object → apply options (loop default **false**, speed default **1**).

**Internal mapping:** `frameRate = FlxG.updateFramerate * speed`, then `delay = 1/frameRate`. Loop overrides `FlxAnim.looped` for this playback (implementation may store overrides on the sprite’s playback state rather than mutating the shared `FlxAnim` definition).

### Removed from design

- `createAnimation`
- `playAnimationLoop` / `playAnimationOnce`
- `toStrip` / `bakeSheet` as public names (baking stays **internal** to atlas→sprite wiring; optional later `atlas.bakeGraphic(frames, w, h)` only if tilemaps need it)

---

## 9. Kenney sample migration (follow-up)

After engine ships:

- Replace sample `atlas.ts` / `bake.ts` usage with `FlxG.atlas.load` / `get`.
- Player/enemy anims: `addAnimation('walk', atlas.framesByPrefix('alienBlue_walk', 1, 2))` + `play('walk', { loop: true })` (Kenney names often have no underscore before the digit — prefix is `alienBlue_walk`, numbers `1`,`2`).
- Keep level/gameplay code sample-local.

---

## 10. Testing

- Unit: XML parse, JSON hash/array, grid naming, prefix padding 1/2, reject padding 0, missing frame throws.
- Unit: `addAnimation` with `number[]` vs `FlxAtlasFrameList`; `play` options vs legacy boolean.
- Optional: Kenney sample still boots (Playwright) after migration.

## 11. Docs

- `docs/guides/making-games.md` — Atlases section points to `FlxG.atlas` + unified `play`.
- API extractor / public exports for `FlxAtlas`, registry, types.

## 12. Acceptance criteria

- [ ] `FlxG.atlas.load/get` works for XML, JSON, and `{ frameWidth, frameHeight }`.
- [ ] `framesByPrefix` respects `padding >= 1`; `framesByNumber` uses 0-based indices.
- [ ] `addAnimation` accepts strip indices or atlas frames; `play` accepts options (`loop` default false, `speed` default 1) and legacy boolean force.
- [ ] No public `createAnimation` / dual play helpers.
- [ ] Existing strip-based samples keep working via legacy overloads.
- [ ] Unit tests cover parsers + animation dispatch.

---

## Spec self-review

- Packing clarified as non-goal.
- `FlxG.atlas` only (not under `FlxG.assets`).
- Unified anim API; legacy overloads preserved.
- Matches chosen approach A (named frames + internal bake when needed).
- **0-based** `framesByNumber` confirmed.
