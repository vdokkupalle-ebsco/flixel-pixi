import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlxAssets,
  FlxContext,
  FlxG,
  FlxGraphic,
  FlxParticleEffect,
} from 'flixel-pixi';

import { parseImportedDocument, serializeEffectDocument } from '../src/io';

const campfireExport = readFileSync(
  resolve(
    process.cwd(),
    '../../examples/games/particle-effect/campfire-effect.json',
  ),
  'utf8',
);

let context: FlxContext;

beforeEach(() => {
  context = new FlxContext(640, 360, 0.5);
  FlxG.installContext(context);
});

afterEach(() => {
  FlxG.clearContext(context);
});

describe('Particle Editor export runtime compatibility', () => {
  it('loads an editor-exported effect directly with FlxParticleEffect', () => {
    const imported = parseImportedDocument(campfireExport);
    const exported = serializeEffectDocument(imported);
    const runtimeDocument: unknown = JSON.parse(exported);
    const graphic = new FlxGraphic(Texture.WHITE);
    const assets = new FlxAssets().install(context);
    vi.spyOn(assets, 'getGraphic').mockReturnValue(graphic);

    const effect = FlxParticleEffect.fromAssets(runtimeDocument, {
      assets,
      x: 320,
      y: 304,
    });

    expect(effect.document).toEqual(imported);
    expect(effect.layers.map(({ definition }) => definition.layerId)).toEqual([
      'outer-flame',
      'embers',
      'smoke',
    ]);
    expect(assets.getGraphic).toHaveBeenCalledWith('campfire-flame');
    expect(assets.getGraphic).toHaveBeenCalledWith('campfire-ember');
    expect(assets.getGraphic).toHaveBeenCalledWith('campfire-smoke');
    expect(effect.layers.map(({ emitter: { x, y } }) => ({ x, y }))).toEqual([
      { x: 320, y: 304 },
      { x: 320, y: 292 },
      { x: 320, y: 280 },
    ]);

    effect.destroy();
    graphic.destroy();
  });
});
