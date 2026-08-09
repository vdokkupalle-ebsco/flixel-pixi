/** Screen corner used by the lightweight FPS overlay. @public */
export type FlxFpsDisplayPosition =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Theme tokens for the lightweight FPS overlay. @public */
export interface FlxFpsDisplayTheme {
  background?: string;
  critical?: string;
  good?: string;
  text?: string;
  warning?: string;
}

/** Options for {@link FlxFpsDisplay}. @public */
export interface FlxFpsDisplayOptions {
  /** Optional CSS class names applied to the root element. */
  className?: string;
  /** Overlay host. Defaults to document.body. */
  container?: HTMLElement;
  /** Whether positioning is relative to the host or viewport. */
  placement?: 'host' | 'viewport';
  /** Compact shows FPS only; detailed also shows frame pacing and update cadence. */
  mode?: 'compact' | 'detailed';
  /** Screen corner. Defaults to top-right. */
  position?: FlxFpsDisplayPosition;
  /** Optional expected FPS used to color the reading. */
  targetFramerate?: number;
  /** Visual theme overrides exposed as CSS custom properties. */
  theme?: FlxFpsDisplayTheme;
  /** Sampling window in milliseconds. Defaults to 500. */
  updateIntervalMs?: number;
}

/** Metrics from the most recently completed FPS sampling window. @public */
export interface FlxFpsMetrics {
  /** Mean wall-clock interval between rendered frames. */
  readonly averageFrameMS: number;
  /** Renders preceded by two or more fixed updates. */
  readonly catchUpFrames: number;
  /** Mean completed render frames per second. */
  readonly fps: number;
  /** Frames slower than 1.5 times the target frame interval. */
  readonly jankFrames: number;
  /** Slowest frame interval in the sampling window. */
  readonly maxFrameMS: number;
  /** 95th percentile frame interval in the sampling window. */
  readonly p95FrameMS: number;
  /** Fixed simulation updates completed per second. */
  readonly updatesPerSecond: number;
  /** Renders preceded by no fixed update. */
  readonly zeroStepFrames: number;
}

const EMPTY_METRICS: FlxFpsMetrics = Object.freeze({
  averageFrameMS: 0,
  catchUpFrames: 0,
  fps: 0,
  jankFrames: 0,
  maxFrameMS: 0,
  p95FrameMS: 0,
  updatesPerSecond: 0,
  zeroStepFrames: 0,
});

/** Small dependency-free DOM display for render FPS and frame pacing. @public */
export class FlxFpsDisplay {
  readonly #container: HTMLElement;
  readonly #originalContainerPosition: string;
  readonly #root: HTMLDivElement;
  readonly #mode: 'compact' | 'detailed';
  readonly #targetFramerate: number | undefined;
  readonly #updateIntervalMs: number;
  readonly #value: HTMLSpanElement;
  #changedContainerPosition = false;
  #elapsedMS = 0;
  #frameTimes: number[] = [];
  #frameCount = 0;
  #metrics = EMPTY_METRICS;
  #simulationSteps = 0;
  #zeroStepFrames = 0;
  #catchUpFrames = 0;

