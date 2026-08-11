import type { FlxCamera } from '../core/flx-camera';
import { getDomViewport } from '../input/flx-dom-viewport';
import { FlxPoint } from '../math/flx-point';
import { FlxButton } from '../objects/flx-button';
import { FlxInputText } from '../objects/flx-input-text';
import type { FlxSprite } from '../objects/flx-sprite';
import type { FlxCameraRenderer } from '../rendering/flx-camera-renderer';

interface AccessibleButtonEntry {
  readonly element: HTMLButtonElement;
}

interface AccessibleInputEntry {
  composing: boolean;
  domVersion: number;
  readonly element: HTMLInputElement | HTMLTextAreaElement;
  focusCommandVersion: number;
  selectionCommandVersion: number;
}

function cssColor(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, '0')}`;
}

/** Native semantic controls projected over camera-rendered Flixel UI. @internal */
export class FlxAccessibilityOverlay {
  readonly #host: HTMLElement;
  readonly #canvas: HTMLCanvasElement;
  readonly #renderer: FlxCameraRenderer;
  readonly #logicalWidth: number;
  readonly #logicalHeight: number;
  readonly #root: HTMLDivElement;
  readonly #buttonEntries = new Map<FlxButton, AccessibleButtonEntry>();
  readonly #inputEntries = new Map<FlxInputText, AccessibleInputEntry>();
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
    const desiredButtons = new Set<FlxButton>();
    const desiredInputs = new Set<FlxInputText>();
    for (const object of this.#renderer.registeredObjects) {
      if (object instanceof FlxButton && object.accessibleLabel !== null) {
        desiredButtons.add(object);
        const entry =
          this.#buttonEntries.get(object) ?? this.#createButtonEntry(object);
        this.#syncButtonEntry(object, entry.element);
      } else if (object instanceof FlxInputText) {
        desiredInputs.add(object);
        const entry =
          this.#inputEntries.get(object) ?? this.#createInputEntry(object);
        this.#syncInputEntry(object, entry);
      }
    }
    for (const [button, entry] of this.#buttonEntries) {
      if (desiredButtons.has(button)) continue;
      entry.element.remove();
      this.#buttonEntries.delete(button);
    }
    for (const [input, entry] of this.#inputEntries) {
      if (desiredInputs.has(input)) continue;
      input.setDomPresentationActive(false);
      entry.element.remove();
      this.#inputEntries.delete(input);
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#buttonEntries.clear();
    for (const input of this.#inputEntries.keys()) {
      input.setDomPresentationActive(false);
    }
    this.#inputEntries.clear();
    this.#root.remove();
    if (this.#changedHostPosition) {
      this.#host.style.position = this.#originalHostPosition;
      this.#changedHostPosition = false;
    }
  }

  #createButtonEntry(button: FlxButton): AccessibleButtonEntry {
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
    this.#buttonEntries.set(button, entry);
    return entry;
  }

  #syncButtonEntry(button: FlxButton, element: HTMLButtonElement): void {
    const camera = this.#findCamera(button);
    const visible =
      camera !== null && button.exists && button.visible && button.alpha > 0;
    element.hidden = !visible;
    element.disabled = !button.enabled;
    element.tabIndex = button.tabIndex;
    element.setAttribute('aria-label', button.accessibleLabel ?? button.text);
    if (!visible || camera === null) return;

    this.#positionElement(button, element, camera);
  }

  #createInputEntry(input: FlxInputText): AccessibleInputEntry {
    const element = input.multiline
      ? document.createElement('textarea')
      : document.createElement('input');
    if (element instanceof HTMLInputElement) element.type = input.type;
    element.className = 'flx-accessible-input';
    element.dataset.flxInputText = '';
    element.autocomplete = 'off';
    element.spellcheck = false;
    element.value = input.text;
    element.style.cssText = [
      'position:absolute',
      'box-sizing:border-box',
      'margin:0',
      'outline:none',
      'overflow:hidden',
      'pointer-events:auto',
      'resize:none',
    ].join(';');
    const entry: AccessibleInputEntry = {
      composing: false,
      domVersion: input.domVersion,
      element,
      focusCommandVersion: -1,
      selectionCommandVersion: -1,
    };
    element.addEventListener('input', () => {
      input.queueDomEdit(
        element.value,
        element.selectionStart ?? element.value.length,
        element.selectionEnd ?? element.value.length,
      );
    });
    element.addEventListener('select', () => {
      input.queueDomSelection(
        element.selectionStart ?? 0,
        element.selectionEnd ?? 0,
      );
    });
    element.addEventListener('focus', () => input.queueDomFocus(true));
    element.addEventListener('blur', () => input.queueDomFocus(false));
    element.addEventListener('compositionstart', () => {
      entry.composing = true;
      input.queueDomComposition(true);
    });
    element.addEventListener('compositionend', () => {
      entry.composing = false;
      input.queueDomComposition(false);
      input.queueDomEdit(
        element.value,
        element.selectionStart ?? element.value.length,
        element.selectionEnd ?? element.value.length,
      );
    });
    element.addEventListener('keydown', (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (
        keyboardEvent.key === 'Enter' &&
        !keyboardEvent.repeat &&
        !input.multiline &&
        !entry.composing
      ) {
        keyboardEvent.preventDefault();
        input.queueDomSubmit();
      }
    });
    this.#root.appendChild(element);
    this.#inputEntries.set(input, entry);
    input.setDomPresentationActive(true);
    return entry;
  }

  #syncInputEntry(input: FlxInputText, entry: AccessibleInputEntry): void {
    const { element } = entry;
    const camera = this.#findCamera(input);
    const visible =
      camera !== null && input.exists && input.visible && input.alpha > 0;
    input.setDomPresentationActive(true);
    element.hidden = !visible;
    element.disabled = !input.enabled;
    element.readOnly = !input.editable;
    element.tabIndex = input.tabIndex;
    element.setAttribute('aria-label', input.accessibleLabel);
    element.placeholder = input.placeholder;
    element.inputMode = input.inputMode;
    if (element instanceof HTMLInputElement && element.type !== input.type) {
      element.type = input.type;
    }
    if (input.maxLength > 0) element.maxLength = input.maxLength;
    else element.removeAttribute('maxlength');

    if (entry.domVersion !== input.domVersion && !entry.composing) {
      element.value = input.text;
      entry.domVersion = input.domVersion;
    }
    if (entry.selectionCommandVersion !== input.selectionCommandVersion) {
      try {
        element.setSelectionRange(input.selectionStart, input.selectionEnd);
      } catch {
        // Some semantic input types (for example email) do not expose ranges.
      }
      entry.selectionCommandVersion = input.selectionCommandVersion;
    }
    if (entry.focusCommandVersion !== input.focusCommandVersion) {
      if (input.domFocusRequested) element.focus({ preventScroll: true });
      else element.blur();
      entry.focusCommandVersion = input.focusCommandVersion;
    }
    if (!visible || camera === null) return;

    const scale = this.#positionElement(input, element, camera);
    element.style.background = cssColor(input.backgroundColor);
    element.style.border = `${Math.max(1, scale)}px solid ${cssColor(input.focused ? input.focusedBorderColor : input.inputBorderColor)}`;
    element.style.borderRadius = `${3 * scale}px`;
    element.style.caretColor = cssColor(input.color);
    element.style.color = cssColor(input.color);
    element.style.fontFamily = input.font;
    element.style.fontSize = `${input.size * scale}px`;
    element.style.lineHeight = `${Math.max(input.size * 1.2, 1) * scale}px`;
    element.style.opacity = `${input.alpha}`;
    element.style.padding = `${2 * scale}px ${4 * scale}px`;
  }

  #positionElement(
    object: FlxSprite,
    element: HTMLElement,
    camera: FlxCamera,
  ): number {
    const viewport = getDomViewport(
      this.#canvas,
      this.#logicalWidth,
      this.#logicalHeight,
    );
    const overlayBounds = this.#root.getBoundingClientRect();
    const corners = [
      this.#screenPoint(object.x, object.y, object, camera),
      this.#screenPoint(object.x + object.width, object.y, object, camera),
      this.#screenPoint(object.x, object.y + object.height, object, camera),
      this.#screenPoint(
        object.x + object.width,
        object.y + object.height,
        object,
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
    return Math.min(
      ((right - left) * viewport.scaleX) / object.width,
      ((bottom - top) * viewport.scaleY) / object.height,
    );
  }

  #findCamera(object: FlxSprite): FlxCamera | null {
    const cameras = object.cameras ?? [];
    const candidates = cameras.length > 0 ? cameras : this.#contextCameras();
    return (
      candidates.find(
        (camera) => camera.exists && camera.visible && object.onScreen(camera),
      ) ?? null
    );
  }

  #contextCameras(): readonly FlxCamera[] {
    return this.#renderer.cameras;
  }

  #screenPoint(
    x: number,
    y: number,
    object: FlxSprite,
    camera: FlxCamera,
  ): FlxPoint {
    return camera.worldToScreen(
      {
        x: x + camera.scroll.x * (1 - object.scrollFactor.x),
        y: y + camera.scroll.y * (1 - object.scrollFactor.y),
      },
      new FlxPoint(),
    );
  }
}
