import {
  FlxLoadingError,
  type FlxLoadingSnapshot,
} from '../loading/flx-loading';

/** Theme tokens used by the default DOM preloader. @public */
export interface FlxPreloaderTheme {
  accent?: string;
  background?: string;
  error?: string;
  mutedText?: string;
  text?: string;
}

/** Options for the default DOM preloader. @public */
export interface FlxPreloaderOptions {
  /** Optional CSS class names applied to the root element. */
  className?: string;
  /** Element to mount the preloader inside. Defaults to document.body. */
  container?: HTMLElement;
  /** Optional content rendered below the status and actions. */
  footer?: () => HTMLElement;
  /** Optional content rendered before the title. Keep boot branding inline/local. */
  header?: () => HTMLElement;
  /** Minimum time to retain an already-visible preloader. Defaults to 0. */
  minimumVisibleMs?: number;
  /** Whether the preloader covers its host or the viewport. */
  placement?: 'host' | 'viewport';
  /** Progress presentation. Defaults to a bar. */
  progress?: 'bar' | 'spinner' | 'none';
  /** Accessible retry button label. Defaults to 'Retry'. */
  retryLabel?: string;
  /** Delay before mounting, preventing flashes on fast boots. Defaults to 0. */
  showDelayMs?: number;
  /** Optional supporting text shown below the title. */
  subtitle?: string;
  /** Visual theme overrides exposed as CSS custom properties. */
  theme?: FlxPreloaderTheme;
  /** Title shown in the loading screen. Defaults to 'Loading…'. */
  title?: string;
  /** Fade duration after completion. Defaults to 400 ms. */
  transitionMs?: number;
}

/** State of the preloader. @public */
export type PreloaderState = 'loading' | 'ready' | 'error' | 'cancelled';

/** Replaceable presentation driven by a shared loading session. @public */
export interface FlxPreloaderView {
  complete(): Promise<void>;
  destroy(): void;
  update(snapshot: FlxLoadingSnapshot): void;
}

/** Context passed to a custom bootstrap-preloader factory. @public */
export interface FlxPreloaderViewContext {
  readonly container: HTMLElement;
  readonly options: FlxPreloaderOptions;
}

/** Creates a custom DOM-first bootstrap preloader. @public */
export type FlxPreloaderViewFactory = (
  context: FlxPreloaderViewContext,
) => FlxPreloaderView;

/**
 * Accessible, customizable HTML loading view.
 * Dismissed automatically when a ready snapshot is received.
 * @public
 */
export class FlxPreloader implements FlxPreloaderView {
  readonly #container: HTMLElement;
  readonly #minimumVisibleMs: number;
  readonly #placement: 'host' | 'viewport';
  readonly #progressMode: 'bar' | 'spinner' | 'none';
  readonly #root: HTMLDivElement;
  readonly #progressEl: HTMLProgressElement;
  readonly #spinnerEl: HTMLDivElement;
  readonly #statusEl: HTMLParagraphElement;
  readonly #retryBtn: HTMLButtonElement;
  readonly #transitionMs: number;
  readonly #originalContainerPosition: string;
  #changedContainerPosition = false;
  #finishPromise: Promise<void> | null = null;
  #mountedAt = 0;
  #onRetry: (() => void) | null = null;
  #showTimer: ReturnType<typeof setTimeout> | null = null;
  #state: PreloaderState = 'loading';

