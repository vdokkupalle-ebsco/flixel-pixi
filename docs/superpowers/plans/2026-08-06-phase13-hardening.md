# Phase 13 Hardening Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a report-only atlas sprite FPS stress sample and a short boot/destroy soak with Playwright coverage and evidence — without claiming full C13 or publishing 1.0.

**Architecture:** Two games-kit samples (`bench-sprites`, `bench-soak`) boot via `examples/games/_kit/boot-game.ts` public APIs; Playwright on port 4174 reads `window` hooks; metrics and soak results land in `docs/phase13-evidence.md`.

**Tech Stack:** TypeScript, PixiJS v8, Vite (`vite.games.config.ts`), Playwright, Flixel-pixi public exports (`FlxSprite`, `FlxGraphic`, `makeGraphicPixels`, `FlxGroup`, `FlxState`, `FlxText`, `FlxCameraRenderer.registeredObjectCount`).

## Global Constraints

- Public-API-only samples under `examples/games/**` (no `src/**` deep imports); `npm run check:games-imports` must pass.
- FPS is **report-only** — Playwright must not fail on FPS magnitude.
- Soak: **M = 10** cycles, ~500–1000 ms run each; crash-free teardown required; use `registeredObjectCount` when measuring mid-cycle stability.
- Resolution **640×480**; active sprites **2000**; inactive pool **8000** (not added to the state tree / not registered for render — allocation-only).
- Atlas: one procedural texture, ≥4 frames (16×16 tiles).
- No npm publish / API freeze / 30-minute soak in this plan.
- Chromium is the primary evidence browser; existing Playwright projects (chromium/firefox/webkit) may all run the same specs.

---

## File map

| Path                                      | Responsibility                                          |
| ----------------------------------------- | ------------------------------------------------------- |
| `examples/games/bench-sprites/game.ts`    | Stress `FlxState`: atlas, 2000 movers, HUD, FPS sampler |
| `examples/games/bench-sprites/main.ts`    | Boot + `__FLIXEL_PIXI_BENCH__` hook                     |
| `examples/games/bench-sprites/index.html` | Shell page                                              |
| `examples/games/bench-soak/game.ts`       | Tiny idle state for soak cycles                         |
| `examples/games/bench-soak/main.ts`       | 10× boot/destroy loop + `__FLIXEL_PIXI_SOAK__`          |
| `examples/games/bench-soak/index.html`    | Shell page                                              |
| `examples/games/index.html`               | Links to new samples                                    |
| `vite.games.config.ts`                    | Rollup entries for new HTML                             |
| `tests/browser/phase13.spec.ts`           | Bench + soak Playwright tests                           |
| `docs/phase13-evidence.md`                | Recorded metrics                                        |
| `docs/guides/performance.md`              | Pointer to benches                                      |
| `PORTING_PLAN.md`                         | Phase 13 status = hardening in progress                 |

---

### Task 1: Sprite stress sample (`bench-sprites`)

**Files:**

- Create: `examples/games/bench-sprites/game.ts`
- Create: `examples/games/bench-sprites/main.ts`
- Create: `examples/games/bench-sprites/index.html`
- Modify: `vite.games.config.ts` (add `bench-sprites` input)
- Modify: `examples/games/index.html` (nav link)
- Test: `tests/browser/phase13.spec.ts` (bench describe only in this task)

**Interfaces:**

- Consumes: `bootGame` from `../_kit/boot-game`; public `FlxSprite.loadGraphic(graphic, true, false, 16, 16)`, `FlxGraphic.fromPixels`, `makeGraphicPixels`, `FlxGroup`, `FlxState`, `FlxText`, `FlxG`
- Produces: `window.__FLIXEL_PIXI_BENCH__` with shape:

```ts
interface FlixelPixiBenchHook {
  ready: boolean;
  measured: boolean;
  destroyed: boolean;
  avgFps: number;
  minFps: number;
  activeCount: number;
  inactiveCount: number;
  drawCalls: number | null;
}
```

- [ ] **Step 1: Write the failing Playwright bench test**

