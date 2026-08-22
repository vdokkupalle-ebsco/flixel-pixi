/** Small reproducible 32-bit generator used by particle presets. */
export class ParticleRandom {
  #initialSeed: number;
  #state: number;

  constructor(seed: number) {
    this.#initialSeed = seed >>> 0;
    this.#state = this.#initialSeed;
  }

  get seed(): number {
    return this.#initialSeed;
  }

  next(): number {
    this.#state = (this.#state + 0x6d2b_79f5) >>> 0;
    let value = this.#state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  }

  range(min: number, max: number): number {
    return min === max ? min : min + this.next() * (max - min);
  }

  reset(seed = this.#initialSeed): void {
    this.#initialSeed = seed >>> 0;
    this.#state = this.#initialSeed;
  }
}