  constructor(options: FlxPreloaderOptions = {}) {
    const {
      className,
      container = document.body,
      footer,
      header,
      minimumVisibleMs = 0,
      placement = container === document.body ? 'viewport' : 'host',
      progress = 'bar',
      retryLabel = 'Retry',
      showDelayMs = 0,
      subtitle,
      theme = {},
      title = 'Loading…',
      transitionMs = 400,
    } = options;
    const reducedMotion = prefersReducedMotion();

    this.#container = container;
    this.#minimumVisibleMs = Math.max(0, minimumVisibleMs);
    this.#placement = placement;
    this.#progressMode = progress;
    this.#transitionMs = reducedMotion ? 0 : Math.max(0, transitionMs);
    this.#originalContainerPosition = container.style.position;

    this.#root = document.createElement('div');
    this.#root.className = 'flx-preloader';
    if (className) {
      this.#root.classList.add(
        ...className.split(/\s+/).filter((part) => part.length > 0),
      );
    }
    this.#root.setAttribute('role', 'status');
    this.#root.setAttribute('aria-live', 'polite');
    this.#root.setAttribute('aria-label', 'Game loading screen');
    this.#root.setAttribute('aria-busy', 'true');
    this.#root.setAttribute('data-testid', 'flx-preloader');
    this.#root.style.cssText = [
      `position:${placement === 'viewport' ? 'fixed' : 'absolute'}`,
      'inset:0',
      'z-index:9999',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'box-sizing:border-box',
      'padding:1.5rem',
      'background:var(--flx-preloader-background,#0f172a)',
      'color:var(--flx-preloader-text,#f8fafc)',
      'font-family:system-ui,sans-serif',
      'gap:1rem',
      `transition:opacity ${this.#transitionMs}ms ease`,
    ].join(';');
    applyTheme(this.#root, theme);

    if (header) {
      const headerEl = header();
      headerEl.classList.add('flx-preloader__brand');
      this.#root.appendChild(headerEl);
    }

    const titleEl = document.createElement('h1');
    titleEl.className = 'flx-preloader__title';
    titleEl.textContent = title;
    titleEl.style.cssText = [
      'font-size:1.5rem',
      'font-weight:700',
      'margin:0',
      'color:var(--flx-preloader-accent,#38bdf8)',
      'text-align:center',
    ].join(';');
    this.#root.appendChild(titleEl);

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'flx-preloader__subtitle';
      subtitleEl.textContent = subtitle;
      subtitleEl.style.cssText =
        'font-size:0.875rem;color:var(--flx-preloader-muted,#94a3b8);margin:0;text-align:center';
      this.#root.appendChild(subtitleEl);
    }

    this.#progressEl = document.createElement('progress');
    this.#progressEl.className = 'flx-preloader__progress';
    this.#progressEl.setAttribute('aria-label', 'Loading progress');
    this.#progressEl.max = 100;
    this.#progressEl.value = 0;
    this.#progressEl.style.cssText = [
      `display:${progress === 'bar' ? 'block' : 'none'}`,
      'width:min(320px,100%)',
      'height:8px',
      'border-radius:4px',
      'appearance:none',
      '-webkit-appearance:none',
      'background:#1e293b',
      'accent-color:var(--flx-preloader-accent,#38bdf8)',
    ].join(';');
    this.#root.appendChild(this.#progressEl);

    this.#spinnerEl = document.createElement('div');
    this.#spinnerEl.className = 'flx-preloader__spinner';
    this.#spinnerEl.setAttribute('aria-hidden', 'true');
    this.#spinnerEl.style.cssText = [
      `display:${progress === 'spinner' ? 'block' : 'none'}`,
      'width:28px',
      'height:28px',
      'border:3px solid var(--flx-preloader-muted,#94a3b8)',
      'border-top-color:var(--flx-preloader-accent,#38bdf8)',
      'border-radius:50%',
      `animation:${reducedMotion ? 'none' : 'flx-preloader-spin 0.8s linear infinite'}`,
    ].join(';');
    this.#root.appendChild(this.#spinnerEl);

    const styleEl = document.createElement('style');
    styleEl.textContent =
      '@keyframes flx-preloader-spin{to{transform:rotate(360deg)}}';
    this.#root.appendChild(styleEl);

    this.#statusEl = document.createElement('p');
    this.#statusEl.className = 'flx-preloader__status';
    this.#statusEl.textContent = 'Initializing…';
    this.#statusEl.style.cssText =
      'font-size:0.875rem;color:var(--flx-preloader-muted,#94a3b8);margin:0;text-align:center';
    this.#root.appendChild(this.#statusEl);

    const actionsEl = document.createElement('div');
    actionsEl.className = 'flx-preloader__actions';
    this.#retryBtn = document.createElement('button');
    this.#retryBtn.className = 'flx-preloader__retry';
    this.#retryBtn.textContent = retryLabel;
    this.#retryBtn.setAttribute('type', 'button');
    this.#retryBtn.setAttribute('aria-label', retryLabel);
    this.#retryBtn.style.cssText = [
      'display:none',
      'padding:0.5rem 1.5rem',
      'background:var(--flx-preloader-accent,#38bdf8)',
      'color:var(--flx-preloader-background,#0f172a)',
      'border:none',
      'border-radius:6px',
      'font-size:1rem',
      'font-weight:600',
      'cursor:pointer',
    ].join(';');
    this.#retryBtn.addEventListener('click', this.#handleRetry);
    actionsEl.appendChild(this.#retryBtn);
    this.#root.appendChild(actionsEl);

    if (footer) {
      const footerEl = footer();
      footerEl.classList.add('flx-preloader__footer');
      this.#root.appendChild(footerEl);
    }

    if (showDelayMs <= 0) {
      this.#mount();
    } else {
      this.#showTimer = setTimeout(() => {
        this.#showTimer = null;
        if (this.#state === 'loading' || this.#state === 'error') this.#mount();
      }, showDelayMs);
    }
  }

  get state(): PreloaderState {
    return this.#state;
  }

  /** Render one snapshot from a shared loading session. */
  update(snapshot: FlxLoadingSnapshot): void {
    if (snapshot.state === 'ready') {
      void this.complete();
      return;
    }
    if (snapshot.state === 'cancelled') {
      this.#state = 'cancelled';
      this.destroy();
      return;
    }

    this.#state = snapshot.state === 'error' ? 'error' : 'loading';
    this.#statusEl.textContent = snapshot.message;
    this.#statusEl.style.color =
      snapshot.state === 'error'
        ? 'var(--flx-preloader-error,#f87171)'
        : 'var(--flx-preloader-muted,#94a3b8)';
    this.#root.setAttribute(
      'aria-busy',
      snapshot.state === 'loading' ? 'true' : 'false',
    );

    if (this.#progressMode === 'bar') {
      if (snapshot.progress === null) {
        this.#progressEl.removeAttribute('value');
      } else {
        this.#progressEl.value = snapshot.progress * 100;
      }
    }

    this.#onRetry = snapshot.retry ?? null;
    this.#retryBtn.disabled = false;
    this.#retryBtn.style.display = snapshot.retry ? 'block' : 'none';
    if (snapshot.state === 'error') {
      this.#mount();
      if (snapshot.retry) this.#retryBtn.focus();
    }
  }

  /** Legacy imperative progress API. Prefer `update(snapshot)` for new code. */
  setProgress(percent: number, statusText?: string): void {
    this.update({
      message: statusText ?? this.#statusEl.textContent ?? 'Loading…',
      progress: Math.max(0, Math.min(100, percent)) / 100,
      stage: 'custom',
      state: 'loading',
    });
  }

  /** Legacy retry registration API. */
  onRetry(handler: () => void): void {
    this.#onRetry = handler;
  }

  /** Marks loading as complete and removes the preloader after its transition. */
  complete(): Promise<void> {
    this.#finishPromise ??= this.#finish();
    return this.#finishPromise;
  }

  /** Legacy error API. Prefer an error snapshot for new code. */
  showError(message: string): void {
    this.update({
      error: new FlxLoadingError('custom', message, this.#onRetry !== null),
      message,
      progress: null,
      ...(this.#onRetry === null ? {} : { retry: this.#onRetry }),
      stage: 'custom',
      state: 'error',
    });
  }

  /** Removes the preloader from the DOM and releases its handlers. */
  destroy(): void {
    if (this.#showTimer !== null) {
      clearTimeout(this.#showTimer);
      this.#showTimer = null;
    }
    this.#retryBtn.removeEventListener('click', this.#handleRetry);
    this.#root.remove();
    this.#onRetry = null;
    if (this.#changedContainerPosition) {
      this.#container.style.position = this.#originalContainerPosition;
      this.#changedContainerPosition = false;
    }
  }

  readonly #handleRetry = (): void => {
    const retry = this.#onRetry;
    if (!retry) return;
    this.#retryBtn.disabled = true;
    retry();
  };

  #mount(): void {
    if (this.#root.isConnected) return;
    if (
      this.#placement === 'host' &&
      getComputedStyle(this.#container).position === 'static'
    ) {
      this.#container.style.position = 'relative';
      this.#changedContainerPosition = true;
    }
    this.#container.appendChild(this.#root);
    this.#mountedAt = Date.now();
  }

  async #finish(): Promise<void> {
    this.#state = 'ready';
    this.#root.setAttribute('aria-busy', 'false');
    this.#progressEl.value = 100;
    this.#statusEl.textContent = 'Ready!';
    this.#retryBtn.style.display = 'none';
    if (this.#showTimer !== null) {
      clearTimeout(this.#showTimer);
      this.#showTimer = null;
    }
    if (!this.#root.isConnected) {
      this.destroy();
      return;
    }

    const visibleFor = Date.now() - this.#mountedAt;
    const remaining = Math.max(0, this.#minimumVisibleMs - visibleFor);
    if (remaining > 0) await delay(remaining);
    this.#root.style.opacity = '0';
    this.#root.style.pointerEvents = 'none';
    if (this.#transitionMs > 0) await delay(this.#transitionMs);
    this.destroy();
  }
}

function applyTheme(root: HTMLElement, theme: FlxPreloaderTheme): void {
  const values: [string, string | undefined][] = [
    ['--flx-preloader-background', theme.background],
    ['--flx-preloader-accent', theme.accent],
    ['--flx-preloader-text', theme.text],
    ['--flx-preloader-muted', theme.mutedText],
    ['--flx-preloader-error', theme.error],
  ];
  for (const [name, value] of values) {
    if (value !== undefined) root.style.setProperty(name, value);
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
