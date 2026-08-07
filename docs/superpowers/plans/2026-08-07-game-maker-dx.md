# Game-maker DX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make writing flixel-pixi games less footgunny: reliable mid-state render registration, a public browser boot helper, typed pooling recipe (Mode Lite), and thin action-mapped keyboard input.

**Architecture:** Keep Flixel objects simulation-only. Own world↔renderer sync in the browser boot path via **incremental diff** against `FlxCameraRenderer` entries. Promote `examples/games/_kit/boot-game` to a public `createBrowserGame`. Add small typed pool helpers and `FlxActions` over existing `Keyboard`.

**Tech Stack:** TypeScript, PixiJS v8 (peer), existing `FlxGame` / `FlxCameraRenderer` / `FlxGroup`, Vitest, Playwright, Vite games samples.

## Global Constraints

- Public games/samples import only package public exports (or `examples/games/_kit` during migration); `npm run check:games-imports` must pass for `examples/games/**`.
- Do **not** make `FlxSprite` extend Pixi display objects (ADR 0001).
- Prefer incremental `renderer.add` / `renderer.remove` over per-frame `clearObjects()` thrash.
- Action layer must not break existing `FlxG.keys` / replay key names.
- Out of scope: gamepad, C13 soft FPS gates, npm 1.0 publish.
- Spec: `docs/superpowers/specs/2026-08-07-game-maker-dx-design.md`.

---

## File map

| Path                                                         | Responsibility                                        |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `src/rendering/flx-world-sync.ts`                            | Diff state renderables ↔ renderer entries; add/remove |
| `src/browser/create-browser-game.ts`                         | Public Pixi+FlxGame+sync+destroy boot                 |
| `src/index.ts` (or `src/browser.ts` + export map)            | Export boot + world sync                              |
| `src/input/flx-actions.ts`                                   | Named action → key bindings                           |
| `src/core/flx-g.ts` / audio-style service wiring             | Expose `FlxG.actions`                                 |
| `src/core/flx-typed-group.ts` (or helpers in `flx-group.ts`) | Typed recycle helper if needed                        |
| `examples/games/_kit/boot-game.ts`                           | Re-export public boot or thin wrapper                 |
| `examples/games/external/game.ts`                            | Enemy pool via recycle                                |
| `docs/guides/lifecycle.md`, `making-games.md`                | Author docs                                           |
| `tests/unit/flx-world-sync.test.ts`                          | Diff sync contracts                                   |
| `tests/unit/flx-actions.test.ts`                             | Action bindings                                       |
| `tests/browser/phase12.spec.ts`                              | External enemies still register                       |

---

### Task 1: World sync (incremental renderer diff)

**Files:**

- Create: `src/rendering/flx-world-sync.ts`
- Create: `tests/unit/flx-world-sync.test.ts`
- Modify: `src/index.ts` (export)
- Modify: `examples/games/_kit/boot-game.ts` (use world sync instead of count-only full clear)

**Interfaces:**

- Consumes: `FlxGame`, `FlxState`/`FlxGroup` tree, `FlxCameraRenderer.add/remove`, `FlxSprite` | `FlxTilemap` | `FlxEmitter`
- Produces:

```ts
/** Collect displayables under a Flixel basic (state/group tree). */
export function collectRenderables(
  root: FlxBasic,
  out: Array<FlxSprite | FlxTilemap | FlxEmitter>,
): void;

/**
 * Synchronize renderer entries with the active state's renderables.
 * Adds missing objects; removes entries for objects no longer in the tree
 * (or destroyed). Does not clear+rebuild all handles.
 */
export function syncWorldToRenderer(
  game: FlxGame,
  renderer: FlxCameraRenderer,
): void;
```

- [ ] **Step 1: Write failing unit tests**

`tests/unit/flx-world-sync.test.ts` (use headless/minimal doubles if Pixi is heavy — follow existing camera renderer test patterns in `tests/unit/`):