Create `tests/browser/phase13.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Phase 13 — Sprite stress bench', () => {
  test('boots, reports finite FPS metrics (report-only), destroys', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto(`${GAMES}/bench-sprites/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 15_000 },
    );

    await page.waitForFunction(
      () => window.__FLIXEL_PIXI_BENCH__?.measured === true,
      { timeout: 20_000 },
    );

    const metrics = await page.evaluate(() => window.__FLIXEL_PIXI_BENCH__);
    expect(metrics?.ready).toBe(true);
    expect(metrics?.activeCount).toBe(2000);
    expect(metrics?.inactiveCount).toBe(8000);
    expect(Number.isFinite(metrics?.avgFps)).toBe(true);
    expect(Number.isFinite(metrics?.minFps)).toBe(true);
    expect(metrics!.avgFps).toBeGreaterThan(0);
    // Report-only: log, do not assert a floor
    console.log('[phase13 bench]', metrics);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});
```

Add to the same file (top) a minimal global augmentation if needed — or rely on ambient `any` via optional chaining. Prefer declaring in the test file:

```ts
declare global {
  interface Window {
    __FLIXEL_PIXI_BENCH__?: {
      ready: boolean;
      measured: boolean;
      destroyed: boolean;
      avgFps: number;
      minFps: number;
      activeCount: number;
      inactiveCount: number;
      drawCalls: number | null;
    };
    __FLIXEL_PIXI_SOAK__?: {
      done: boolean;
      cycles: number;
      errors: string[];
      registeredSamples: number[];
    };
  }
}
export {};
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/browser/phase13.spec.ts --project=chromium`

Expected: FAIL (page 404 / status never ready).

- [ ] **Step 3: Implement atlas helper + `BenchSpritesState`**

Create `examples/games/bench-sprites/game.ts`:

```ts
import {
  FlxG,
  FlxGraphic,
  FlxGroup,
  FlxSprite,
  FlxState,
  FlxText,
  makeGraphicPixels,
} from '../../../src';

export const ACTIVE_COUNT = 2000;
export const INACTIVE_COUNT = 8000;
const TILE = 16;
const ATLAS_COLS = 4;
const ATLAS_ROWS = 4;

