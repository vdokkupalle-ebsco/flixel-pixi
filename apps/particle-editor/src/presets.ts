import { parseParticlePreset, type ParticlePresetV1 } from 'flixel-pixi';
import {
  createEffectDocument,
  type ParticleEffectDocumentV1,
} from './editor-store';

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
      blendMode: 'add',
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
      blendMode: 'add',
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
      blendMode: 'screen',
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
      blendMode: 'add',
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
      blendMode: 'normal',
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
      blendMode: 'add',
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
      blendMode: 'screen',
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
      blendMode: 'screen',
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
        { color: 0xead8b4e6, time: 0 },
        { color: 0xc29c6eb8, time: 0.58 },
        { color: 0x8a684600, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-70, 70) },
      scale: {
        stops: [
          { time: 0, value: 0.3 },
          { time: 0.38, value: 1.05 },
          { time: 1, value: 1.55 },
        ],
      },
      blendMode: 'normal',
      texture: { assetId: 'editor-dust' },
    },
    capacity: 100,
    emission: { count: 72, mode: 'burst' },
    id: 'starter-dust-poof',
    kind: 'particle-preset',
    lifespan: range(0.9, 1.7),
    motion: {
      acceleration: vector(-5, 5, 38, 68),
      drag: vector(14, 28, 8, 18),
      velocity: vector(-112, 112, -82, -18),
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
        { color: 0x19dffaff, time: 0 },
        { color: 0xffd84dff, time: 0.28 },
        { color: 0xff4f91ff, time: 0.58 },
        { color: 0x8b6cffff, time: 0.82 },
        { color: 0x27dfa9ff, time: 1 },
      ],
      rotation: { initial: range(0, 360), velocity: range(-760, 760) },
      scale: {
        stops: [
          { time: 0, value: 0.44 },
          { time: 0.72, value: 0.34 },
          { time: 1, value: 0.22 },
        ],
      },
      blendMode: 'normal',
      texture: { assetId: 'editor-confetti' },
    },
    capacity: 160,
    emission: { count: 120, mode: 'burst' },
    id: 'starter-confetti-pop',
    kind: 'particle-preset',
    lifespan: range(1.7, 3.4),
    motion: {
      acceleration: vector(-12, 12, 170, 250),
      drag: vector(3, 9, 1, 4),
      velocity: vector(-220, 220, -310, -145),
    },
    name: 'Confetti pop',
    schemaVersion: 1,
    seed: 771029,
    space: 'world',
    spawn: { height: 8, shape: 'rectangle', width: 20 },
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
      blendMode: 'add',
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
      blendMode: 'add',
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

export function findStarterEffectDocument(
  id: string,
): ParticleEffectDocumentV1 | undefined {
  const campfire = findStarterPreset('starter-campfire');
  const smoke = findStarterPreset('starter-smoke-plume');
  const spark = findStarterPreset('starter-spark-fountain');
  const rain = findStarterPreset('starter-rain-shower');
  const splash = findStarterPreset('starter-water-splash');
  const magic = findStarterPreset('starter-magic-burst');
  const electric = findStarterPreset('starter-electric-sparks');

  if (id === 'starter-campfire' && campfire && smoke && spark) {
    return {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'starter-campfire',
      name: 'Campfire',
      emitters: [
        {
          layerId: 'layer-flames',
          name: 'Flames',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: campfire,
        },
        {
          layerId: 'layer-smoke',
          name: 'Smoke Plume',
          enabled: true,
          offset: { x: 0, y: -16 },
          textureShape: 'circle',
          preset: smoke,
        },
        {
          layerId: 'layer-embers',
          name: 'Floating Embers',
          enabled: true,
          offset: { x: 0, y: -4 },
          textureShape: 'circle',
          preset: {
            ...spark,
            capacity: 60,
            emission: { mode: 'continuous', rate: 16 },
          },
        },
      ],
    };
  }

  if (id === 'starter-rain-shower' && rain && splash) {
    return {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'starter-rain-shower',
      name: 'Rain Storm',
      emitters: [
        {
          layerId: 'layer-rain',
          name: 'Rain',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: rain,
        },
        {
          layerId: 'layer-splashes',
          name: 'Puddle Splashes',
          enabled: true,
          offset: { x: 0, y: 70 },
          textureShape: 'circle',
          preset: {
            ...splash,
            capacity: 80,
            emission: { mode: 'continuous', rate: 30 },
          },
        },
      ],
    };
  }

  if (id === 'starter-magic-burst' && magic && electric) {
    return {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'starter-magic-burst',
      name: 'Magic Portal Burst',
      emitters: [
        {
          layerId: 'layer-burst',
          name: 'Energy Core',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: magic,
        },
        {
          layerId: 'layer-orbit-sparks',
          name: 'Electric Sparks',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: electric,
        },
      ],
    };
  }

  const single = findStarterPreset(id);
  return single === undefined ? undefined : createEffectDocument(single);
}
