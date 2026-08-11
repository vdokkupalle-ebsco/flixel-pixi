import { FlxG } from '../core/flx-g';
import { FlxGroup } from '../core/flx-group';
import type {
  FlxActions,
  FlxActionVirtualButtonAxisSource,
} from '../input/flx-actions';
import {
  FlxVirtualButton,
  type FlxVirtualButtonOptions,
} from './flx-virtual-button';

/** Direction layouts compatible with the common HaxeFlixel virtual-pad modes. @public */
export type FlxVirtualDPadMode = 'none' | 'up-down' | 'left-right' | 'full';

/** Action-button layouts for a virtual pad. @public */
export type FlxVirtualActionMode = 'none' | 'a' | 'a-b';

/** Layout and naming options for {@link FlxVirtualPad}. @public */
export interface FlxVirtualPadOptions extends FlxVirtualButtonOptions {
  readonly gap?: number;
  readonly idPrefix?: string;
  readonly margin?: number;
}

/** Optional logical action names bound by {@link FlxVirtualPad.bindActions}. @public */
export interface FlxVirtualPadActionMap {
  readonly A?: string;
  readonly B?: string;
  readonly down?: string;
  readonly left?: string;
  readonly right?: string;
  readonly up?: string;
}

/** Optional scalar action names bound from the pad's directional pairs. @public */
export interface FlxVirtualPadAxisMap {
  readonly horizontal?: string;
  readonly vertical?: string;
}

/** HUD-aligned collection of deterministic direction and action buttons. @public */
export class FlxVirtualPad extends FlxGroup<FlxVirtualButton> {
  readonly up: FlxVirtualButton | null;
  readonly down: FlxVirtualButton | null;
  readonly left: FlxVirtualButton | null;
  readonly right: FlxVirtualButton | null;
  readonly A: FlxVirtualButton | null;
  readonly B: FlxVirtualButton | null;

  constructor(
    dpadMode: FlxVirtualDPadMode = 'full',
    actionMode: FlxVirtualActionMode = 'a-b',
    options: FlxVirtualPadOptions = {},
  ) {
    super();
    const size = options.size ?? 52;
    const gap = options.gap ?? 6;
    const margin = options.margin ?? 16;
    const idPrefix = options.idPrefix ?? 'virtual-pad';
    if (!['none', 'up-down', 'left-right', 'full'].includes(dpadMode)) {
      throw new RangeError(`Unknown virtual D-pad mode "${dpadMode}".`);
    }
    if (!['none', 'a', 'a-b'].includes(actionMode)) {
      throw new RangeError(`Unknown virtual action mode "${actionMode}".`);
    }
    if (!Number.isFinite(size) || size <= 0) {
      throw new RangeError(
        'Virtual button size must be a positive finite number.',
      );
    }
    if (!Number.isFinite(gap) || gap < 0) {
      throw new RangeError(
        'Virtual pad gap must be a non-negative finite number.',
      );
    }
    if (!Number.isFinite(margin) || margin < 0) {
      throw new RangeError(
        'Virtual pad margin must be a non-negative finite number.',
      );
    }

    const buttonOptions = { ...options, size };
    const bottom = FlxG.height - margin - size;
    const centerX = margin + size + gap;
    const centerY = bottom - size - gap;
    const make = (
      name: 'up' | 'down' | 'left' | 'right' | 'A' | 'B',
      x: number,
      y: number,
      label: string,
      accessibleLabel: string,
    ): FlxVirtualButton => {
      const button = new FlxVirtualButton(`${idPrefix}.${name}`, x, y, label, {
        ...buttonOptions,
        accessibleLabel,
      });
      this.add(button);
      return button;
    };

    this.up =
      dpadMode === 'full' || dpadMode === 'up-down'
        ? make('up', centerX, centerY - size - gap, '▲', 'Move up')
        : null;
    this.down =
      dpadMode === 'full' || dpadMode === 'up-down'
        ? make('down', centerX, centerY + size + gap, '▼', 'Move down')
        : null;
    this.left =
      dpadMode === 'full' || dpadMode === 'left-right'
        ? make('left', centerX - size - gap, centerY, '◀', 'Move left')
        : null;
    this.right =
      dpadMode === 'full' || dpadMode === 'left-right'
        ? make('right', centerX + size + gap, centerY, '▶', 'Move right')
        : null;

    const actionX = FlxG.width - margin - size;
    this.A =
      actionMode === 'a' || actionMode === 'a-b'
        ? make('A', actionX, bottom, 'A', 'Action A')
        : null;
    this.B =
      actionMode === 'a-b'
        ? make('B', actionX - size - gap, bottom - size - gap, 'B', 'Action B')
        : null;
  }

  getButton(
    id: 'up' | 'down' | 'left' | 'right' | 'A' | 'B',
  ): FlxVirtualButton | null {
    return this[id];
  }

  /** Add this pad's sources to an existing keyboard/gamepad action map. */
  bindActions(actions: FlxActions, map: FlxVirtualPadActionMap): this {
    for (const id of ['up', 'down', 'left', 'right', 'A', 'B'] as const) {
      const button = this[id];
      const action = map[id];
      if (button !== null && action !== undefined) {
        actions.addSource(action, button.source);
      }
    }
    return this;
  }

  /** Add horizontal/vertical scalar sources when both direction buttons exist. */
  bindAxes(actions: FlxActions, map: FlxVirtualPadAxisMap): this {
    if (
      map.horizontal !== undefined &&
      this.left !== null &&
      this.right !== null
    ) {
      actions.addSource(
        map.horizontal,
        this.#axisSource(this.left, this.right),
      );
    }
    if (map.vertical !== undefined && this.up !== null && this.down !== null) {
      actions.addSource(map.vertical, this.#axisSource(this.up, this.down));
    }
    return this;
  }

  #axisSource(
    negative: FlxVirtualButton,
    positive: FlxVirtualButton,
  ): FlxActionVirtualButtonAxisSource {
    return {
      device: 'virtual-button-axis',
      negative: negative.virtualInputId,
      positive: positive.virtualInputId,
    };
  }
}