/** Build one atlas texture: 4×4 grid of distinct 16×16 solid tiles. */
export function createAtlasGraphic(): FlxGraphic {
  const w = ATLAS_COLS * TILE;
  const h = ATLAS_ROWS * TILE;
  const pixels = makeGraphicPixels(w, h, 0x00000000);
  const colors = [
    0x38bdf8ff, 0xf472b6ff, 0xfacc15ff, 0x4ade80ff, 0xa78bfaff, 0xfb923cff,
    0x22d3eeff, 0xf87171ff, 0x94a3b8ff, 0x2dd4bfff, 0xe879f9ff, 0xfde047ff,
    0x60a5faff, 0xc084fcff, 0x34d399ff, 0xfda4afff,
  ];
  for (let row = 0; row < ATLAS_ROWS; row += 1) {
    for (let col = 0; col < ATLAS_COLS; col += 1) {
      const color = colors[row * ATLAS_COLS + col]!;
      for (let y = 0; y < TILE; y += 1) {
        for (let x = 0; x < TILE; x += 1) {
          const i = ((row * TILE + y) * w + (col * TILE + x)) * 4;
          pixels.data[i] = (color >>> 24) & 0xff;
          pixels.data[i + 1] = (color >>> 16) & 0xff;
          pixels.data[i + 2] = (color >>> 8) & 0xff;
          pixels.data[i + 3] = color & 0xff;
        }
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'bench-atlas');
}

export class BenchSpritesState extends FlxState {
  hud!: FlxText;
  activeSprites = new FlxGroup(ACTIVE_COUNT);
  /** Allocation-only; not added to the state → not registered for render. */
  inactivePool: FlxSprite[] = [];
  #atlas!: FlxGraphic;
  #sampleElapsed = 0;
  #warmupDone = false;
  #frameTimes: number[] = [];
  #lastNow = 0;
  measured = false;
  avgFps = 0;
  minFps = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff0f172a;
    this.#atlas = createAtlasGraphic();

    for (let i = 0; i < ACTIVE_COUNT; i += 1) {
      const s = new FlxSprite(
        (i * 17) % (FlxG.width - TILE),
        (i * 31) % (FlxG.height - TILE),
      );
      s.loadGraphic(this.#atlas, true, false, TILE, TILE);
      s.frame = i % (ATLAS_COLS * ATLAS_ROWS);
      s.velocity.x = 40 + (i % 50);
      s.velocity.y = 30 + (i % 40);
      if (i % 2 === 0) s.velocity.x *= -1;
      if (i % 3 === 0) s.velocity.y *= -1;
      this.activeSprites.add(s);
    }
    this.add(this.activeSprites);

    for (let i = 0; i < INACTIVE_COUNT; i += 1) {
      const s = new FlxSprite(0, 0);
      s.loadGraphic(this.#atlas, true, false, TILE, TILE);
      s.exists = false;
      this.inactivePool.push(s);
    }

    this.hud = new FlxText(8, 6, 624, 'BENCH SPRITES — warming up…');
    this.hud.setFormat(undefined, 12, 0xffe2e8f0, 'left');
    this.hud.scrollFactor.x = 0;
    this.hud.scrollFactor.y = 0;
    this.add(this.hud);
    this.#lastNow = performance.now();
  }

  override update(): void {
    super.update();
    const now = performance.now();
    const dtMs = now - this.#lastNow;
    this.#lastNow = now;
    this.#sampleElapsed += FlxG.elapsed;

    for (const member of this.activeSprites.members) {
      if (!(member instanceof FlxSprite) || !member.exists) continue;
      if (member.x < 0 || member.x > FlxG.width - member.width) {
        member.velocity.x *= -1;
        member.x = Math.max(0, Math.min(member.x, FlxG.width - member.width));
      }
      if (member.y < 0 || member.y > FlxG.height - member.height) {
        member.velocity.y *= -1;
        member.y = Math.max(0, Math.min(member.y, FlxG.height - member.height));
      }
    }

    if (!this.#warmupDone) {
      if (this.#sampleElapsed >= 1) {
        this.#warmupDone = true;
        this.#sampleElapsed = 0;
        this.#frameTimes.length = 0;
      }
      this.hud.text = `BENCH — warmup ${this.#sampleElapsed.toFixed(2)}s · active ${ACTIVE_COUNT}`;
      return;
    }

    if (!this.measured) {
      if (dtMs > 0 && dtMs < 250) this.#frameTimes.push(dtMs);
      if (this.#sampleElapsed >= 4) {
        const fpss = this.#frameTimes.map((ms) => 1000 / ms);
        const sum = fpss.reduce((a, b) => a + b, 0);
        this.avgFps = fpss.length ? sum / fpss.length : 0;
        this.minFps = fpss.length ? Math.min(...fpss) : 0;
        this.measured = true;
      }
    }

    this.hud.text = this.measured
      ? `BENCH — avg ${this.avgFps.toFixed(1)} fps · min ${this.minFps.toFixed(1)} · active ${ACTIVE_COUNT} · inactive ${INACTIVE_COUNT}`
      : `BENCH — measuring ${this.#sampleElapsed.toFixed(2)}s · active ${ACTIVE_COUNT}`;
  }
}
```

If `makeGraphicPixels` / pixel layout differs (RGBA packing), match the pattern used in `examples/games/platformer/game.ts` for `makeCoinGraphic` (same channel order as existing samples).

- [ ] **Step 4: Implement `main.ts` + `index.html` + Vite/index wiring**

`examples/games/bench-sprites/index.html` — copy hello shell; title “Bench — Sprites”; script `./main.ts`.

`examples/games/bench-sprites/main.ts`:

```ts
import { bootGame, type GameApplication } from '../_kit/boot-game';
import { ACTIVE_COUNT, BenchSpritesState, INACTIVE_COUNT } from './game';

declare global {
  interface Window {
    __FLIXEL_PIXI_BENCH__?: {
      app?: GameApplication;
      ready: boolean;
      measured: boolean;
      destroyed: boolean;
      avgFps: number;
      minFps: number;
      activeCount: number;
      inactiveCount: number;
      drawCalls: number | null;
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const destroyBtn = document.querySelector<HTMLButtonElement>(
  '[data-action="destroy"]',
);

window.__FLIXEL_PIXI_BENCH__ = {
  ready: false,
  measured: false,
  destroyed: false,
  avgFps: 0,
  minFps: 0,
  activeCount: ACTIVE_COUNT,
  inactiveCount: INACTIVE_COUNT,
  drawCalls: null,
};

if (!host) throw new Error('Missing [data-testid="canvas-host"]');

bootGame({
  host,
  initialState: BenchSpritesState,
  width: 640,
  height: 480,
  title: 'Sprite Bench',
  showPreloader: false,
})
  .then((app) => {
    const syncHook = () => {
      const state = app.game.state;
      const measured =
        state instanceof BenchSpritesState ? state.measured : false;
      window.__FLIXEL_PIXI_BENCH__ = {
        app,
        ready: true,
        measured,
        destroyed: false,
        avgFps: state instanceof BenchSpritesState ? state.avgFps : 0,
        minFps: state instanceof BenchSpritesState ? state.minFps : 0,
        activeCount: ACTIVE_COUNT,
        inactiveCount: INACTIVE_COUNT,
        drawCalls: null,
      };
    };
    syncHook();
    app.app.ticker.add(syncHook);

    if (status) {
      status.textContent = 'Sprite bench ready';
      status.setAttribute('data-state', 'ready');
    }
    destroyBtn?.removeAttribute('disabled');
    destroyBtn?.addEventListener('click', () => {
      app.destroy();
      window.__FLIXEL_PIXI_BENCH__ = {
        ready: false,
        measured: false,
        destroyed: true,
        avgFps: 0,
        minFps: 0,
        activeCount: ACTIVE_COUNT,
        inactiveCount: INACTIVE_COUNT,
        drawCalls: null,
      };
      if (status) {
        status.textContent = 'Destroyed';
        status.setAttribute('data-state', 'destroyed');
      }
    });
  })
  .catch((err: unknown) => {
    if (status) {
      status.textContent = `Failed: ${String(err)}`;
      status.setAttribute('data-state', 'error');
    }
  });
```

Update `vite.games.config.ts` `rollupOptions.input` with:

```ts
'bench-sprites': resolve(
  import.meta.dirname,
  'examples/games/bench-sprites/index.html',
),
```

Update `examples/games/index.html` nav:

```html
<a href="./bench-sprites/"><button type="button">Bench Sprites</button></a>
```

(Optionally retitle header from “Phase 12” to “Sample games”.)

- [ ] **Step 5: Run Playwright bench test to verify it passes**

Run: `npx playwright test tests/browser/phase13.spec.ts --project=chromium`

Expected: PASS. Note logged `[phase13 bench]` metrics for evidence later.

Also run: `npm run check:games-imports` → PASS.

- [ ] **Step 6: Commit**

```bash
git add examples/games/bench-sprites examples/games/index.html vite.games.config.ts tests/browser/phase13.spec.ts
git commit -m "$(cat <<'EOF'
feat: add atlas sprite stress bench sample for Phase 13

Report-only FPS metrics over 2k atlas-batched movers with an inactive
allocation pool, covered by Playwright.
EOF
)"
```

---

### Task 2: Soak harness (`bench-soak`)

**Files:**

- Create: `examples/games/bench-soak/game.ts`
- Create: `examples/games/bench-soak/main.ts`
- Create: `examples/games/bench-soak/index.html`
- Modify: `vite.games.config.ts` (add `bench-soak` input)
- Modify: `examples/games/index.html` (nav link)
- Modify: `tests/browser/phase13.spec.ts` (add soak describe)

**Interfaces:**

- Consumes: `bootGame` / `GameApplication`; `app.renderer.registeredObjectCount`
- Produces: `window.__FLIXEL_PIXI_SOAK__`:

```ts
interface FlixelPixiSoakHook {
  done: boolean;
  cycles: number; // completed destroy cycles (target 10)
  errors: string[];
  registeredSamples: number[]; // registeredObjectCount mid-cycle, length === cycles
}
```

- [ ] **Step 1: Write the failing Playwright soak test**

Append to `tests/browser/phase13.spec.ts`:

```ts
test.describe('Phase 13 — Boot/destroy soak', () => {
  test('completes 10 cycles without errors or rising handle counts', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto(`${GAMES}/bench-soak/`);
    await page.waitForFunction(
      () => window.__FLIXEL_PIXI_SOAK__?.done === true,
      { timeout: 90_000 },
    );

    const soak = await page.evaluate(() => window.__FLIXEL_PIXI_SOAK__);
    expect(soak?.errors ?? ['missing']).toEqual([]);
    expect(soak?.cycles).toBe(10);
    expect(soak?.registeredSamples?.length).toBe(10);

    const samples = soak!.registeredSamples;
    // No monotonic climb: last <= first + 2 (ε for noise)
    expect(samples[samples.length - 1]!).toBeLessThanOrEqual(samples[0]! + 2);
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]!).toBeLessThanOrEqual(samples[0]! + 2);
    }
    console.log('[phase13 soak]', soak);
  });
});
```

- [ ] **Step 2: Run soak test to verify it fails**

Run: `npx playwright test tests/browser/phase13.spec.ts -g soak --project=chromium`

Expected: FAIL (404 / done never true).

- [ ] **Step 3: Implement tiny soak state + main loop**

`examples/games/bench-soak/game.ts`:

```ts
import { FlxG, FlxSprite, FlxState, FlxText } from '../../../src';

/** Minimal state so each soak cycle has something to register/destroy. */
export class SoakState extends FlxState {
  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff111827;
    const s = new FlxSprite(300, 220);
    s.makeGraphic(32, 32, 0xff38bdf8);
    this.add(s);
    const t = new FlxText(8, 8, 400, 'SOAK CYCLE');
    t.setFormat(undefined, 12, 0xffe2e8f0, 'left');
    this.add(t);
  }
}
```

`examples/games/bench-soak/main.ts`:

```ts
import { bootGame } from '../_kit/boot-game';
import { SoakState } from './game';

