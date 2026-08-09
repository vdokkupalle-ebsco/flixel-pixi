import type { FlxCamera } from '../core/flx-camera';
import { getDomViewport } from '../input/flx-dom-viewport';
import { FlxPoint } from '../math/flx-point';
import { FlxButton } from '../objects/flx-button';
import type { FlxCameraRenderer } from '../rendering/flx-camera-renderer';

interface AccessibleButtonEntry {
  readonly element: HTMLButtonElement;
}

/** Native semantic controls projected over camera-rendered Flixel UI. @internal */
export class FlxAccessibilityOverlay {
  readonly #host: HTMLElement;
  readonly #canvas: HTMLCanvasElement;
  readonly #renderer: FlxCameraRenderer;
  readonly #logicalWidth: number;
  readonly #logicalHeight: number;
  readonly #root: HTMLDivElement;
  readonly #entries = new Map<FlxButton, AccessibleButtonEntry>();
  readonly #originalHostPosition: string;
  #changedHostPosition = false;
  #destroyed = false;

  constructor(
    host: HTMLElement,
    canvas: HTMLCanvasElement,
    renderer: FlxCameraRenderer,
    logicalWidth: number,
    logicalHeight: number,
  ) {
    this.#host = host;
    this.#canvas = canvas;
    this.#renderer = renderer;
    this.#logicalWidth = logicalWidth;
    this.#logicalHeight = logicalHeight;
    this.#originalHostPosition = host.style.position;
    const hostPosition = getComputedStyle(host).position;
    if (hostPosition === '' || hostPosition === 'static') {
      host.style.position = 'relative';
      this.#changedHostPosition = true;
    }
    this.#root = document.createElement('div');
    this.#root.className = 'flx-accessibility-overlay';
    this.#root.style.cssText =
      'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:999';
    host.appendChild(this.#root);
    this.sync();
  }

  sync(): void {
    if (this.#destroyed) return;
    const desired = new Set<FlxButton>();
    for (const object of this.#renderer.registeredObjects) {
      if (!(object instanceof FlxButton) || object.accessibleLabel === null) {
        continue;
      }
      desired.add(object);
      const entry = this.#entries.get(object) ?? this.#createEntry(object);
      this.#syncEntry(object, entry.element);
    }
    for (const [button, entry] of this.#entries) {
      if (desired.has(button)) continue;
      entry.element.remove();
      this.#entries.delete(button);
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#entries.clear();
    this.#root.remove();
    if (this.#changedHostPosition) {
      this.#host.style.position = this.#originalHostPosition;
      this.#changedHostPosition = false;
    }
  }

  #createEntry(button: FlxButton): AccessibleButtonEntry {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'flx-accessible-button';
    element.dataset.flxAccessibleButton = '';
    element.style.cssText = [
      'position:absolute',
      'margin:0',
      'padding:0',
      'border:0',
      'opacity:0',
      'pointer-events:none',
    ].join(';');
    element.addEventListener('focus', () => {
      button.queueAccessibilityFocus(true);
    });
    element.addEventListener('blur', () => {
      button.queueAccessibilityFocus(false);
    });
    element.addEventListener('click', () => {
      button.queueAccessibilityActivation();
    });
    this.#root.appendChild(element);
    const entry = { element };
    this.#entries.set(button, entry);
    return entry;
  }

  #syncEntry(button: FlxButton, element: HTMLButtonElement): void {
    const camera = this.#findCamera(button);
    const visible =
      camera !== null && button.exists && button.visible && button.alpha > 0;
    element.hidden = !visible;
    element.disabled = !button.enabled;
    element.tabIndex = button.tabIndex;
    element.setAttribute('aria-label', button.accessibleLabel ?? button.text);
    if (!visible || camera === null) return;

    const viewport = getDomViewport(
      this.#canvas,
      this.#logicalWidth,
      this.#logicalHeight,
    );
    const overlayBounds = this.#root.getBoundingClientRect();
    const corners = [
      this.#screenPoint(button.x, button.y, button, camera),
      this.#screenPoint(button.x + button.width, button.y, button, camera),
      this.#screenPoint(button.x, button.y + button.height, button, camera),
      this.#screenPoint(
        button.x + button.width,
        button.y + button.height,
        button,
        camera,
      ),
    ];
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    element.style.left = `${viewport.left - overlayBounds.left + left * viewport.scaleX}px`;
    element.style.top = `${viewport.top - overlayBounds.top + top * viewport.scaleY}px`;
    element.style.width = `${Math.max(1, (right - left) * viewport.scaleX)}px`;
    element.style.height = `${Math.max(1, (bottom - top) * viewport.scaleY)}px`;
  }

  #findCamera(button: FlxButton): FlxCamera | null {
    const cameras = button.cameras ?? [];
    const candidates = cameras.length > 0 ? cameras : this.#contextCameras();
    return (
      candidates.find(
        (camera) => camera.exists && camera.visible && button.onScreen(camera),
      ) ?? null
    );
  }

  #contextCameras(): readonly FlxCamera[] {
    return this.#renderer.cameras;
  }

  #screenPoint(
    x: number,
    y: number,
    button: FlxButton,
    camera: FlxCamera,
  ): FlxPoint {
    return camera.worldToScreen(
      {
        x: x + camera.scroll.x * (1 - button.scrollFactor.x),
        y: y + camera.scroll.y * (1 - button.scrollFactor.y),
      },
      new FlxPoint(),
    );
  }
}
