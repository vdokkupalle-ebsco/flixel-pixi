import { getDomViewport } from '../input/flx-dom-viewport';
import type { PointLike } from '../math/flx-point';
import type { FlxObject } from '../objects/flx-object';
import type {
  FlxCameraObjectPick,
  FlxCameraRenderer,
} from '../rendering/flx-camera-renderer';
import type { FlxWatch } from './flx-watch';

/** Pointer modifier required to activate debugger picking. @public */
export type FlxObjectInspectorModifier =
  'alt' | 'control' | 'meta' | 'shift' | false;

/** Configuration for the optional pointer object inspector. @public */
export interface FlxObjectInspectorOptions {
  readonly logicalHeight: number;
  readonly logicalWidth: number;
  /** Defaults to Alt so normal game input remains untouched. */
  readonly modifier?: FlxObjectInspectorModifier;
  readonly onSelectionChange?: (selection: FlxCameraObjectPick | null) => void;
  /** Selected objects are exposed as read-only fields when supplied. */
  readonly watch?: FlxWatch;
}

/**
 * Optional debugger adapter for CPU-authoritative pointer selection.
 * It never relies on Pixi hit testing and only intercepts matching debug clicks.
 * @public
 */
export class FlxObjectInspector {
  enabled = true;

  readonly #renderer: FlxCameraRenderer;
  readonly #logicalHeight: number;
  readonly #logicalWidth: number;
  readonly #modifier: FlxObjectInspectorModifier;
  readonly #onSelectionChange:
    ((selection: FlxCameraObjectPick | null) => void) | undefined;
  readonly #watch: FlxWatch | undefined;
  readonly #attachments = new Set<HTMLElement>();
  #removeTrackedSelection: (() => void) | null = null;
  #selection: FlxCameraObjectPick | null = null;
  #destroyed = false;

  constructor(renderer: FlxCameraRenderer, options: FlxObjectInspectorOptions) {
    if (!Number.isFinite(options.logicalWidth) || options.logicalWidth <= 0) {
      throw new RangeError('Inspector logicalWidth must be positive.');
    }
    if (!Number.isFinite(options.logicalHeight) || options.logicalHeight <= 0) {
      throw new RangeError('Inspector logicalHeight must be positive.');
    }
    this.#renderer = renderer;
    this.#logicalWidth = options.logicalWidth;
    this.#logicalHeight = options.logicalHeight;
    this.#modifier = options.modifier ?? 'alt';
    this.#onSelectionChange = options.onSelectionChange;
    this.#watch = options.watch;
  }

  get selection(): FlxCameraObjectPick | null {
    return this.#selection;
  }

  get selectedObject(): FlxObject | null {
    return this.#selection?.object ?? null;
  }

  /** Selects the topmost object at a logical game-screen coordinate. */
  selectAt(point: Readonly<PointLike>): FlxCameraObjectPick | null {
    this.#assertUsable();
    const selection = this.#renderer.pickObject(point);
    this.#setSelection(selection);
    return selection;
  }

  clear(): void {
    this.#assertUsable();
    this.#setSelection(null);
  }

  /** Attaches Alt+pointer selection to a letterboxed or scaled game element. */
  attach(target: HTMLElement): () => void {
    this.#assertUsable();
    if (this.#attachments.has(target)) return () => this.detach(target);
    this.#attachments.add(target);
    target.addEventListener('pointerdown', this.#onPointerDown, true);
    return () => this.detach(target);
  }

  detach(target: HTMLElement): void {
    if (!this.#attachments.delete(target)) return;
    target.removeEventListener('pointerdown', this.#onPointerDown, true);
  }

  destroy(): void {
    if (this.#destroyed) return;
    for (const target of [...this.#attachments]) this.detach(target);
    this.#setSelection(null);
    this.#destroyed = true;
  }

  readonly #onPointerDown = (event: PointerEvent): void => {
    if (
      !this.enabled ||
      event.button !== 0 ||
      !hasModifier(event, this.#modifier)
    ) {
      return;
    }
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const viewport = getDomViewport(
      target,
      this.#logicalWidth,
      this.#logicalHeight,
    );
    if (viewport.scaleX <= 0 || viewport.scaleY <= 0) return;
    const point = {
      x: (event.clientX - viewport.left) / viewport.scaleX,
      y: (event.clientY - viewport.top) / viewport.scaleY,
    };
    event.preventDefault();
    event.stopImmediatePropagation();
    this.selectAt(point);
  };

  #setSelection(selection: FlxCameraObjectPick | null): void {
    if (
      this.#selection?.object === selection?.object &&
      this.#selection?.camera === selection?.camera
    ) {
      this.#selection = selection;
      this.#onSelectionChange?.(selection);
      return;
    }
    this.#removeTrackedSelection?.();
    this.#removeTrackedSelection = null;
    this.#selection = selection;
    this.#renderer.selectedObject = selection?.object ?? null;
    if (selection && this.#watch) {
      this.#removeTrackedSelection = this.#watch.trackObject(
        'selection',
        selection.object,
        ['x', 'y', 'width', 'height'],
      );
    }
    this.#onSelectionChange?.(selection);
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('Object inspector is destroyed.');
  }
}

function hasModifier(
  event: PointerEvent,
  modifier: FlxObjectInspectorModifier,
): boolean {
  if (modifier === false) return true;
  if (modifier === 'alt') return event.altKey;
  if (modifier === 'control') return event.ctrlKey;
  if (modifier === 'meta') return event.metaKey;
  return event.shiftKey;
}
