import type { FlxAssets } from '../assets/flx-assets';

/** Lifecycle stage reported by a loading operation. @public */
export type FlxLoadingStage =
  | 'idle'
  | 'renderer'
  | 'assets'
  | 'game'
  | 'first-frame'
  | 'interaction'
  | 'complete'
  | 'custom';

/** High-level state shared by boot and in-game loading presentations. @public */
export type FlxLoadingState =
  'idle' | 'loading' | 'ready' | 'error' | 'cancelled';

/** Immutable loading state delivered to DOM or Pixi/Flixel loading views. @public */
export interface FlxLoadingSnapshot {
  readonly error?: FlxLoadingError;
  readonly message: string;
  /** Null means that the current operation has no measurable progress. */
  readonly progress: number | null;
  readonly retry?: () => void;
  readonly stage: FlxLoadingStage;
  readonly state: FlxLoadingState;
}

/** Partial update accepted by {@link FlxLoadingSession.report}. @public */
export interface FlxLoadingUpdate {
  message?: string;
  progress?: number | null;
  stage?: FlxLoadingStage;
}

/** Context provided to a custom loading task. @public */
export interface FlxLoadingTaskContext {
  /** Report task-local progress in the range 0–1. */
  report(progress: number, message?: string): void;
  readonly signal: AbortSignal;
}

/** Maps a task into a section of the session's overall progress. @public */
export interface FlxLoadingTaskOptions {
  endProgress?: number;
  message: string;
  stage?: FlxLoadingStage;
  startProgress?: number;
}

/** Options for loading an asset bundle through a shared loading session. @public */
export interface FlxLoadingBundleOptions extends Omit<
  FlxLoadingTaskOptions,
  'stage'
> {
  stage?: 'assets' | 'custom';
}

/** A loading failure enriched with the stage that failed. @public */
export class FlxLoadingError extends Error {
  constructor(
    readonly stage: FlxLoadingStage,
    message: string,
    readonly retryable = false,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'FlxLoadingError';
  }
}

/**
 * Renderer-independent loading state for both browser boot and in-game screens.
 * Progress is monotonic within one run and can be reset explicitly for retry.
 * @public
 */
export class FlxLoadingSession {
  readonly #controller = new AbortController();
  readonly #listeners = new Set<(snapshot: FlxLoadingSnapshot) => void>();
  readonly #parentSignal: AbortSignal | undefined;
  readonly #onParentAbort = (): void => {
    this.cancel();
  };
  #snapshot: FlxLoadingSnapshot = Object.freeze({
    message: 'Waiting…',
    progress: 0,
    stage: 'idle',
    state: 'idle',
  });

  constructor(parentSignal?: AbortSignal) {
    this.#parentSignal = parentSignal;
    if (parentSignal?.aborted) {
      this.cancel();
    } else {
      parentSignal?.addEventListener('abort', this.#onParentAbort, {
        once: true,
      });
    }
  }

  get signal(): AbortSignal {
    return this.#controller.signal;
  }

  get snapshot(): FlxLoadingSnapshot {
    return this.#snapshot;
  }

  /** Subscribe to state changes. The current snapshot is emitted immediately. */
  subscribe(listener: (snapshot: FlxLoadingSnapshot) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#snapshot);
    return () => this.#listeners.delete(listener);
  }

  /** Start a new run, including a retry after an error. */
  start(
    stage: FlxLoadingStage = 'custom',
    message = 'Loading…',
    progress: number | null = 0,
  ): void {
    this.#assertActive();
    this.#publish({
      message,
      progress: normalizeProgress(progress),
      stage,
      state: 'loading',
    });
  }

  /** Publish a monotonic progress update for the current run. */
  report(update: FlxLoadingUpdate): void {
    this.#assertActive();
    const requested =
      update.progress === undefined
        ? this.#snapshot.progress
        : normalizeProgress(update.progress);
    const progress = monotonicProgress(this.#snapshot.progress, requested);
    this.#publish({
      message: update.message ?? this.#snapshot.message,
      progress,
      stage: update.stage ?? this.#snapshot.stage,
      state: 'loading',
    });
  }

  /** Run a custom operation mapped into a range of overall progress. */
  async task<T>(
    options: FlxLoadingTaskOptions,
    action: (context: FlxLoadingTaskContext) => Promise<T> | T,
  ): Promise<T> {
    this.#assertActive();
    const start = clamp01(
      options.startProgress ?? this.#snapshot.progress ?? 0,
    );
    const end = clamp01(options.endProgress ?? 1);
    const stage = options.stage ?? 'custom';
    this.report({ message: options.message, progress: start, stage });
    const result = await action({
      report: (progress, message) => {
        this.report({
          ...(message === undefined ? {} : { message }),
          progress: start + (end - start) * clamp01(progress),
          stage,
        });
      },
      signal: this.signal,
    });
    this.#assertActive();
    this.report({ progress: end, stage });
    return result;
  }

  /** Load a Pixi asset bundle while publishing its progress. */
  async loadBundle<T = Record<string, unknown>>(
    assets: FlxAssets,
    name: string | string[],
    options: FlxLoadingBundleOptions,
  ): Promise<T> {
    return this.task<T>(
      { ...options, stage: options.stage ?? 'assets' },
      async ({ report, signal }) => {
        throwIfAborted(signal);
        const result = await assets.loadBundle<T>(name, (progress) => {
          report(progress);
        });
        throwIfAborted(signal);
        return result;
      },
    );
  }

  /** Publish a retryable or terminal failure. */
  fail(error: FlxLoadingError, retry?: () => void): void {
    if (this.signal.aborted) return;
    this.#publish({
      error,
      message: error.message,
      progress: this.#snapshot.progress,
      ...(retry === undefined ? {} : { retry }),
      stage: error.stage,
      state: 'error',
    });
  }

  /** Mark the current run ready. */
  complete(message = 'Ready!'): void {
    this.#assertActive();
    this.#publish({
      message,
      progress: 1,
      stage: 'complete',
      state: 'ready',
    });
  }

  /** Abort pending application-level work and publish cancellation. */
  cancel(message = 'Loading cancelled.'): void {
    if (this.signal.aborted) return;
    this.#controller.abort();
    this.#publish({
      message,
      progress: this.#snapshot.progress,
      stage: this.#snapshot.stage,
      state: 'cancelled',
    });
  }

  destroy(): void {
    this.cancel();
    this.#listeners.clear();
    this.#parentSignal?.removeEventListener('abort', this.#onParentAbort);
  }

  #assertActive(): void {
    throwIfAborted(this.signal);
  }

  #publish(snapshot: FlxLoadingSnapshot): void {
    this.#snapshot = Object.freeze(snapshot);
    for (const listener of [...this.#listeners]) listener(this.#snapshot);
  }
}

/** Throws a browser-standard abort error when a loading signal is cancelled. @public */
export function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw new DOMException('The loading operation was aborted.', 'AbortError');
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeProgress(progress: number | null): number | null {
  return progress === null ? null : clamp01(progress);
}

function monotonicProgress(
  current: number | null,
  requested: number | null,
): number | null {
  if (requested === null) return null;
  return current === null ? requested : Math.max(current, requested);
}
