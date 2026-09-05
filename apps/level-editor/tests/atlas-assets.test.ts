import { describe, expect, it } from 'vitest';

import {
  atlasFramesForAsset,
  atlasImageFileName,
  createAtlasAsset,
  parseAtlasFrames,
} from '../src/atlas-assets';

const xml = `<TextureAtlas imagePath="tiles.png">
  <SubTexture name="grass.png" x="0" y="0" width="32" height="32"/>
  <SubTexture name="stone.png" x="32" y="0" w="32" h="32"/>
</TextureAtlas>`;

describe('spritesheet atlas assets', () => {
  it('matches the image and exposes every XML region as an item', () => {
    expect(atlasImageFileName(xml)).toBe('tiles.png');
    const frames = parseAtlasFrames(xml, 64, 32);
    const asset = createAtlasAsset(
      'tiles',
      'tiles.png',
      'tiles.xml',
      'data:image/png;base64,abc',
      64,
      32,
      frames,
    );
    expect(atlasFramesForAsset(asset)).toEqual([
      expect.objectContaining({ name: 'grass.png', width: 32, x: 0 }),
      expect.objectContaining({ name: 'stone.png', width: 32, x: 32 }),
    ]);
  });

  it('accepts TexturePacker sprite entries and image attribute aliases', () => {
    const texturePackerXml = `<TextureAtlas image="tiles.png">
      <sprite n="platform" x="0" y="0" w="32" h="16"/>
    </TextureAtlas>`;
    expect(atlasImageFileName(texturePackerXml)).toBe('tiles.png');
    expect(parseAtlasFrames(texturePackerXml, 32, 16)).toEqual([
      { height: 16, name: 'platform', width: 32, x: 0, y: 0 },
    ]);
  });

  it('rejects duplicate names and frames outside the image', () => {
    expect(() =>
      parseAtlasFrames(
        `<TextureAtlas><SubTexture name="tile" x="48" y="0" width="32" height="32"/></TextureAtlas>`,
        64,
        32,
      ),
    ).toThrow(/outside/i);
    expect(() =>
      parseAtlasFrames(
        `<TextureAtlas><SubTexture name="tile" x="0" y="0" width="8" height="8"/><SubTexture name="tile" x="8" y="0" width="8" height="8"/></TextureAtlas>`,
        16,
        8,
      ),
    ).toThrow(/duplicate/i);
  });
});