```ts
import { describe, expect, it } from 'vitest';
// Wire FlxGame + FlxCameraRenderer the same way other rendering unit tests do.
// If full Pixi Application is required, use the project's established test harness.

describe('syncWorldToRenderer', () => {
  it('registers a sprite added to the state after the first sync', () => {
    // boot game+renderer, sync once with empty/play state
    // state.add(new FlxSprite(...).makeGraphic(8, 8))
    // syncWorldToRenderer(game, renderer)
    // expect(renderer.registeredObjectCount).toBeGreaterThan(before)
  });

  it('does not duplicate handles when syncing twice unchanged', () => {
    // sync twice; count stable; add() idempotent
  });

  it('removes handles when a sprite is removed from the state', () => {
    // add, sync, state.remove(sprite), sync, expect count decreased
  });
});
```

Implement the real assertions against the repo’s existing Pixi/test helpers (search `FlxCameraRenderer` in `tests/unit`).

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run tests/unit/flx-world-sync.test.ts`  
Expected: FAIL (module missing or sync not incremental).

- [ ] **Step 3: Implement `flx-world-sync.ts`**

```ts
import type { FlxBasic } from '../core/flx-basic';
import { FlxGroup } from '../core/flx-group';
import type { FlxGame } from '../core/flx-game';
import { FlxEmitter } from '../objects/flx-emitter';
import { FlxSprite } from '../objects/flx-sprite';
import { FlxTilemap } from '../tilemap/flx-tilemap';
import type { FlxCameraRenderer } from './flx-camera-renderer';

export type FlxRenderable = FlxSprite | FlxTilemap | FlxEmitter;

export function collectRenderables(
  root: FlxBasic,
  out: FlxRenderable[],
): void {
  if (root instanceof FlxTilemap || root instanceof FlxEmitter) {
    out.push(root);
    return;
  }
  if (root instanceof FlxSprite) {
    out.push(root);
  }
  if (root instanceof FlxGroup) {
    for (const member of root.members) {
      if (member !== null) collectRenderables(member, out);
    }
  }
}

export function syncWorldToRenderer(
  game: FlxGame,
  renderer: FlxCameraRenderer,
): void {
  const state = game.state;
  const desired: FlxRenderable[] = [];
  if (state !== null) collectRenderables(state, desired);

  const desiredSet = new Set(desired);
  // Remove stale (iterate a copy of current registrations — expose iterator
  // or track via registeredObjectCount + known list). Prefer adding a
  // package-internal or public way to list registered objects if missing:
  // e.g. renderer.forEachObject(cb) OR keep a WeakMap side table in sync module.
  // Minimal approach: renderer.clearObjects is FORBIDDEN here; use remove().

  // If FlxCameraRenderer has no iterator yet, add:
  //   get registeredObjects(): readonly FlxRenderable[]
  // or forEachRegistered(cb).

  for (const object of /* current entries */) {
    if (!desiredSet.has(object) || object.destroy /* destroyed flag if public */) {
      renderer.remove(object, true);
    }
  }
  for (const object of desired) {
    renderer.add(object);
  }
}
```

If `FlxCameraRenderer` cannot list entries, **first** add a read-only accessor (e.g. `registeredObjects(): readonly …`) in the same task — keep it small and tested.

- [ ] **Step 4: Point kit `boot-game` at `syncWorldToRenderer`**

Replace count-based `clearObjects` full rebuild with:

```ts
app.ticker.add(() => {
  if (!FlxG.paused) game.advance(app.ticker.deltaMS / 1000);
  syncWorldToRenderer(game, renderer);
  renderer.render();
});
```

Call once after initial `game.step`. Keep `syncRenderer()` as an explicit `syncWorldToRenderer` for tests.

- [ ] **Step 5: Run unit + external Playwright**

```bash
npx vitest run tests/unit/flx-world-sync.test.ts
npx playwright test tests/browser/phase12.spec.ts -g External --project=chromium
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/rendering/flx-world-sync.ts src/rendering/flx-camera-renderer.ts src/index.ts examples/games/_kit/boot-game.ts tests/unit/flx-world-sync.test.ts
git commit -m "$(cat <<'EOF'
feat: incremental world-to-renderer sync for dynamic sprites

