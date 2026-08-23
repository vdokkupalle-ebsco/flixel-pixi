import { describe, expect, it } from 'vitest';
import type { ParticleEffectDocumentV1 } from '../src/editor-store';
import { createEffectBundleZip } from '../src/io';
import { findStarterEffectDocument, findStarterPreset, getDefaultStarterPreset } from '../src/presets';

describe('effect bundle ZIP export and starter effects', () => {
  it('builds an effect bundle ZIP containing JSON, TypeScript, textures, and README', async () => {
    const starter1 = getDefaultStarterPreset();
    const starter2 = findStarterPreset('starter-campfire');
    if (starter2 === undefined) throw new Error('starter-campfire not found');

    const doc: ParticleEffectDocumentV1 = {
      kind: 'flixel-pixi-particle-effect',
      version: 1,
      id: 'campfire-magic',
      name: 'Campfire Magic',
      emitters: [
        {
          layerId: 'layer-1',
          name: 'Flames',
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: starter2,
        },
        {
          layerId: 'layer-2',
          name: 'Sparks',
          enabled: true,
          offset: { x: 0, y: -10 },
          textureShape: 'circle',
          preset: starter1,
        },
      ],
    };

    const dummyPngBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
      type: 'image/png',
    });

    const zipBlob = await createEffectBundleZip(doc, async () => dummyPngBlob);
    expect(zipBlob.type).toBe('application/zip');
    expect(zipBlob.size).toBeGreaterThan(100);

    const buffer = await zipBlob.arrayBuffer();
    const text = new TextDecoder().decode(buffer);

    expect(text).toContain('campfire-magic/campfire-magic.effect.json');
    expect(text).toContain('campfire-magic/campfire-magic.ts');
    expect(text).toContain('campfire-magic/README.md');
    expect(text).toContain('campfire-magic/textures/editor-flame.png');
    expect(text).toContain('campfire-magic/textures/editor-spark.png');
  });

  it('provides starter composed effects such as campfire and rainstorm', () => {
    const campfire = findStarterEffectDocument('starter-campfire');
    expect(campfire).toBeDefined();
    expect(campfire?.emitters.length).toBeGreaterThanOrEqual(2);
    expect(campfire?.name).toBe('Campfire');

    const rain = findStarterEffectDocument('starter-rain-shower');
    expect(rain).toBeDefined();
    expect(rain?.emitters.length).toBeGreaterThanOrEqual(2);

    const single = findStarterEffectDocument('starter-snowfall');
    expect(single).toBeDefined();
    expect(single?.emitters).toHaveLength(1);
  });
});
