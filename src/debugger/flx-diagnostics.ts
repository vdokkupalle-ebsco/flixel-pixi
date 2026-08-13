import { requireNonNegativeInteger } from '../math/flx-number';

/** One bounded runtime diagnostic sample. @public */
export interface FlxDiagnosticSample {
  readonly fps: number;
  readonly frame: number;
  readonly memoryBytes: number | null;
  readonly timestamp: number;
  readonly updateMs: number;
}

/** Aggregate metrics included with diagnostic exports. @public */
export interface FlxDiagnosticSummary {
  readonly averageFps: number;
  readonly maxUpdateMs: number;
  readonly p95UpdateMs: number;
  readonly peakMemoryBytes: number | null;
  readonly sampleCount: number;
}

/** Versioned, serializable performance snapshot. @public */
export interface FlxDiagnosticSnapshot {
  readonly capturedAt: string;
  readonly samples: readonly FlxDiagnosticSample[];
  readonly schemaVersion: 1;
  readonly summary: FlxDiagnosticSummary;
}

/** Bounded diagnostics collector configuration. @public */
export interface FlxDiagnosticsOptions {
  /** Read memory every N frames. Defaults to 30; zero disables it. */
  readonly memorySampleInterval?: number;
  /** Maximum retained samples. Defaults to 180. */
  readonly maxSamples?: number;
  /** Optional cross-browser memory provider. */
  readonly readMemoryBytes?: () => number | null;
}

/** Bounded, renderer-neutral runtime diagnostics collector. @public */
export class FlxDiagnostics {
  readonly #samples: FlxDiagnosticSample[] = [];
  readonly #maxSamples: number;
  readonly #memorySampleInterval: number;
  readonly #readMemoryBytes: () => number | null;
  #lastMemoryBytes: number | null = null;

  constructor(options: FlxDiagnosticsOptions = {}) {
    this.#maxSamples = requireNonNegativeInteger(
      options.maxSamples ?? 180,
      'maxSamples',
    );
    this.#memorySampleInterval = requireNonNegativeInteger(
      options.memorySampleInterval ?? 30,
      'memorySampleInterval',
    );
    this.#readMemoryBytes = options.readMemoryBytes ?? readBrowserMemoryBytes;
  }

  get samples(): readonly FlxDiagnosticSample[] {
    return [...this.#samples];
  }

  record(
    frame: number,
    updateMs: number,
    fps: number,
    timestamp: number,
  ): void {
    if (this.#maxSamples === 0) return;
    for (const [value, name] of [
      [frame, 'frame'],
      [updateMs, 'updateMs'],
      [fps, 'fps'],
      [timestamp, 'timestamp'],
    ] as const) {
      if (!Number.isFinite(value))
        throw new RangeError(`${name} must be finite.`);
    }
    if (
      this.#memorySampleInterval > 0 &&
      frame % this.#memorySampleInterval === 0
    ) {
      const memory = this.#readMemoryBytes();
      this.#lastMemoryBytes =
        memory !== null && Number.isFinite(memory) && memory >= 0
          ? memory
          : null;
    }
    this.#samples.push({
      fps: Math.max(0, fps),
      frame,
      memoryBytes: this.#lastMemoryBytes,
      timestamp,
      updateMs: Math.max(0, updateMs),
    });
    if (this.#samples.length > this.#maxSamples) {
      this.#samples.splice(0, this.#samples.length - this.#maxSamples);
    }
  }

  clear(): void {
    this.#samples.length = 0;
    this.#lastMemoryBytes = null;
  }

  capture(now = new Date()): FlxDiagnosticSnapshot {
    const samples = this.samples;
    const updateTimes = samples
      .map((sample) => sample.updateMs)
      .sort((a, b) => a - b);
    const memory = samples
      .map((sample) => sample.memoryBytes)
      .filter((value): value is number => value !== null);
    return {
      capturedAt: now.toISOString(),
      samples,
      schemaVersion: 1,
      summary: {
        averageFps:
          samples.length === 0
            ? 0
            : samples.reduce((total, sample) => total + sample.fps, 0) /
              samples.length,
        maxUpdateMs: updateTimes.at(-1) ?? 0,
        p95UpdateMs: percentile(updateTimes, 0.95),
        peakMemoryBytes: memory.length === 0 ? null : Math.max(...memory),
        sampleCount: samples.length,
      },
    };
  }
}

function percentile(
  sortedValues: readonly number[],
  percentileValue: number,
): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil(sortedValues.length * percentileValue) - 1;
  return sortedValues[Math.max(0, index)] ?? 0;
}

function readBrowserMemoryBytes(): number | null {
  if (typeof performance === 'undefined') return null;
  const memory = (
    performance as Performance & {
      memory?: { usedJSHeapSize?: number };
    }
  ).memory;
  return memory?.usedJSHeapSize ?? null;
}