const CYCLES = 10;
const RUN_MS = 750;

declare global {
  interface Window {
    __FLIXEL_PIXI_SOAK__?: {
      done: boolean;
      cycles: number;
      errors: string[];
      registeredSamples: number[];
    };
  }
}

const host = document.querySelector<HTMLElement>('[data-testid="canvas-host"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');

window.__FLIXEL_PIXI_SOAK__ = {
  done: false,
  cycles: 0,
  errors: [],
  registeredSamples: [],
};

if (!host) throw new Error('Missing [data-testid="canvas-host"]');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSoak(): Promise<void> {
  const errors: string[] = [];
  const registeredSamples: number[] = [];

  for (let i = 0; i < CYCLES; i += 1) {
    try {
      const app = await bootGame({
        host,
        initialState: SoakState,
        width: 640,
        height: 480,
        title: `Soak ${i + 1}`,
        showPreloader: false,
      });
      await sleep(RUN_MS);
      registeredSamples.push(app.renderer.registeredObjectCount);
      app.destroy();
      window.__FLIXEL_PIXI_SOAK__ = {
        done: false,
        cycles: i + 1,
        errors: [...errors],
        registeredSamples: [...registeredSamples],
      };
      if (status) {
        status.textContent = `Soak cycle ${i + 1}/${CYCLES}`;
        status.setAttribute('data-state', 'loading');
      }
    } catch (err) {
      errors.push(String(err));
      window.__FLIXEL_PIXI_SOAK__ = {
        done: true,
        cycles: i,
        errors: [...errors],
        registeredSamples: [...registeredSamples],
      };
      if (status) {
        status.textContent = `Soak failed: ${String(err)}`;
        status.setAttribute('data-state', 'error');
      }
      return;
    }
  }

  window.__FLIXEL_PIXI_SOAK__ = {
    done: true,
    cycles: CYCLES,
    errors,
    registeredSamples,
  };
  if (status) {
    status.textContent = 'Soak complete';
    status.setAttribute('data-state', 'ready');
  }
}