  constructor(options: FlxFpsDisplayOptions = {}) {
    const {
      className,
      container = document.body,
      mode = 'detailed',
      placement = container === document.body ? 'viewport' : 'host',
      position = 'top-right',
      targetFramerate,
      theme = {},
      updateIntervalMs = 500,
    } = options;
    validatePositive('updateIntervalMs', updateIntervalMs);
    if (targetFramerate !== undefined) {
      validatePositive('targetFramerate', targetFramerate);
    }

    this.#container = container;
    this.#mode = mode;
    this.#originalContainerPosition = container.style.position;
    this.#targetFramerate = targetFramerate;
    this.#updateIntervalMs = updateIntervalMs;

    this.#root = document.createElement('div');
    this.#root.className = `flx-fps-display flx-fps-display--${position}`;
    if (className) {
      this.#root.classList.add(
        ...className.split(/\s+/).filter((part) => part.length > 0),
      );
    }
    this.#root.setAttribute('aria-label', 'Game performance');
    this.#root.setAttribute('data-testid', 'flx-fps-display');
    this.#root.style.cssText = [
      `position:${placement === 'viewport' ? 'fixed' : 'absolute'}`,
      ...positionStyles(position),
      'z-index:1000',
      'pointer-events:none',
      'padding:0.3rem 0.45rem',
      'border:1px solid color-mix(in srgb,var(--flx-fps-text,#e2e8f0) 18%,transparent)',
      'border-radius:0.3rem',
      'background:var(--flx-fps-background,rgba(2,6,23,0.82))',
      'color:var(--flx-fps-text,#e2e8f0)',
      'font:600 0.75rem/1 ui-monospace,SFMono-Regular,Consolas,monospace',
      'font-variant-numeric:tabular-nums',
      'white-space:pre',
      'box-shadow:0 1px 4px rgba(0,0,0,0.25)',
    ].join(';');
    applyTheme(this.#root, theme);

    this.#value = document.createElement('span');
    this.#value.className = 'flx-fps-display__value';
    this.#value.textContent = '— FPS';
    this.#root.appendChild(this.#value);

    const containerPosition = getComputedStyle(container).position;
    if (
      placement === 'host' &&
      (containerPosition === '' || containerPosition === 'static')
    ) {
      container.style.position = 'relative';
      this.#changedContainerPosition = true;
    }
    container.appendChild(this.#root);
  }

  get fps(): number {
    return this.#metrics.fps;
  }

  /** Metrics from the most recently completed sampling window. */
  get metrics(): FlxFpsMetrics {
    return this.#metrics;
  }

  /** Clear collected samples, such as after returning from a background tab. */
  reset(): void {
    this.#elapsedMS = 0;
    this.#frameTimes = [];
    this.#frameCount = 0;
    this.#metrics = EMPTY_METRICS;
    this.#simulationSteps = 0;
    this.#zeroStepFrames = 0;
    this.#catchUpFrames = 0;
    this.#value.textContent = '— FPS';
    delete this.#root.dataset.rating;
    this.#root.style.color = 'var(--flx-fps-text,#e2e8f0)';
  }

  /** Record one completed render and the fixed updates executed before it. */
  recordFrame(elapsedMS: number, simulationSteps = 1): void {
    if (!Number.isFinite(elapsedMS) || elapsedMS < 0) return;
    if (!Number.isFinite(simulationSteps) || simulationSteps < 0) return;
    const completedSteps = Math.floor(simulationSteps);
    this.#frameCount += 1;
    this.#elapsedMS += elapsedMS;
    this.#frameTimes.push(elapsedMS);
    this.#simulationSteps += completedSteps;
    if (completedSteps === 0) this.#zeroStepFrames += 1;
    if (completedSteps > 1) this.#catchUpFrames += 1;
    if (this.#elapsedMS < this.#updateIntervalMs) return;

    const sortedFrameTimes = [...this.#frameTimes].sort(
      (left, right) => left - right,
    );
    const fps = (this.#frameCount * 1000) / this.#elapsedMS;
    const targetFrameMS = 1000 / (this.#targetFramerate ?? 60);
    const p95Index = Math.max(0, Math.ceil(sortedFrameTimes.length * 0.95) - 1);
    this.#metrics = Object.freeze({
      averageFrameMS: this.#elapsedMS / this.#frameCount,
      catchUpFrames: this.#catchUpFrames,
      fps,
      jankFrames: this.#frameTimes.filter(
        (frameMS) => frameMS > targetFrameMS * 1.5,
      ).length,
      maxFrameMS: sortedFrameTimes.at(-1) ?? 0,
      p95FrameMS: sortedFrameTimes[p95Index] ?? 0,
      updatesPerSecond: (this.#simulationSteps * 1000) / this.#elapsedMS,
      zeroStepFrames: this.#zeroStepFrames,
    });
    this.#value.textContent = this.#formatMetrics();
    this.#applyRating();
    this.#frameCount = 0;
    this.#elapsedMS = 0;
    this.#frameTimes = [];
    this.#simulationSteps = 0;
    this.#zeroStepFrames = 0;
    this.#catchUpFrames = 0;
  }

  destroy(): void {
    this.#root.remove();
    if (this.#changedContainerPosition) {
      this.#container.style.position = this.#originalContainerPosition;
      this.#changedContainerPosition = false;
    }
  }

  #applyRating(): void {
    if (this.#targetFramerate === undefined) return;
    const ratio = this.#metrics.fps / this.#targetFramerate;
    const targetFrameMS = 1000 / this.#targetFramerate;
    const rating =
      ratio < 0.6 || this.#metrics.p95FrameMS > targetFrameMS * 2
        ? 'critical'
        : ratio < 0.9 || this.#metrics.jankFrames > 0
          ? 'warning'
          : 'good';
    this.#root.dataset.rating = rating;
    this.#root.style.color = `var(--flx-fps-${rating})`;
  }

  #formatMetrics(): string {
    const metrics = this.#metrics;
    const fps = `${Math.round(metrics.fps)} FPS`;
    if (this.#mode === 'compact') return fps;
    return [
      `${fps} · ${metrics.averageFrameMS.toFixed(1)} ms`,
      `P95 ${metrics.p95FrameMS.toFixed(1)} · MAX ${metrics.maxFrameMS.toFixed(1)} · JANK ${metrics.jankFrames}`,
      `UPS ${Math.round(metrics.updatesPerSecond)} · IDLE ${metrics.zeroStepFrames} · CATCH ${metrics.catchUpFrames}`,
    ].join('\n');
  }
}

function applyTheme(root: HTMLElement, theme: FlxFpsDisplayTheme): void {
  const values = {
    background: theme.background,
    critical: theme.critical,
    good: theme.good,
    text: theme.text,
    warning: theme.warning,
  };
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined) root.style.setProperty(`--flx-fps-${name}`, value);
  }
  root.style.setProperty('--flx-fps-good', theme.good ?? '#4ade80');
  root.style.setProperty('--flx-fps-warning', theme.warning ?? '#facc15');
  root.style.setProperty('--flx-fps-critical', theme.critical ?? '#f87171');
}

function positionStyles(position: FlxFpsDisplayPosition): string[] {
  const vertical = position.startsWith('top') ? 'top:0.5rem' : 'bottom:0.5rem';
  const horizontal = position.endsWith('right')
    ? 'right:0.5rem'
    : 'left:0.5rem';
  return [vertical, horizontal];
}

function validatePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
