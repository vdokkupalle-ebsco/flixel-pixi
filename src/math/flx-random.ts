const SIGNED_INT_MAX = 0x7fffffff;

/** Advances the original Flixel seeded-random recurrence. @public */
export function nextFlixelSeed(seed: number): number {
  return (
    ((69_621 * Math.trunc(seed * SIGNED_INT_MAX)) % SIGNED_INT_MAX) /
    SIGNED_INT_MAX
  );
}

/** Mutable deterministic random source compatible with `FlxG.globalSeed`. @public */
export class FlxRandom {
  constructor(public seed = 0.5) {
    if (!Number.isFinite(seed)) {
      throw new RangeError('seed must be finite.');
    }
  }

  /** Advances and returns the next number in the Flixel sequence. */
  next(): number {
    this.seed = nextFlixelSeed(this.seed);
    return this.seed;
  }
}
