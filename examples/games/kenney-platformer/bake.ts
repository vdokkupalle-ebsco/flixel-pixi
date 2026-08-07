import { Texture } from 'pixi.js';

import type { AtlasFrame } from './atlas';

export function requireFrame(
  atlas: Map<string, AtlasFrame>,
  name: string,
): AtlasFrame {
  const frame = atlas.get(name);
  if (!frame) {
    throw new Error(`Required atlas frame missing: "${name}"`);
  }
  return frame;
}

export function bakeHorizontalStrip(
  source: CanvasImageSource,
  frames: ReadonlyArray<AtlasFrame | null>,
  outW: number,
  outH: number,
): Texture {
  const count = frames.length;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, count * outW);
  canvas.height = Math.max(1, outH);
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < count; i += 1) {
      const frame = frames[i];
      if (frame) {
        ctx.drawImage(
          source,
          frame.x,
          frame.y,
          frame.width,
          frame.height,
          i * outW,
          0,
          outW,
          outH,
        );
      }
    }
  }

  return Texture.from(canvas);
}
