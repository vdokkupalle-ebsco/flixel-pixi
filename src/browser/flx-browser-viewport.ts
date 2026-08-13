import { clamp } from '../math/flx-math';

/** Browser presentation modes that preserve a fixed logical game size. @public */
export type FlxBrowserScaleMode = 'fill' | 'fit' | 'fixed' | 'integer';

/** Per-edge spacing used by browser-safe layout. @public */
export interface FlxBrowserViewportInsets {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

/** Immutable rectangle expressed in logical game coordinates. @public */
export interface FlxBrowserViewportRect {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

/** Developer-defined logical padding inside the visible viewport. @public */
export type FlxBrowserSafePadding = number | Partial<FlxBrowserViewportInsets>;

/** Configuration for the browser canvas presentation policy. @public */
export interface FlxBrowserScaleOptions {
  /** How the logical canvas is fitted into its host. Defaults to `fit`. */
  mode?: FlxBrowserScaleMode;
  /** Horizontal placement inside the host, from 0 (left) to 1 (right). */
  alignX?: number;
  /** Vertical placement inside the host, from 0 (top) to 1 (bottom). */
  alignY?: number;
  /** Force nearest-neighbor browser scaling. Defaults to true for integer mode. */
  pixelated?: boolean;
  /** Additional logical padding applied to the recommended HUD boundary. */
  safePadding?: FlxBrowserSafePadding;
  /** Include CSS environment safe-area insets. Defaults to true. */
  useSafeAreaInsets?: boolean;
}

/** Resolved CSS-space placement of a logical game canvas. @public */
export interface FlxBrowserViewportSnapshot {
  /** Current browser device-pixel ratio. */
  readonly devicePixelRatio: number;
  readonly displayHeight: number;
  readonly displayWidth: number;
  /** Whether this viewport's host owns browser fullscreen. */
  readonly fullscreen: boolean;
  readonly hostHeight: number;
  readonly hostWidth: number;
  readonly left: number;
  /** Entire fixed logical game area. */
  readonly logicalRect: FlxBrowserViewportRect;
  readonly mode: FlxBrowserScaleMode;
  /** Recommended HUD area after crop, device insets, and configured padding. */
  readonly safeRect: FlxBrowserViewportRect;
  /** Effective CSS-pixel device insets overlapping this host. */
  readonly safeAreaInsets: FlxBrowserViewportInsets;
  /** Configured logical HUD padding. */
  readonly safePadding: FlxBrowserViewportInsets;
  readonly scale: number;
  readonly top: number;
  /** Uncropped portion of the logical game currently visible in the host. */
  readonly visibleRect: FlxBrowserViewportRect;
}

interface FlxBrowserViewportLayoutOptions {
  alignX: number;
  alignY: number;
  hostHeight: number;
  hostWidth: number;
  logicalHeight: number;
  logicalWidth: number;
  mode: FlxBrowserScaleMode;
  devicePixelRatio?: number;
  fullscreen?: boolean;
  safeAreaInsets?: FlxBrowserViewportInsets;
  safePadding?: FlxBrowserViewportInsets;
}

/** @internal */
export function resolveBrowserViewportLayout(
  options: FlxBrowserViewportLayoutOptions,
): FlxBrowserViewportSnapshot {
  const {
    alignX,
    alignY,
    hostHeight,
    hostWidth,
    logicalHeight,
    logicalWidth,
    mode,
    devicePixelRatio = 1,
    fullscreen = false,
    safeAreaInsets = ZERO_INSETS,
    safePadding = ZERO_INSETS,
  } = options;
  assertPositiveFinite('logical width', logicalWidth);
  assertPositiveFinite('logical height', logicalHeight);
  assertNonNegativeFinite('host width', hostWidth);
  assertNonNegativeFinite('host height', hostHeight);
  assertAlignment('alignX', alignX);
  assertAlignment('alignY', alignY);
  assertPositiveFinite('device pixel ratio', devicePixelRatio);
  assertInsets('safe-area insets', safeAreaInsets);
  assertInsets('safe padding', safePadding);

  const fitScale =
    hostWidth === 0 || hostHeight === 0
      ? 1
      : Math.min(hostWidth / logicalWidth, hostHeight / logicalHeight);
  let scale: number;
  switch (mode) {
    case 'fill':
      scale =
        hostWidth === 0 || hostHeight === 0
          ? 1
          : Math.max(hostWidth / logicalWidth, hostHeight / logicalHeight);
      break;
    case 'fit':
      scale = fitScale;
      break;
    case 'fixed':
      scale = 1;
      break;
    case 'integer':
      scale = Math.max(1, Math.floor(fitScale));
      break;
  }

  const displayWidth = logicalWidth * scale;
  const displayHeight = logicalHeight * scale;
  const left = (hostWidth - displayWidth) * alignX;
  const top = (hostHeight - displayHeight) * alignY;
  const logicalRect = makeRect(0, 0, logicalWidth, logicalHeight);
  const visibleRect = logicalRectFromCssBounds(
    left,
    top,
    scale,
    0,
    0,
    hostWidth,
    hostHeight,
    logicalWidth,
    logicalHeight,
  );
  const safeVisibleRect = logicalRectFromCssBounds(
    left,
    top,
    scale,
    safeAreaInsets.left,
    safeAreaInsets.top,
    Math.max(safeAreaInsets.left, hostWidth - safeAreaInsets.right),
    Math.max(safeAreaInsets.top, hostHeight - safeAreaInsets.bottom),
    logicalWidth,
    logicalHeight,
  );
  const safeLeft = Math.min(
    safeVisibleRect.right,
    safeVisibleRect.left + safePadding.left,
  );
  const safeTop = Math.min(
    safeVisibleRect.bottom,
    safeVisibleRect.top + safePadding.top,
  );
  const safeRight = Math.max(
    safeLeft,
    safeVisibleRect.right - safePadding.right,
  );
  const safeBottom = Math.max(
    safeTop,
    safeVisibleRect.bottom - safePadding.bottom,
  );
  return {
    devicePixelRatio,
    displayHeight,
    displayWidth,
    fullscreen,
    hostHeight,
    hostWidth,
    left,
    logicalRect,
    mode,
    safeAreaInsets: { ...safeAreaInsets },
    safePadding: { ...safePadding },
    safeRect: makeRect(
      safeLeft,
      safeTop,
      safeRight - safeLeft,
      safeBottom - safeTop,
    ),
    scale,
    top,
    visibleRect,
  };
}

const ZERO_INSETS: FlxBrowserViewportInsets = {
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
};

function makeRect(
  x: number,
  y: number,
  width: number,
  height: number,
): FlxBrowserViewportRect {
  return {
    bottom: y + height,
    height,
    left: x,
    right: x + width,
    top: y,
    width,
    x,
    y,
  };
}

function logicalRectFromCssBounds(
  canvasLeft: number,
  canvasTop: number,
  scale: number,
  cssLeft: number,
  cssTop: number,
  cssRight: number,
  cssBottom: number,
  logicalWidth: number,
  logicalHeight: number,
): FlxBrowserViewportRect {
  const left = clamp((cssLeft - canvasLeft) / scale, 0, logicalWidth);
  const top = clamp((cssTop - canvasTop) / scale, 0, logicalHeight);
  const right = clamp((cssRight - canvasLeft) / scale, left, logicalWidth);
  const bottom = clamp((cssBottom - canvasTop) / scale, top, logicalHeight);
  return makeRect(left, top, right - left, bottom - top);
}

/**
 * Owns CSS-space canvas sizing while the renderer keeps a stable logical size.
 * Pointer and accessibility projection use the resulting canvas bounds.
 * @public
 */
export class FlxBrowserViewport {
  #alignX: number;
  #alignY: number;
  readonly #canvas: HTMLCanvasElement;
  readonly #host: HTMLElement;
  readonly #logicalHeight: number;
  readonly #logicalWidth: number;
  readonly #observer: ResizeObserver | null;
  readonly #pixelated: boolean | undefined;
  readonly #safeAreaProbe: HTMLDivElement | null;
  readonly #useSafeAreaInsets: boolean;
  #destroyed = false;
  #dprQuery: MediaQueryList | null = null;
  #listeners = new Set<(snapshot: FlxBrowserViewportSnapshot) => void>();
  #mode: FlxBrowserScaleMode;
  #safePadding: FlxBrowserViewportInsets;
  #snapshot: FlxBrowserViewportSnapshot;