Register and unregister displayables by diffing the active state so
mid-state add/remove no longer depends on manual syncRenderer calls.
EOF
)"
```

---

### Task 2: Public `createBrowserGame` boot API

**Files:**

- Create: `src/browser/create-browser-game.ts`
- Modify: `package.json` `exports` if using subpath; else export from `src/index.ts`
- Modify: `examples/games/_kit/boot-game.ts` → re-export / thin adapter
- Modify: `examples/games/hello/main.ts` (and optionally platformer/action/external) to import public boot
- Modify: `docs/guides/lifecycle.md`
- Test: Playwright hello or existing games still boot

**Interfaces:**

```ts
export interface CreateBrowserGameOptions {
  host: HTMLElement;
  initialState: FlxStateConstructor;
  width?: number; // default 640
  height?: number; // default 480
  title?: string;
  showPreloader?: boolean;
  backgroundColor?: number;
  audioBackend?: FlxAudioBackend;
  zoom?: number;
}

export interface BrowserGameApplication {
  readonly game: FlxGame;
  readonly renderer: FlxCameraRenderer;
  readonly app: Application;
  syncRenderer(): void;
  destroy(): void;
}

export function createBrowserGame(
  options: CreateBrowserGameOptions,
): Promise<BrowserGameApplication>;
```

- [ ] **Step 1: Move kit implementation into `src/browser/create-browser-game.ts`**

Use `syncWorldToRenderer` from Task 1. Keep Pixi `Application` import inside this module so tree-shaking/docs can call out “browser entry uses Pixi”.

- [ ] **Step 2: Export from package**

`src/index.ts`:

```ts
export {
  createBrowserGame,
  type CreateBrowserGameOptions,
  type BrowserGameApplication,
} from './browser/create-browser-game';
export {
  collectRenderables,
  syncWorldToRenderer,
  type FlxRenderable,
} from './rendering/flx-world-sync';
```

If api-extractor / peer dependency rules complain about Pixi at root, switch to export map:

```json
"./browser": {
  "types": "./dist/browser/create-browser-game.d.ts",
  "import": "./dist/browser/create-browser-game.js"
}
```

and document `import { createBrowserGame } from 'flixel-pixi/browser'`. Prefer root export first; fall back to subpath only if `api:check` fails.

- [ ] **Step 3: Make `_kit/boot-game.ts` a re-export**

```ts
export {
  createBrowserGame as bootGame,
  type BrowserGameApplication as GameApplication,
  type CreateBrowserGameOptions as BootGameOptions,
  syncWorldToRenderer as syncStateToRenderer,
} from '../../../src';
```

Preserve old names so samples keep compiling during migration.

- [ ] **Step 4: Update lifecycle guide**

Replace “use the Phase 12 sample kit” as primary with `createBrowserGame` / package import; mention kit re-export for in-repo samples.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
npm run check:games-imports
npx playwright test tests/browser/phase12.spec.ts --project=chromium
```

Expected: PASS (or update api report via `npm run api:update` after review if exports changed intentionally).

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: add public createBrowserGame browser boot helper

Promote the sample kit boot path into the package so games get Pixi,
FlxGame, and world sync without copy-paste.
EOF
)"
```

---

### Task 3: Pooling DX + Mode Lite enemy recycle

**Files:**

- Create or modify: `src/core/flx-typed-group.ts` **only if** `FlxGroup<Enemy>` + `recycle(Enemy)` is insufficient — prefer documenting + using existing APIs first
- Modify: `examples/games/external/game.ts`
- Modify: `tests/browser/phase12.spec.ts` (keep enemy visibility assert)
- Create: `docs/guides/making-games.md` (pools + “invisible sprite” FAQ)

**Interfaces (prefer zero new types):**

Use:

```ts
this.enemies = new FlxGroup<Enemy>(16);
// create: for (let i = 0; i < 16; i++) this.enemies.add(new Enemy());
// spawn:
const e = this.enemies.recycle(Enemy) ?? this.enemies.getFirstAvailable(Enemy);
e.reset(x, y);
e.velocity.x = ...
```

If `recycle` requires `new () => T` with zero-arg constructors, keep `Enemy` zero-arg and set position in spawn (adjust `Enemy` constructor).

- [ ] **Step 1: Refactor Mode Lite enemies to `FlxGroup` + recycle**

Remove unbounded `enemies: Enemy[]` push growth; pre-create pool in `create()`; `#spawnEnemy` recycles; overlap loops use `this.enemies.members`.

