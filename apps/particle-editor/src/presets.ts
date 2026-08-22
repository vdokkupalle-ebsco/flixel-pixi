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