  constructor(
    host: HTMLElement,
    canvas: HTMLCanvasElement,
    logicalWidth: number,
    logicalHeight: number,
    options: FlxBrowserScaleMode | FlxBrowserScaleOptions = 'fit',
  ) {
    const resolved = typeof options === 'string' ? { mode: options } : options;
    this.#host = host;
    this.#canvas = canvas;
    this.#logicalWidth = logicalWidth;
    this.#logicalHeight = logicalHeight;
    this.#mode = resolved.mode ?? 'fit';
    this.#alignX = resolved.alignX ?? 0.5;
    this.#alignY = resolved.alignY ?? 0.5;
    this.#pixelated = resolved.pixelated;
    this.#safePadding = resolveInsets(resolved.safePadding);
    this.#useSafeAreaInsets = resolved.useSafeAreaInsets ?? true;
    this.#safeAreaProbe = this.#useSafeAreaInsets
      ? createSafeAreaProbe(host)
      : null;
    this.#snapshot = this.#resolveSnapshot();

    canvas.style.cssText = [
      'display:block',
      'max-width:none',
      'object-fit:fill',
      'position:relative',
    ].join(';');
    this.#apply(this.#snapshot);
    this.#observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => this.refresh());
    this.#observer?.observe(host);
    document.addEventListener('fullscreenchange', this.#handleFullscreen);
    window.addEventListener('orientationchange', this.#handleWindowResize);
    window.addEventListener('resize', this.#handleWindowResize);
    this.#bindDprQuery();
  }

  get mode(): FlxBrowserScaleMode {
    return this.#mode;
  }

  get snapshot(): FlxBrowserViewportSnapshot {
    return this.#snapshot;
  }

  get fullscreen(): boolean {
    return document.fullscreenElement === this.#host;
  }

  /** Subscribe to layout changes and immediately receive the current snapshot. */
  onChange(
    listener: (snapshot: FlxBrowserViewportSnapshot) => void,
  ): () => void {
    this.#assertUsable();
    this.#listeners.add(listener);
    listener(this.#snapshot);
    return () => this.#listeners.delete(listener);
  }

  /** Recalculate placement immediately after an application-controlled layout change. */
  refresh(): FlxBrowserViewportSnapshot {
    this.#assertUsable();
    const previous = this.#snapshot;
    this.#snapshot = this.#resolveSnapshot();
    this.#apply(this.#snapshot);
    if (!snapshotsEqual(previous, this.#snapshot)) {
      for (const listener of [...this.#listeners]) listener(this.#snapshot);
    }
    return this.#snapshot;
  }

  /** Change presentation policy without rebuilding Pixi or game state. */
  setMode(mode: FlxBrowserScaleMode): FlxBrowserViewportSnapshot {
    this.#assertUsable();
    this.#mode = mode;
    return this.refresh();
  }

  /** Change canvas placement within the host without rebuilding game state. */
  setAlignment(alignX: number, alignY: number): FlxBrowserViewportSnapshot {
    this.#assertUsable();
    assertAlignment('alignX', alignX);
    assertAlignment('alignY', alignY);
    this.#alignX = alignX;
    this.#alignY = alignY;
    return this.refresh();
  }

  /** Update developer-defined logical padding inside the visible area. */
  setSafePadding(padding: FlxBrowserSafePadding): FlxBrowserViewportSnapshot {
    this.#assertUsable();
    this.#safePadding = resolveInsets(padding);
    return this.refresh();
  }

  /** Present the host element fullscreen and refresh its canvas placement. */
  async requestFullscreen(): Promise<void> {
    this.#assertUsable();
    if (this.fullscreen) return;
    if (this.#host.requestFullscreen === undefined) {
      throw new Error('Fullscreen is not supported by this browser.');
    }
    await this.#host.requestFullscreen();
    this.refresh();
  }

  /** Leave fullscreen when this viewport currently owns it. */
  async exitFullscreen(): Promise<void> {
    this.#assertUsable();
    if (!this.fullscreen) return;
    await document.exitFullscreen();
    this.refresh();
  }

  /** Toggle fullscreen presentation for this viewport's host. */
  async toggleFullscreen(): Promise<void> {
    if (this.fullscreen) await this.exitFullscreen();
    else await this.requestFullscreen();
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#observer?.disconnect();
    this.#dprQuery?.removeEventListener('change', this.#handleDprChange);
    this.#dprQuery = null;
    this.#listeners.clear();
    this.#safeAreaProbe?.remove();
    document.removeEventListener('fullscreenchange', this.#handleFullscreen);
    window.removeEventListener('orientationchange', this.#handleWindowResize);
    window.removeEventListener('resize', this.#handleWindowResize);
  }

  readonly #handleWindowResize = (): void => {
    this.refresh();
  };

  readonly #handleFullscreen = (): void => {
    this.refresh();
  };

  readonly #handleDprChange = (): void => {
    this.#bindDprQuery();
    this.refresh();
  };

  #bindDprQuery(): void {
    this.#dprQuery?.removeEventListener('change', this.#handleDprChange);
    this.#dprQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
        : null;
    this.#dprQuery?.addEventListener('change', this.#handleDprChange);
  }

  #resolveSnapshot(): FlxBrowserViewportSnapshot {
    return resolveBrowserViewportLayout({
      alignX: this.#alignX,
      alignY: this.#alignY,
      devicePixelRatio: window.devicePixelRatio,
      fullscreen: this.fullscreen,
      hostHeight: this.#host.clientHeight,
      hostWidth: this.#host.clientWidth,
      logicalHeight: this.#logicalHeight,
      logicalWidth: this.#logicalWidth,
      mode: this.#mode,
      safeAreaInsets: this.#readEffectiveSafeAreaInsets(),
      safePadding: this.#safePadding,
    });
  }

  #readEffectiveSafeAreaInsets(): FlxBrowserViewportInsets {
    const probe = this.#safeAreaProbe;
    if (probe === null) return ZERO_INSETS;
    const style = getComputedStyle(probe);
    const deviceInsets = {
      bottom: cssPixels(style.paddingBottom),
      left: cssPixels(style.paddingLeft),
      right: cssPixels(style.paddingRight),
      top: cssPixels(style.paddingTop),
    };
    const bounds = this.#host.getBoundingClientRect();
    return {
      bottom:
        deviceInsets.bottom === 0
          ? 0
          : Math.max(
              0,
              bounds.bottom - (window.innerHeight - deviceInsets.bottom),
            ),
      left:
        deviceInsets.left === 0
          ? 0
          : Math.max(0, deviceInsets.left - bounds.left),
      right:
        deviceInsets.right === 0
          ? 0
          : Math.max(
              0,
              bounds.right - (window.innerWidth - deviceInsets.right),
            ),
      top:
        deviceInsets.top === 0 ? 0 : Math.max(0, deviceInsets.top - bounds.top),
    };
  }

  #apply(snapshot: FlxBrowserViewportSnapshot): void {
    this.#canvas.style.width = `${snapshot.displayWidth}px`;
    this.#canvas.style.height = `${snapshot.displayHeight}px`;
    this.#canvas.style.left = `${snapshot.left}px`;
    this.#canvas.style.top = `${snapshot.top}px`;
    this.#canvas.style.imageRendering =
      (this.#pixelated ?? snapshot.mode === 'integer') ? 'pixelated' : 'auto';
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('FlxBrowserViewport is destroyed.');
  }
}

function assertPositiveFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

function assertNonNegativeFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number.`);
  }
}

function assertAlignment(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be between 0 and 1.`);
  }
}

function assertInsets(label: string, insets: FlxBrowserViewportInsets): void {
  for (const [edge, value] of Object.entries(insets)) {
    assertNonNegativeFinite(`${label} ${edge}`, value);
  }
}

function resolveInsets(
  value: FlxBrowserSafePadding | undefined,
): FlxBrowserViewportInsets {
  const insets =
    typeof value === 'number'
      ? { bottom: value, left: value, right: value, top: value }
      : {
          bottom: value?.bottom ?? 0,
          left: value?.left ?? 0,
          right: value?.right ?? 0,
          top: value?.top ?? 0,
        };
  assertInsets('safe padding', insets);
  return insets;
}

function createSafeAreaProbe(parent: HTMLElement): HTMLDivElement {
  const probe = parent.ownerDocument.createElement('div');
  probe.dataset.flxSafeAreaProbe = '';
  probe.style.cssText = [
    'position:fixed',
    'width:0',
    'height:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top,0px)',
    'padding-right:env(safe-area-inset-right,0px)',
    'padding-bottom:env(safe-area-inset-bottom,0px)',
    'padding-left:env(safe-area-inset-left,0px)',
  ].join(';');
  parent.appendChild(probe);
  return probe;
}

function cssPixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function snapshotsEqual(
  left: FlxBrowserViewportSnapshot,
  right: FlxBrowserViewportSnapshot,
): boolean {
  return (
    left.devicePixelRatio === right.devicePixelRatio &&
    left.displayHeight === right.displayHeight &&
    left.displayWidth === right.displayWidth &&
    left.fullscreen === right.fullscreen &&
    left.hostHeight === right.hostHeight &&
    left.hostWidth === right.hostWidth &&
    left.left === right.left &&
    left.mode === right.mode &&
    rectsEqual(left.safeRect, right.safeRect) &&
    insetsEqual(left.safeAreaInsets, right.safeAreaInsets) &&
    insetsEqual(left.safePadding, right.safePadding) &&
    left.scale === right.scale &&
    left.top === right.top &&
    rectsEqual(left.visibleRect, right.visibleRect)
  );
}

function insetsEqual(
  left: FlxBrowserViewportInsets,
  right: FlxBrowserViewportInsets,
): boolean {
  return (
    left.bottom === right.bottom &&
    left.left === right.left &&
    left.right === right.right &&
    left.top === right.top
  );
}

function rectsEqual(
  left: FlxBrowserViewportRect,
  right: FlxBrowserViewportRect,
): boolean {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}
