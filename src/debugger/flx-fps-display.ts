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
  /** Screen corner. Defaults to top-right. */
  position?: FlxFpsDisplayPosition;
  /** Optional expected FPS used to color the reading. */
  targetFramerate?: number;
  /** Visual theme overrides exposed as CSS custom properties. */
  theme?: FlxFpsDisplayTheme;
  /** Sampling window in milliseconds. Defaults to 500. */
  updateIntervalMs?: number;
}

/** Small dependency-free DOM display for completed engine render FPS. @public */
export class FlxFpsDisplay {
  readonly #container: HTMLElement;
  readonly #originalContainerPosition: string;
  readonly #root: HTMLDivElement;
  readonly #targetFramerate: number | undefined;
  readonly #updateIntervalMs: number;
  readonly #value: HTMLSpanElement;
  #changedContainerPosition = false;
  #elapsedMS = 0;
  #frameCount = 0;
  #fps = 0;

  constructor(options: FlxFpsDisplayOptions = {}) {
    const {
      className,
      container = document.body,
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
    return this.#fps;
  }

  /** Clear collected samples, such as after returning from a background tab. */
  reset(): void {
    this.#elapsedMS = 0;
    this.#frameCount = 0;
    this.#fps = 0;
    this.#value.textContent = '— FPS';
    delete this.#root.dataset.rating;
    this.#root.style.color = 'var(--flx-fps-text,#e2e8f0)';
  }

  /** Record one completed rendered frame and its wall-clock interval. */
  recordFrame(elapsedMS: number): void {
    if (!Number.isFinite(elapsedMS) || elapsedMS < 0) return;
    this.#frameCount += 1;
    this.#elapsedMS += elapsedMS;
    if (this.#elapsedMS < this.#updateIntervalMs) return;

    this.#fps = (this.#frameCount * 1000) / this.#elapsedMS;
    this.#value.textContent = `${Math.round(this.#fps)} FPS`;
    this.#applyRating();
    this.#frameCount = 0;
    this.#elapsedMS = 0;
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
    const ratio = this.#fps / this.#targetFramerate;
    const rating =
      ratio >= 0.9 ? 'good' : ratio >= 0.6 ? 'warning' : 'critical';
    this.#root.dataset.rating = rating;
    this.#root.style.color = `var(--flx-fps-${rating})`;
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