- [ ] **Step 2: Write `docs/guides/making-games.md`**

Sections: boot with `createBrowserGame`; why sprites vanish (forgot registration — fixed by world sync); pooling with `recycle`; actions (link Task 4).

- [ ] **Step 3: Playwright external still passes**

Run: `npx playwright test tests/browser/phase12.spec.ts -g External --project=chromium`  
Expected: PASS; registered count still grows with living enemies.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: pool Mode Lite enemies and document game-maker pooling

Replace unbounded enemy arrays with FlxGroup.recycle and add a short
making-games guide for boot, sync, and pools.
EOF
)"
```

---

### Task 4: Thin `FlxActions` keyboard bindings

**Files:**

- Create: `src/input/flx-actions.ts`
- Create: `tests/unit/flx-actions.test.ts`
- Modify: `src/core/flx-g.ts` (or input service) to expose `FlxG.actions`
- Modify: `examples/games/external/game.ts` and/or `platformer/game.ts` to use actions for shoot/jump (optional but preferred for one sample)
- Modify: `docs/guides/making-games.md`

**Interfaces:**

```ts
export class FlxActions {
  bind(action: string, ...keys: string[]): void;
  unbind(action: string): void;
  pressed(action: string): boolean;
  justPressed(action: string): boolean;
  justReleased(action: string): boolean;
  reset(): void;
}
```

Resolve keys via existing `FlxG.keys.pressed/justPressed` (same name strings as today: `'SPACE'`, `'Z'`, …).

- [ ] **Step 1: Failing unit tests**

```ts
it('justPressed is true when any bound key justPressed', () => {
  actions.bind('jump', 'SPACE', 'W');
  // simulate key edge via input manager test harness used elsewhere
  expect(actions.justPressed('jump')).toBe(true);
});
```

- [ ] **Step 2: Implement + wire `FlxG.actions`**

Create per-context instance (like other services) or lazy singleton on active context — match how `FlxG.keys` resolves.

- [ ] **Step 3: Use in one sample**

External: `FlxG.actions.bind('shoot', 'Z')` in `create`; fire on `justPressed('shoot')`.  
Platformer (optional same task): bind `jump` → `SPACE`.

- [ ] **Step 4: Verify**

```bash
npx vitest run tests/unit/flx-actions.test.ts
npx playwright test tests/browser/phase12.spec.ts --project=chromium
```

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: add FlxActions named keyboard bindings

Let games bind jump/shoot-style actions to one or more keys without
replacing FlxG.keys.
EOF
)"
```

---

### Task 5: Docs rollup + DX evidence note

**Files:**

- Modify: `docs/guides/lifecycle.md`, `extensions.md`, `README.md` (pointer)
- Create: `docs/dx-evidence.md` (short: what shipped, tests run)
- Modify: `PORTING_PLAN.md` — note “Game-maker DX track” under Phase 13 or a short subsection (not a new C-gate)

- [ ] **Step 1: Write `docs/dx-evidence.md`** with checklist from design done criteria and commands run.
- [ ] **Step 2: Cross-link guides from README.**
- [ ] **Step 3: `npm run verify` subset** — at least `typecheck`, `test`, `check:games-imports`, phase12 Playwright chromium.
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs: record game-maker DX track evidence and guide links

Document world sync, createBrowserGame, pooling, and actions for authors.
EOF
)"
```

---

## Self-review (plan author)

1. **Spec coverage:** World sync, public boot, pooling/Mode Lite, actions, docs — each has a task.
2. **No gamepad** in tasks (follow-up only).
3. **Incremental sync** mandated over clear+rebuild.
4. **API extractor:** Task 2 calls out `api:update` if exports change.

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-08-07-game-maker-dx.md`.

**Options:** (1) Subagent-Driven per task (2) Inline execution in this session.