void runSoak();
```

`index.html` — same shell as hello; no destroy button required (or leave disabled). Status `data-testid="status"`.

Wire Vite input `bench-soak` and index nav link “Bench Soak”.

- [ ] **Step 4: Run soak Playwright test**

Run: `npx playwright test tests/browser/phase13.spec.ts --project=chromium`

Expected: both bench + soak PASS.

If `registeredObjectCount` is unstable across cycles (e.g. grows by 1 each time due to a real leak), **fix the leak in the kit/engine** before loosening the assert. Only if the probe is proven noisy with no leak, document “probe skipped” in evidence and assert `errors.length === 0` + `cycles === 10` only — but try fixing first.

- [ ] **Step 5: Commit**

```bash
git add examples/games/bench-soak examples/games/index.html vite.games.config.ts tests/browser/phase13.spec.ts
git commit -m "$(cat <<'EOF'
feat: add short boot/destroy soak harness for Phase 13

Cycle FlxGame teardown ten times and assert render-handle counts stay flat.
EOF
)"
```

---

### Task 3: Evidence + plan/docs status

**Files:**

- Create: `docs/phase13-evidence.md`
- Modify: `docs/guides/performance.md`
- Modify: `PORTING_PLAN.md` (Phase 13 status blurb)

**Interfaces:**

- Consumes: console metrics from Task 1–2 Playwright runs
- Produces: evidence doc + status notes

- [ ] **Step 1: Re-run Phase 13 Playwright on Chromium and capture logs**

Run: `npx playwright test tests/browser/phase13.spec.ts --project=chromium`

Copy `[phase13 bench]` and `[phase13 soak]` log objects.

- [ ] **Step 2: Write `docs/phase13-evidence.md`**

```markdown
# Phase 13 evidence: hardening pass (partial)

