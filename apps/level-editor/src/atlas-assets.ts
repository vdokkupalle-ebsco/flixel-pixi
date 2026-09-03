import { parseTextureAtlasXml, type FlxAtlasFrameRect } from 'flixel-pixi';
import type { AssetDefinition, JsonObject } from '@flixel-pixi/schemas';

export interface AtlasFrameItem extends FlxAtlasFrameRect {
  assetId: string;
}

function fileNameOnly(path: string): string {
  return path.replaceAll('\\', '/').split('/').at(-1) ?? path;
}

export function atlasImageFileName(xmlText: string): string | undefined {
  const document = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (document.querySelector('parsererror') !== null) return undefined;
  const root = [...document.getElementsByTagName('*')].find(
    (element) => element.localName.toLowerCase() === 'textureatlas',
  );
  const path =
    root?.getAttribute('imagePath') ??
    root?.getAttribute('image') ??
    root?.getAttribute('texturePath') ??
    root?.getAttribute('file');
  return path === null || path === undefined || path.trim() === ''
    ? undefined
    : fileNameOnly(path.trim());
}

export function parseAtlasFrames(
  xmlText: string,
  imageWidth: number,
  imageHeight: number,
): FlxAtlasFrameRect[] {
  const frames = parseTextureAtlasXml(xmlText);
  const names = new Set<string>();
  for (const frame of frames) {
    if (frame.name.trim() === '')
      throw new Error('Atlas frame names cannot be empty.');
    if (names.has(frame.name))
      throw new Error(`Atlas contains duplicate frame "${frame.name}".`);
    names.add(frame.name);
    if (
      !Number.isInteger(frame.x) ||
      !Number.isInteger(frame.y) ||
      !Number.isInteger(frame.width) ||
      !Number.isInteger(frame.height) ||
      frame.x < 0 ||
      frame.y < 0 ||
      frame.width <= 0 ||
      frame.height <= 0 ||
      frame.x + frame.width > imageWidth ||
      frame.y + frame.height > imageHeight
    ) {
      throw new RangeError(
        `Atlas frame "${frame.name}" falls outside the image.`,
      );
    }
  }
  return frames;
}

export function createAtlasAsset(
  id: string,
  imageFileName: string,
  xmlFileName: string,
  src: string,
  width: number,
  height: number,
  frames: readonly FlxAtlasFrameRect[],
): AssetDefinition {
  return {
    id,
    kind: 'image',
    metadata: {
      atlasFileName: xmlFileName,
      atlasFrames: frames.map((frame) => ({ ...frame })) as JsonObject[],
      fileName: imageFileName,
      height,
      isAtlas: true,
      width,
    },
    src,
  };
}

export function atlasFramesForAsset(asset: AssetDefinition): AtlasFrameItem[] {
  const rawFrames = asset.metadata?.atlasFrames;
  if (!Array.isArray(rawFrames)) return [];
  return rawFrames.flatMap((raw) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
      return [];
    const frame = raw as Record<string, unknown>;
    if (
      typeof frame.name !== 'string' ||
      typeof frame.x !== 'number' ||
      typeof frame.y !== 'number' ||
      typeof frame.width !== 'number' ||
      typeof frame.height !== 'number'
    )
      return [];
    return [
      {
        assetId: asset.id,
        height: frame.height,
        name: frame.name,
        width: frame.width,
        x: frame.x,
        y: frame.y,
      },
    ];
  });
}
