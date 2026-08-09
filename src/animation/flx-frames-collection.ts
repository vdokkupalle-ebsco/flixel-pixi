import type { FlxAtlasFrameList } from '../assets/flx-atlas-frame';
import type { FlxGraphic } from '../assets/flx-graphic';
import { FlxFrame } from './flx-frame';

/** Options for creating a uniform grid frame collection. @public */
export interface FlxGridFramesOptions {
  readonly names?: readonly (string | null)[];
  readonly durations?: readonly number[];
}

/** Ordered frame views shared by sprite animation and atlas workflows. @public */
export class FlxFramesCollection {
  frames: FlxFrame[];

  constructor(frames: readonly FlxFrame[] = []) {
    this.frames = [...frames];
  }

  static fromGraphicGrid(
    graphic: FlxGraphic,
    frameWidth: number,
    frameHeight: number,
    options: FlxGridFramesOptions = {},
  ): FlxFramesCollection {
    if (
      !Number.isInteger(frameWidth) ||
      !Number.isInteger(frameHeight) ||
      frameWidth <= 0 ||
      frameHeight <= 0
    ) {
      throw new RangeError('Grid frame dimensions must be positive integers.');
    }
    const columns = Math.floor(graphic.width / frameWidth);
    const rows = Math.floor(graphic.height / frameHeight);
    const count = columns * rows;
    const frames = Array.from({ length: count }, (_, index) => {
      return new FlxFrame({
        duration: options.durations?.[index] ?? 0,
        height: frameHeight,
        index,
        name: options.names?.[index] ?? String(index),
        texture: () => graphic.frameTexture(index, frameWidth, frameHeight),
        width: frameWidth,
      });
    });
    return new FlxFramesCollection(frames);
  }

  static fromAtlas(frames: FlxAtlasFrameList): FlxFramesCollection {
    return new FlxFramesCollection(
      frames.map((frame, index) => {
        return new FlxFrame({
          duration: frame.duration ?? 0,
          height: frame.texture.frame.height,
          index,
          name: frame.name,
          texture: frame.texture,
          width: frame.texture.frame.width,
        });
      }),
    );
  }

  get numFrames(): number {
    return this.frames.length;
  }

  getFrame(index: number): FlxFrame {
    if (!Number.isInteger(index) || index < 0 || index >= this.frames.length) {
      throw new RangeError(
        `Frame ${index} is outside 0..${this.frames.length - 1}.`,
      );
    }
    return this.frames[index] as FlxFrame;
  }

  getByName(name: string): FlxFrame {
    const frame = this.frames.find((candidate) => candidate.name === name);
    if (frame !== undefined) return frame;
    const fallback = name.endsWith('.png') ? name.slice(0, -4) : `${name}.png`;
    const fallbackFrame = this.frames.find(
      (candidate) => candidate.name === fallback,
    );
    if (fallbackFrame !== undefined) return fallbackFrame;
    throw new Error(`No frame called "${name}".`);
  }

  getByNames(names: readonly string[]): FlxFrame[] {
    return names.map((name) => this.getByName(name));
  }

  getByPrefix(prefix: string): FlxFrame[] {
    return this.frames.filter((frame) => frame.name?.startsWith(prefix));
  }

  getByIndices(indices: readonly number[]): FlxFrame[] {
    return indices.map((index) => this.getFrame(index));
  }

  setNames(names: readonly (string | null)[]): void {
    if (names.length !== this.frames.length) {
      throw new RangeError('Frame name count must match the collection.');
    }
    for (let index = 0; index < names.length; index += 1) {
      (this.frames[index] as FlxFrame).name = names[index] ?? null;
    }
  }

  destroy(): void {
    this.frames = [];
  }
}
