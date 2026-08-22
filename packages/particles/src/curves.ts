import type { ParticleColorStop, ParticleCurve } from '@flixel-pixi/schemas';

export function sampleParticleCurve(
  curve: ParticleCurve,
  time: number,
): number {
  const stops = curve.stops;
  const first = stops[0];
  if (first === undefined) return 0;
  if (time <= first.time) return first.value;

  for (let index = 1; index < stops.length; index += 1) {
    const right = stops[index];
    const left = stops[index - 1];
    if (right === undefined || left === undefined) continue;
    if (time <= right.time) {
      if (curve.interpolation === 'step') return left.value;
      const progress = (time - left.time) / (right.time - left.time);
      return left.value + (right.value - left.value) * progress;
    }
  }
  return stops.at(-1)?.value ?? first.value;
}

function channel(color: number, shift: number): number {
  return (color >>> shift) & 0xff;
}

function rgba(red: number, green: number, blue: number, alpha: number): number {
  return (((red << 24) >>> 0) | (green << 16) | (blue << 8) | alpha) >>> 0;
}

export function sampleParticleColor(
  stops: ParticleColorStop[],
  time: number,
): number {
  const first = stops[0];
  if (first === undefined) return 0xffff_ffff;
  if (time <= first.time) return first.color;

  for (let index = 1; index < stops.length; index += 1) {
    const right = stops[index];
    const left = stops[index - 1];
    if (right === undefined || left === undefined) continue;
    if (time <= right.time) {
      const progress = (time - left.time) / (right.time - left.time);
      return rgba(
        Math.round(
          channel(left.color, 24) +
            (channel(right.color, 24) - channel(left.color, 24)) * progress,
        ),
        Math.round(
          channel(left.color, 16) +
            (channel(right.color, 16) - channel(left.color, 16)) * progress,
        ),
        Math.round(
          channel(left.color, 8) +
            (channel(right.color, 8) - channel(left.color, 8)) * progress,
        ),
        Math.round(
          channel(left.color, 0) +
            (channel(right.color, 0) - channel(left.color, 0)) * progress,
        ),
      );
    }
  }
  return stops.at(-1)?.color ?? first.color;
}
