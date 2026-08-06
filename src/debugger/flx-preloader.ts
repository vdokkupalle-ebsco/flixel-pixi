/** Options for FlxPreloader. @public */
export interface FlxPreloaderOptions {
  /** Title shown in the loading screen. Defaults to 'Loading…' */
  title?: string;
  /** Element to mount the preloader inside. Defaults to document.body. */
  container?: HTMLElement;
}

/** State of the preloader. @public */
export type PreloaderState = 'loading' | 'ready' | 'error';

/**
 * Accessible HTML loading screen shown during asset loading.
 * Dismissed automatically when `complete()` is called.
 * @public
 */
export class FlxPreloader {
  readonly #root: HTMLDivElement;
  readonly #progressEl: HTMLProgressElement;
  readonly #statusEl: HTMLParagraphElement;
  readonly #retryBtn: HTMLButtonElement;
  #state: PreloaderState = 'loading';
  #onRetry: (() => void) | null = null;

  constructor(options: FlxPreloaderOptions = {}) {
    const { title = 'Loading…', container = document.body } = options;

    this.#root = document.createElement('div');
    this.#root.setAttribute('role', 'status');
    this.#root.setAttribute('aria-live', 'polite');
    this.#root.setAttribute('aria-label', 'Game loading screen');
    this.#root.setAttribute('data-testid', 'flx-preloader');
    this.#root.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'background:#0f172a', 'color:#f8fafc',
      'font-family:system-ui,sans-serif', 'gap:1rem',
      'transition:opacity 0.4s ease',
    ].join(';');

    // Title
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.cssText = 'font-size:1.5rem;font-weight:700;margin:0;color:#38bdf8';
    this.#root.appendChild(titleEl);

    // Progress bar
    this.#progressEl = document.createElement('progress');
    this.#progressEl.setAttribute('aria-label', 'Loading progress');
    this.#progressEl.max = 100;
    this.#progressEl.value = 0;
    this.#progressEl.style.cssText = [
      'width:320px', 'height:8px', 'border-radius:4px',
      'appearance:none', '-webkit-appearance:none',
      'background:#1e293b', 'accent-color:#38bdf8',
    ].join(';');
    this.#root.appendChild(this.#progressEl);

    // Status text
    this.#statusEl = document.createElement('p');
    this.#statusEl.textContent = 'Initializing…';
    this.#statusEl.style.cssText = 'font-size:0.875rem;color:#94a3b8;margin:0';
    this.#root.appendChild(this.#statusEl);

    // Retry button (hidden initially)
    this.#retryBtn = document.createElement('button');
    this.#retryBtn.textContent = 'Retry';
    this.#retryBtn.setAttribute('type', 'button');
    this.#retryBtn.setAttribute('aria-label', 'Retry loading');
    this.#retryBtn.style.cssText = [
      'display:none', 'padding:0.5rem 1.5rem',
      'background:#38bdf8', 'color:#0f172a',
      'border:none', 'border-radius:6px',
      'font-size:1rem', 'font-weight:600',
      'cursor:pointer',
    ].join(';');
    this.#retryBtn.addEventListener('click', () => {
      this.#onRetry?.();
    });
    this.#root.appendChild(this.#retryBtn);

    container.appendChild(this.#root);
  }

  get state(): PreloaderState {
    return this.#state;
  }

  /** Updates progress 0–100 and optional status text. */
  setProgress(percent: number, statusText?: string): void {
    this.#progressEl.value = Math.max(0, Math.min(100, percent));
    if (statusText !== undefined) this.#statusEl.textContent = statusText;
  }

  /** Registers a callback for when the retry button is clicked. */
  onRetry(handler: () => void): void {
    this.#onRetry = handler;
  }

  /** Marks loading as complete and fades out the preloader. */
  complete(): void {
    this.#state = 'ready';
    this.#progressEl.value = 100;
    this.#statusEl.textContent = 'Ready!';
    this.#root.style.opacity = '0';
    this.#root.style.pointerEvents = 'none';
    setTimeout(() => {
      this.destroy();
    }, 450);
  }

  /** Shows the retry button with an error message. */
  showError(message: string): void {
    this.#state = 'error';
    this.#statusEl.textContent = message;
    this.#statusEl.style.color = '#f87171';
    this.#retryBtn.style.display = 'block';
  }

  /** Removes the preloader from the DOM. */
  destroy(): void {
    this.#root.remove();
    this.#onRetry = null;
  }
}
