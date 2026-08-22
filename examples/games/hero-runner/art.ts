import { FlxGraphic, makeGraphicPixels } from 'flixel-pixi';

export const VIEW_WIDTH = 320;
export const VIEW_HEIGHT = 180;
export const FLOOR_Y = 148;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 32;
export const PLAYER_FLOOR_Y = FLOOR_Y - PLAYER_HEIGHT;

export function makeSkyTile(): FlxGraphic {
  const width = 128;
  const pixels = makeGraphicPixels(width, VIEW_HEIGHT, 0x0b1426ff);
  for (let y = 0; y < VIEW_HEIGHT; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (y > 100) pixels.data[index] = 0x102b42ff;
      if (y > 122) pixels.data[index] = 0x12374bff;
    }
  }
  const stars = [
    [14, 20],
    [48, 36],
    [82, 17],
    [112, 47],
    [28, 69],
    [98, 77],
  ];
  for (const [sx, sy] of stars) {
    if (sx === undefined || sy === undefined) continue;
    pixels.data[sy * width + sx] = 0x12d9e6ff;
  }
  for (let x = 0; x < width; x += 1) {
    const hill = 112 - Math.round(Math.sin((x / width) * Math.PI * 2) * 14);
    for (let y = hill; y < FLOOR_Y; y += 1)
      pixels.data[y * width + x] = 0x16253aff;
  }
  return FlxGraphic.fromPixels(pixels, 'hero-runner-sky');
}

export function makeGroundTile(): FlxGraphic {
  const width = 64;
  const height = VIEW_HEIGHT - FLOOR_Y;
  const pixels = makeGraphicPixels(width, height, 0x941545ff);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const stripe = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
      pixels.data[y * width + x] =
        y < 6 ? 0x12d9e6ff : stripe ? 0xff1f6dff : 0xc71959ff;
    }
  }
  return FlxGraphic.fromPixels(pixels, 'hero-runner-ground');
}

export function makeRunnerSheet(): FlxGraphic {
  const frames = 4;
  const pixels = makeGraphicPixels(
    PLAYER_WIDTH * frames,
    PLAYER_HEIGHT,
    0x00000000,
  );
  for (let frame = 0; frame < frames; frame += 1) {
    const frameX = frame * PLAYER_WIDTH;
    const step = frame % 2 === 0 ? 0 : 2;
    for (let y = 4; y < 24; y += 1) {
      for (let x = 5; x < 19; x += 1) {
        const edge = x === 5 || x === 18 || y === 4 || y === 23;
        pixels.data[y * pixels.width + frameX + x] = edge
          ? 0xf8fafcff
          : 0xff1f6dff;
      }
    }
    for (let y = 9; y < 13; y += 1) {
      for (let x = 8; x < 16; x += 1)
        pixels.data[y * pixels.width + frameX + x] = 0x090d16ff;
    }
    pixels.data[10 * pixels.width + frameX + 10] = 0x12d9e6ff;
    pixels.data[10 * pixels.width + frameX + 14] = 0x12d9e6ff;
    for (let y = 24; y < 31; y += 1) {
      for (let x = 6 + step; x < 11 + step; x += 1)
        pixels.data[y * pixels.width + frameX + x] = 0xf8fafcff;
      for (let x = 14 - step; x < 19 - step; x += 1)
        pixels.data[y * pixels.width + frameX + x] = 0xf8fafcff;
    }
  }
  return FlxGraphic.fromPixels(pixels, 'hero-runner-sheet');
}

export function makeCollectibleGraphic(): FlxGraphic {
  const size = 12;
  const center = 5;
  const pixels = makeGraphicPixels(size, size, 0x00000000);
  for (let y = 1; y < size - 1; y += 1) {
    const halfWidth = Math.min(y, size - 1 - y, center);
    for (let x = center - halfWidth; x <= center + halfWidth; x += 1) {
      const edge = x === center - halfWidth || x === center + halfWidth;
      pixels.data[y * size + x] = edge ? 0xf8fafcff : 0x12d9e6ff;
    }
  }
  return FlxGraphic.fromPixels(pixels, 'hero-runner-collectible');
}
