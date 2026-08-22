import { parseParticlePreset, type ParticlePresetV1 } from 'flixel-pixi';

function range(min: number, max = min) {
  return { max, min };
}

function vector(xMin: number, xMax: number, yMin: number, yMax: number) {
  return { x: range(xMin, xMax), y: range(yMin, yMax) };
}

export const starterPresets = [
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 1 },
          { time: 0.72, value: 0.86 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0x1de8f1ff, time: 0 },
        { color: 0x8d74ffff, time: 0.55 },
        { color: 0xff397eff, time: 1 },
      ],
      rotation: { initial: range(0, 180), velocity: range(-120, 120) },
      scale: {
        stops: [
          { time: 0, value: 0.45 },
          { time: 0.18, value: 1 },
          { time: 1, value: 0.1 },
        ],
      },
      texture: { assetId: 'editor-spark' },
    },
    capacity: 160,
    emission: { mode: 'continuous', rate: 48 },
    id: 'starter-spark-fountain',
    kind: 'particle-preset',
    lifespan: range(0.8, 1.7),
    motion: {
      acceleration: vector(-10, 10, 62, 88),
      drag: vector(1, 4, 0, 2),
      velocity: vector(-92, 92, -178, -92),
    },
    name: 'Spark fountain',
    schemaVersion: 1,
    seed: 20260823,
    space: 'world',
    spawn: { height: 8, shape: 'rectangle', width: 32 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 0.9 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xfff27aff, time: 0 },
        { color: 0xff7a28ff, time: 0.45 },
        { color: 0xff1f6d00, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-50, 50) },
      scale: {
        stops: [
          { time: 0, value: 0.75 },
          { time: 1, value: 0.08 },
        ],
      },
      texture: { assetId: 'editor-flame' },
    },
    capacity: 220,
    emission: { mode: 'continuous', rate: 72 },
    id: 'starter-campfire',
    kind: 'particle-preset',
    lifespan: range(0.55, 1.25),
    motion: {
      acceleration: vector(-8, 8, -18, -4),
      drag: vector(2, 8, 0, 3),
      velocity: vector(-48, 48, -126, -64),
    },
    name: 'Campfire',
    schemaVersion: 1,
    seed: 8301,
    space: 'local',
    spawn: { height: 10, shape: 'rectangle', width: 44 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 0.85 },
          { time: 1, value: 0.35 },
        ],
      },
      colors: [
        { color: 0xffffffff, time: 0 },
        { color: 0x9eeeffff, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-35, 35) },
      scale: {
        stops: [
          { time: 0, value: 0.35 },
          { time: 1, value: 0.8 },
        ],
      },
      texture: { assetId: 'editor-snow' },
    },
    capacity: 260,
    emission: { mode: 'continuous', rate: 55 },
    id: 'starter-snowfall',
    kind: 'particle-preset',
    lifespan: range(2.4, 4.5),
    motion: {
      acceleration: vector(-3, 3, 5, 12),
      drag: vector(0, 2, 0, 1),
      velocity: vector(-24, 24, 30, 66),
    },
    name: 'Snowfall',
    schemaVersion: 1,
    seed: 199612,
    space: 'world',
    spawn: { height: 8, shape: 'rectangle', width: 280 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 1 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xffffffff, time: 0 },
        { color: 0x1de8f1ff, time: 0.35 },
        { color: 0xff397eff, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-240, 240) },
      scale: {
        stops: [
          { time: 0, value: 1.4 },
          { time: 1, value: 0.05 },
        ],
      },
      texture: { assetId: 'editor-burst' },
    },
    capacity: 120,
    emission: { count: 96, mode: 'burst' },
    id: 'starter-magic-burst',
    kind: 'particle-preset',
    lifespan: range(0.5, 1.35),
    motion: {
      acceleration: vector(-18, 18, 20, 56),
      drag: vector(8, 18, 8, 18),
      velocity: vector(-230, 230, -230, 230),
    },
    name: 'Magic burst',
    schemaVersion: 1,
    seed: 404040,
    space: 'world',
    spawn: { innerRadius: 0, radius: 8, shape: 'circle' },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 0.18 },
          { time: 0.2, value: 0.55 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0x394657ff, time: 0 },
        { color: 0x778494cc, time: 0.55 },
        { color: 0xc8d0d800, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-18, 18) },
      scale: {
        stops: [
          { time: 0, value: 0.55 },
          { time: 0.35, value: 1.15 },
          { time: 1, value: 2.4 },
        ],
      },
      texture: { assetId: 'editor-smoke' },
    },
    capacity: 180,
    emission: { mode: 'continuous', rate: 30 },
    id: 'starter-smoke-plume',
    kind: 'particle-preset',
    lifespan: range(2.2, 4.2),
    motion: {
      acceleration: vector(-5, 5, -16, -7),
      drag: vector(3, 8, 1, 4),
      velocity: vector(-28, 28, -54, -20),
    },
    name: 'Smoke plume',
    schemaVersion: 1,
    seed: 734202,
    space: 'world',
    spawn: { height: 8, shape: 'rectangle', width: 28 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 1 },
          { time: 0.7, value: 0.82 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xffffffff, time: 0 },
        { color: 0xffe66dff, time: 0.18 },
        { color: 0xff7a28ff, time: 0.58 },
        { color: 0xff1f6d00, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-110, 110) },
      scale: {
        stops: [
          { time: 0, value: 0.9 },
          { time: 0.3, value: 1.15 },
          { time: 1, value: 0.08 },
        ],
      },
      texture: { assetId: 'editor-fire' },
    },
    capacity: 240,
    emission: { mode: 'continuous', rate: 90 },
    id: 'starter-flame-jet',
    kind: 'particle-preset',
    lifespan: range(0.35, 0.95),
    motion: {
      acceleration: vector(-16, 16, -28, -10),
      drag: vector(4, 10, 1, 5),
      velocity: vector(-42, 42, -188, -92),
    },
    name: 'Flame jet',
    schemaVersion: 1,
    seed: 451900,
    space: 'local',
    spawn: { height: 6, shape: 'rectangle', width: 24 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 1 },
          { time: 0.75, value: 0.9 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xe9ffffff, time: 0 },
        { color: 0x41dff5ff, time: 0.35 },
        { color: 0x147dcc00, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-180, 180) },
      scale: {
        stops: [
          { time: 0, value: 0.85 },
          { time: 0.5, value: 0.55 },
          { time: 1, value: 0.12 },
        ],
      },
      texture: { assetId: 'editor-water' },
    },
    capacity: 140,
    emission: { count: 112, mode: 'burst' },
    id: 'starter-water-splash',
    kind: 'particle-preset',
    lifespan: range(0.45, 1.25),
    motion: {
      acceleration: vector(-12, 12, 270, 360),
      drag: vector(4, 12, 1, 5),
      velocity: vector(-230, 230, -310, -105),
    },
    name: 'Water splash',
    schemaVersion: 1,
    seed: 902104,
    space: 'world',
    spawn: { height: 5, shape: 'rectangle', width: 36 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 0.72 },
          { time: 0.82, value: 0.62 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xb9f4ffff, time: 0 },
        { color: 0x3aaee8ff, time: 1 },
      ],
      rotation: { initial: range(-12, 12), velocity: range(-8, 8) },
      scale: {
        stops: [
          { time: 0, value: 0.42 },
          { time: 1, value: 0.16 },
        ],
      },
      texture: { assetId: 'editor-rain' },
    },
    capacity: 320,
    emission: { mode: 'continuous', rate: 120 },
    id: 'starter-rain-shower',
    kind: 'particle-preset',
    lifespan: range(0.8, 1.5),
    motion: {
      acceleration: vector(-4, 4, 110, 170),
      drag: vector(0, 1, 0, 1),
      velocity: vector(-24, -8, 175, 250),
    },
    name: 'Rain shower',
    schemaVersion: 1,
    seed: 601223,
    space: 'world',
    spawn: { height: 4, shape: 'rectangle', width: 300 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 0.8 },
          { time: 0.55, value: 0.5 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xf5d39aff, time: 0 },
        { color: 0xb88957cc, time: 0.6 },
        { color: 0x795d4600, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-90, 90) },
      scale: {
        stops: [
          { time: 0, value: 0.4 },
          { time: 0.45, value: 1.2 },
          { time: 1, value: 1.75 },
        ],
      },
      texture: { assetId: 'editor-dust' },
    },
    capacity: 100,
    emission: { count: 72, mode: 'burst' },
    id: 'starter-dust-poof',
    kind: 'particle-preset',
    lifespan: range(0.65, 1.45),
    motion: {
      acceleration: vector(-6, 6, 55, 95),
      drag: vector(22, 40, 10, 24),
      velocity: vector(-145, 145, -105, -22),
    },
    name: 'Dust poof',
    schemaVersion: 1,
    seed: 198516,
    space: 'world',
    spawn: { innerRadius: 4, radius: 26, shape: 'circle' },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 1 },
          { time: 0.8, value: 1 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0x1de8f1ff, time: 0 },
        { color: 0xffe45cff, time: 0.33 },
        { color: 0xff397eff, time: 0.66 },
        { color: 0x9d7affff, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-540, 540) },
      scale: {
        stops: [
          { time: 0, value: 0.75 },
          { time: 1, value: 0.45 },
        ],
      },
      texture: { assetId: 'editor-confetti' },
    },
    capacity: 180,
    emission: { count: 150, mode: 'burst' },
    id: 'starter-confetti-pop',
    kind: 'particle-preset',
    lifespan: range(1.4, 3.1),
    motion: {
      acceleration: vector(-10, 10, 155, 225),
      drag: vector(4, 12, 1, 5),
      velocity: vector(-245, 245, -295, -125),
    },
    name: 'Confetti pop',
    schemaVersion: 1,
    seed: 771029,
    space: 'world',
    spawn: { height: 12, shape: 'rectangle', width: 28 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 0 },
          { time: 0.22, value: 1 },
          { time: 0.72, value: 0.8 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xf8ffb5ff, time: 0 },
        { color: 0xb5ff72ff, time: 0.55 },
        { color: 0x1de8f100, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-35, 35) },
      scale: {
        stops: [
          { time: 0, value: 0.15 },
          { time: 0.3, value: 0.65 },
          { time: 1, value: 0.2 },
        ],
      },
      texture: { assetId: 'editor-firefly' },
    },
    capacity: 70,
    emission: { mode: 'continuous', rate: 10 },
    id: 'starter-fireflies',
    kind: 'particle-preset',
    lifespan: range(3.2, 6.2),
    motion: {
      acceleration: vector(-10, 10, -8, 8),
      drag: vector(5, 12, 5, 12),
      velocity: vector(-34, 34, -26, 26),
    },
    name: 'Fireflies',
    schemaVersion: 1,
    seed: 440711,
    space: 'world',
    spawn: { height: 150, shape: 'rectangle', width: 270 },
  },
  {
    appearance: {
      alpha: {
        stops: [
          { time: 0, value: 1 },
          { time: 0.65, value: 0.95 },
          { time: 1, value: 0 },
        ],
      },
      colors: [
        { color: 0xffffffff, time: 0 },
        { color: 0x7ff6ffff, time: 0.3 },
        { color: 0x596dffff, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-720, 720) },
      scale: {
        stops: [
          { time: 0, value: 0.95 },
          { time: 1, value: 0.05 },
        ],
      },
      texture: { assetId: 'editor-electric' },
    },
    capacity: 100,
    emission: { count: 76, mode: 'burst' },
    id: 'starter-electric-sparks',
    kind: 'particle-preset',
    lifespan: range(0.16, 0.58),
    motion: {
      acceleration: vector(-20, 20, -20, 20),
      drag: vector(15, 35, 15, 35),
      velocity: vector(-340, 340, -300, 300),
    },
    name: 'Electric sparks',
    schemaVersion: 1,
    seed: 808808,
    space: 'world',
    spawn: { innerRadius: 2, radius: 18, shape: 'circle' },
  },
] satisfies ParticlePresetV1[];

export function clonePreset(preset: ParticlePresetV1): ParticlePresetV1 {
  return parseParticlePreset(structuredClone(preset));
}

export function getDefaultStarterPreset(): ParticlePresetV1 {
  const preset = starterPresets.at(0);
  if (preset === undefined) {
    throw new Error('The particle editor requires a starter preset.');
  }
  return clonePreset(preset);
}

export function findStarterPreset(id: string): ParticlePresetV1 | undefined {
  const preset = starterPresets.find((candidate) => candidate.id === id);
  return preset === undefined ? undefined : clonePreset(preset);
}
