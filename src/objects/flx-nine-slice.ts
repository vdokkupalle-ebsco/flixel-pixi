import type { BLEND_MODES, Texture } from 'pixi.js';

import type { NineSliceSprite } from 'pixi.js';

/** Insets for one 9-slice texture region. @public */
export interface FlxNineSliceBorders {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Partial border insets accepted by {@link FlxNineSliceSprite}. @public */
export interface FlxNineSliceBorderInput {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

/** Gameplay object fields needed to sync a Pixi `NineSliceSprite`. @internal */
export interface FlxNineSliceLike {
  readonly antialiasing: boolean;
  readonly alpha: number;
  readonly blend: BLEND_MODES | null;
  readonly bottomHeight: number;
  readonly color: number;
  readonly exists: boolean;
  readonly height: number;
  readonly leftWidth: number;
  readonly offset: { x: number; y: number };
  readonly origin: { x: number; y: number };
  readonly rightWidth: number;
  readonly scale: { x: number; y: number };
  readonly topHeight: number;
  readonly visible: boolean;
  readonly width: number;
  renderTexture: Texture;
}

export function defaultNineSliceBorders(
  textureWidth: number,
  textureHeight: number,
): FlxNineSliceBorders {
  const inset = Math.max(
    1,
    Math.min(10, Math.floor(Math.min(textureWidth, textureHeight) / 4)),
  );
  return {
    bottom: inset,
    left: inset,
    right: inset,
    top: inset,
  };
}

export function resolveNineSliceBorders(
  input: FlxNineSliceBorderInput | undefined,
  textureWidth: number,
  textureHeight: number,
): FlxNineSliceBorders {
  const fallback = defaultNineSliceBorders(textureWidth, textureHeight);
  return {
    bottom: input?.bottom ?? fallback.bottom,
    left: input?.left ?? fallback.left,
    right: input?.right ?? fallback.right,
    top: input?.top ?? fallback.top,
  };
}

export function validateNineSliceBorders(
  borders: FlxNineSliceBorders,
  textureWidth: number,
  textureHeight: number,
  displayWidth: number,
  displayHeight: number,
): void {
  if (
    borders.left <= 0 ||
    borders.top <= 0 ||
    borders.right <= 0 ||
    borders.bottom <= 0
  ) {
    throw new RangeError('Nine-slice borders must be positive.');
  }
  if (borders.left + borders.right >= textureWidth) {
    throw new RangeError(
      'Nine-slice left and right borders must fit inside the source texture width.',
    );
  }
  if (borders.top + borders.bottom >= textureHeight) {
    throw new RangeError(
      'Nine-slice top and bottom borders must fit inside the source texture height.',
    );
  }
  if (borders.left + borders.right >= displayWidth) {
    throw new RangeError(
      'Nine-slice left and right borders must fit inside the display width.',
    );
  }
  if (borders.top + borders.bottom >= displayHeight) {
    throw new RangeError(
      'Nine-slice top and bottom borders must fit inside the display height.',
    );
  }
}

/** @internal */
export function syncPixiNineSliceSprite(
  slice: NineSliceSprite,
  owner: FlxNineSliceLike,
): void {
  const texture = owner.renderTexture;
  if (slice.texture !== texture) slice.texture = texture;
  slice.leftWidth = owner.leftWidth;
  slice.topHeight = owner.topHeight;
  slice.rightWidth = owner.rightWidth;
  slice.bottomHeight = owner.bottomHeight;
  slice.width = owner.width;
  slice.height = owner.height;
  slice.roundPixels = !owner.antialiasing;
}
