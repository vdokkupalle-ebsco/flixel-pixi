/** Configuration for a deterministic fixed-step accumulator. @public */
export interface FixedStepAccumulatorOptions {
  /** Authoritative simulation-step duration, in seconds. */
  readonly stepSeconds?: number;
  /** Maximum simulation updates executed for one display frame. */
  readonly maxCatchUpSteps?: number;
}

/** Result of advancing a {@link FixedStepAccumulator}. @public */
export interface FixedStepAdvanceResult {
  /** Interpolation fraction between the last and next simulation states. */
  readonly alpha: number;
  /** Time discarded by the catch-up cap, in seconds. */
  readonly discardedSeconds: number;
  /** Number of authoritative simulation steps executed. */
  readonly steps: number;
}

/**
 * Converts variable display-frame durations into deterministic simulation
 * updates. Rendering may consume `alpha`, but simulation must not.
 *
 * @public
 */
export class FixedStepAccumulator {
  /** Maximum authoritative updates allowed for one display frame. */
  readonly maxCatchUpSteps: number;
  /** Authoritative simulation-step duration, in seconds. */
  readonly stepSeconds: number;

  #accumulatedSeconds = 0;
  #paused = false;

  constructor(options: FixedStepAccumulatorOptions = {}) {
    const stepSeconds = options.stepSeconds ?? 1 / 60;
    const maxCatchUpSteps = options.maxCatchUpSteps ?? 5;

    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) {
      throw new RangeError('stepSeconds must be a positive finite number.');
    }

    if (!Number.isInteger(maxCatchUpSteps) || maxCatchUpSteps < 1) {
      throw new RangeError('maxCatchUpSteps must be a positive integer.');
    }

    this.stepSeconds = stepSeconds;
    this.maxCatchUpSteps = maxCatchUpSteps;
  }

  /** Current interpolation fraction in the half-open range [0, 1). */
  get alpha(): number {
    return this.#accumulatedSeconds / this.stepSeconds;
  }

  /** Whether display time is currently ignored. */
  get paused(): boolean {
    return this.#paused;
  }

  /**
   * Advances the clock and invokes `update` once per authoritative step.
   * Excess elapsed time is discarded to prevent a spiral of death.
   */
  advance(
    elapsedSeconds: number,
    update: (stepSeconds: number) => void,
  ): FixedStepAdvanceResult {
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
      throw new RangeError(
        'elapsedSeconds must be a non-negative finite number.',
      );
    }

    if (this.#paused) {
      return { alpha: 0, discardedSeconds: elapsedSeconds, steps: 0 };
    }

    const acceptedSeconds = Math.min(
      elapsedSeconds,
      this.stepSeconds * this.maxCatchUpSteps,
    );
    const discardedSeconds = elapsedSeconds - acceptedSeconds;
    this.#accumulatedSeconds += acceptedSeconds;

    let steps = 0;
    const tolerance = this.stepSeconds * 1e-12;

    while (
      steps < this.maxCatchUpSteps &&
      this.#accumulatedSeconds + tolerance >= this.stepSeconds
    ) {
      update(this.stepSeconds);
      this.#accumulatedSeconds -= this.stepSeconds;
      steps += 1;
    }

    if (this.#accumulatedSeconds < tolerance) {
      this.#accumulatedSeconds = 0;
    }

    return { alpha: this.alpha, discardedSeconds, steps };
  }

  /** Clears interpolation and elapsed-time debt without changing pause state. */
  reset(): void {
    this.#accumulatedSeconds = 0;
  }

  /**
   * Pauses or resumes the clock. Changing state clears accumulated time so a
   * hidden tab cannot trigger a catch-up burst when it becomes visible.
   */
  setPaused(paused: boolean): void {
    if (paused === this.#paused) {
      return;
    }

    this.#paused = paused;
    this.reset();
  }
}