- Checkpoint: **not** full C13 — hardening only (no 1.0 publish)
- Status: In progress / partial
- Date: YYYY-MM-DD
- Spec: [`docs/superpowers/specs/2026-08-06-phase13-hardening-design.md`](superpowers/specs/2026-08-06-phase13-hardening-design.md)

## Scene config (bench-sprites)

| Parameter      | Value                                    |
| -------------- | ---------------------------------------- |
| Resolution     | 640×480                                  |
| Atlas          | Procedural 4×4 × 16px tiles, one texture |
| Active sprites | 2000 moving                              |
| Inactive pool  | 8000 (allocation only, not registered)   |
| Warmup         | 1s                                       |
| Measure        | 4s                                       |

## FPS baseline (report-only)

| Browser             | avgFps | minFps | Notes               |
| ------------------- | ------ | ------ | ------------------- |
| Chromium (local/CI) | …      | …      | from Playwright log |

## Soak (10 × ~750ms)

| Metric            | Value           |
| ----------------- | --------------- |
| cycles            | 10              |
| errors            | []              |
| registeredSamples | […]             |
| verdict           | flat / no throw |

## Verification

- `npm run check:games-imports` — pass
- `npx playwright test tests/browser/phase13.spec.ts` — pass
```

Fill numeric cells from the run. Note OS / machine briefly if known.

- [ ] **Step 3: Update performance guide**

Append to `docs/guides/performance.md`:

```markdown
## Benchmarks

- Sprite atlas stress: `examples/games/bench-sprites/` (`npm run dev:games` → Bench Sprites). Report-only FPS via `window.__FLIXEL_PIXI_BENCH__`.
- Boot/destroy soak: `examples/games/bench-soak/`. See `docs/phase13-evidence.md`.
```

- [ ] **Step 4: Mark Phase 13 partial in `PORTING_PLAN.md`**

Under `### Phase 13 — Performance, browser hardening, and 1.0 release`, add immediately after the heading:

```markdown
Status: **hardening pass in progress** (2026-08-06). Atlas sprite FPS baseline + short soak shipped; full C13 (30‑minute soak, hard budgets, 1.0 publish) not closed. See [`docs/phase13-evidence.md`](docs/phase13-evidence.md) and [`docs/superpowers/specs/2026-08-06-phase13-hardening-design.md`](docs/superpowers/specs/2026-08-06-phase13-hardening-design.md).
```

- [ ] **Step 5: Final verify + commit**

Run:

```bash
npm run check:games-imports
npx playwright test tests/browser/phase13.spec.ts --project=chromium
```

Expected: PASS.

```bash
git add docs/phase13-evidence.md docs/guides/performance.md PORTING_PLAN.md
git commit -m "$(cat <<'EOF'
docs: record Phase 13 hardening evidence and partial status

Capture sprite-bench FPS and soak results; mark full C13 as not closed.
EOF
)"
```

---

## Self-review checklist (plan author)

1. **Spec coverage:** Goals 1–3, non-goals, bench config, soak M/K, report-only FPS, evidence, PORTING_PLAN partial status — each has a task/step.
2. **Placeholders:** None intentional; evidence date/numbers filled at Task 3 from a real run.
3. **Types:** Hook shapes consistent across main.ts, game.ts, and Playwright globals.
4. **Inactive pool:** Explicitly not in the state tree so FPS measures ~2k registered movers, matching the design intent.
