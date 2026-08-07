// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { parseKenneyAtlasXml } from '../../examples/games/kenney-platformer/atlas';

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<TextureAtlas imagePath="sheet.png">
  <SubTexture name="grassMid.png" x="0" y="128" width="128" height="128"/>
  <SubTexture name="alienBlue_stand.png" x="10" y="20" width="128" height="256"/>
</TextureAtlas>`;

describe('parseKenneyAtlasXml', () => {
  it('maps SubTexture names to frames', () => {
    const map = parseKenneyAtlasXml(FIXTURE);
    expect(map.get('grassMid.png')).toEqual({
      name: 'grassMid.png',
      x: 0,
      y: 128,
      width: 128,
      height: 128,
    });
    expect(map.get('alienBlue_stand.png')?.height).toBe(256);
  });

  it('throws on empty atlas', () => {
    expect(() =>
      parseKenneyAtlasXml('<TextureAtlas imagePath="sheet.png"></TextureAtlas>'),
    ).toThrow(/SubTexture/i);
  });
});
