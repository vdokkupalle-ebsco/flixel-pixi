import {
  FlxG,
  FlxGraphic,
  FlxGroup,
  FlxSprite,
  FlxState,
  FlxText,
  makeGraphicPixels,
} from '../../../src';

/** Supported active-sprite stress sizes. */
export const ACTIVE_PRESETS = [2000, 5000, 10000] as const;
export type ActivePreset = (typeof ACTIVE_PRESETS)[number];

/** Allocation-only pool size (not registered for render). Fixed across presets. */
export const INACTIVE_COUNT = 8000;

const TILE = 16;
const ATLAS_COLS = 4;
const ATLAS_ROWS = 4;

/** Resolved before `bootGame` constructs the state. */
let configuredActiveCount: ActivePreset = 2000;

export function getConfiguredActiveCount(): ActivePreset {
  return configuredActiveCount;
}

export function configureBenchActive(count: number): ActivePreset {
  const match = ACTIVE_PRESETS.find((n) => n === count);
  configuredActiveCount = match ?? 2000;
  return configuredActiveCount;
}

/** Parse `?active=` from a query string (default 2000). */
export function parseActiveQuery(search: string): ActivePreset {
  const raw = new URLSearchParams(search).get('active');
  if (raw === null || raw === '') return 2000;
  return configureBenchActive(Number(raw));
}

/** Build one atlas texture: 4×4 grid of distinct 16×16 solid tiles. */
export function createAtlasGraphic(): FlxGraphic {
  const w = ATLAS_COLS * TILE;
  const h = ATLAS_ROWS * TILE;
  const pixels = makeGraphicPixels(w, h, 0x00000000);
  const colors = [
    0x38bdf8ff, 0xf472b6ff, 0xfacc15ff, 0x4ade80ff,
    0xa78bfaff, 0xfb923cff, 0x22d3eeff, 0xf87171ff,
    0x94a3b8ff, 0x2dd4bfff, 0xe879f9ff, 0xfde047ff,
    0x60a5faff, 0xc084fcff, 0x34d399ff, 0xfda4afff,
  ];
  for (let row = 0; row < ATLAS_ROWS; row += 1) {
    for (let col = 0; col < ATLAS_COLS; col += 1) {
      const color = colors[row * ATLAS_COLS + col]!;
      for (let y = 0; y < TILE; y += 1) {
        for (let x = 0; x < TILE; x += 1) {
          pixels.data[(row * TILE + y) * w + col * TILE + x] = color;
        }
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'bench-atlas');
}

export class BenchSpritesState extends FlxState {
  hud!: FlxText;
  activeSprites!: FlxGroup;
  /** Allocation-only; not added to the state → not registered for render. */
  inactivePool: FlxSprite[] = [];
  activeCount = configuredActiveCount;
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
    this.activeCount = configuredActiveCount;
    this.activeSprites = new FlxGroup(this.activeCount);

    for (let i = 0; i < this.activeCount; i += 1) {
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
    const n = this.activeCount;

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
      this.hud.text = `BENCH — warmup ${this.#sampleElapsed.toFixed(2)}s · active ${n} · keys 1/2/3 presets`;
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
      ? `BENCH — avg ${this.avgFps.toFixed(1)} fps · min ${this.minFps.toFixed(1)} · active ${n} · inactive ${INACTIVE_COUNT}`
      : `BENCH — measuring ${this.#sampleElapsed.toFixed(2)}s · active ${n}`;
  }
}
