import type { ParticlePresetV1 } from 'flixel-pixi';

export const starterPreset = {
  appearance: {
    alpha: {
      stops: [
        { time: 0, value: 1 },
        { time: 0.7, value: 0.86 },
        { time: 1, value: 0 },
      ],
    },
    colors: [
      { color: 0x71f6ffff, time: 0 },
      { color: 0x7c5cffff, time: 0.55 },
      { color: 0xff5f9eff, time: 1 },
    ],
    rotation: {
      initial: { max: 180, min: 0 },
      velocity: { max: 120, min: -120 },
    },
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
  lifespan: { max: 1.7, min: 0.8 },
  motion: {
    acceleration: {
      x: { max: 10, min: -10 },
      y: { max: 88, min: 62 },
    },
    drag: {
      x: { max: 4, min: 1 },
      y: { max: 2, min: 0 },
    },
    velocity: {
      x: { max: 92, min: -92 },
      y: { max: -92, min: -178 },
    },
  },
  name: 'Starter spark fountain',
  schemaVersion: 1,
  seed: 20260823,
  space: 'world',
  spawn: { height: 8, shape: 'rectangle', width: 32 },
} satisfies ParticlePresetV1;
