import type { EntityDefinition, JsonValue } from '@flixel-pixi/schemas';
import { describe, expect, it } from 'vitest';
import {
  activeScene,
  activeSceneSettings,
  createInitialProject,
  createSpriteEntity,
  getEditorExtension,
  type LevelEditorSnapshot,
} from '../src/model';
import { starterEdgeTileset, terrainSets } from '../src/terrain';
import { exportTiledMap, importTiledMap } from '../src/tiled-map';

const snapshot = (document = createInitialProject()): LevelEditorSnapshot => ({
  document,
  selectedEntityIds: [],
  snapToGrid: true,
  tool: 'select',
});

const asRecords = (value: JsonValue | undefined) =>
  value as unknown as Record<string, unknown>[];

describe('Tiled map interchange', () => {
  it('round-trips layers, groups, terrain tilesets, objects and every tile transform', () => {
    const current = snapshot();
    const settings = activeSceneSettings(current);
    const gameplay = settings.layers?.find(
      (layer) => layer.id === 'layer-gameplay',
    );
    if (!gameplay) throw new Error('Missing gameplay layer');
    settings.layers?.push({
      id: 'group-world',
      kind: 'group',
      locked: false,
      name: 'World',
      opacity: 0.8,
      offsetX: 12,
      offsetY: -4,
      order: 500,
      purpose: 'gameplay',
      visible: true,
    });
    gameplay.parentId = 'group-world';
    gameplay.opacity = 0.7;
    gameplay.tileCollision = {
      enabled: true,
      friction: 0.25,
      restitution: 0.1,
    };
    gameplay.tilemap = { tileSize: 16, cells: {} };
    for (let rotation = 0; rotation < 4; rotation++)
      for (const flipX of [false, true]) {
        const x = rotation * 2 + Number(flipX);
        gameplay.tilemap.cells[`${x},2`] = {
          assetId: 'asset-flixel-mark',
          x: 0,
          y: 0,
          width: 16,
          height: 16,
          ...(rotation ? { rotation } : {}),
          ...(flipX ? { flipX } : {}),
        };
      }
    const road = starterEdgeTileset();
    current.document.assets.push(road);
    const sprite = createSpriteEntity('asset-flixel-mark', 1);
    sprite.id = 'hero';
    sprite.name = 'Hero';
    sprite.position = { x: 80, y: 96 };
    sprite.rotation = Math.PI / 3;
    sprite.scale = { x: 1.5, y: 0.75 };
    (sprite.properties ??= {}).layerId = gameplay.id;
    sprite.properties.customProperties = [
      { name: 'team', type: 'string', value: 'player' },
      { name: 'damage', type: 'number', value: 4 },
    ] as unknown as JsonValue;
    activeScene(current).entities.push(sprite);

    const tiled = exportTiledMap(current.document);
    expect(tiled).toMatchObject({
      type: 'map',
      orientation: 'orthogonal',
      infinite: false,
      tilewidth: 16,
      tileheight: 16,
    });
    const exportedTilesets = asRecords(tiled.tilesets);
    expect(exportedTilesets).toHaveLength(3);
    expect(
      exportedTilesets.find((tileset) => Array.isArray(tileset.wangsets))
        ?.wangsets,
    ).toBeInstanceOf(Array);

    const imported = importTiledMap(tiled);
    const importedSnapshot = snapshot(imported);
    const importedSettings = activeSceneSettings(importedSnapshot);
    const importedGameplay = importedSettings.layers?.find(
      (layer) => layer.id === gameplay.id,
    );
    expect(importedGameplay).toMatchObject({
      parentId: 'group-world',
      opacity: 0.7,
      tileCollision: gameplay.tileCollision,
    });
    expect(
      importedSettings.layers?.find((layer) => layer.id === 'group-world'),
    ).toMatchObject({
      kind: 'group',
      opacity: 0.8,
      offsetX: 12,
      offsetY: -4,
    });
    expect(importedGameplay?.tilemap?.cells).toEqual(gameplay.tilemap.cells);
    expect(activeScene(importedSnapshot).entities).toContainEqual(sprite);
    const importedRoad = terrainSets(
      imported.assets.find((asset) => asset.id === road.id) ?? road,
    )[0];
    expect(importedRoad).toMatchObject({
      id: 'road',
      name: 'Road',
      kind: 'edge',
      allowRotation: true,
      allowFlip: true,
    });
    expect(
      importedRoad?.rules.map(({ mask, tile }) => ({ mask, tile })),
    ).toEqual(
      terrainSets(road)[0]?.rules.map(({ mask, tile }) => ({ mask, tile })),
    );
    expect(getEditorExtension(imported).activeSceneId).toBe('scene-main');
  });

  it('imports a standard finite Tiled map when its source image is selected', () => {
    const map = {
      type: 'map',
      version: '1.10',
      orientation: 'orthogonal',
      infinite: false,
      width: 2,
      height: 2,
      tilewidth: 16,
      tileheight: 16,
      backgroundcolor: '#123456',
      tilesets: [
        {
          firstgid: 1,
          name: 'world',
          image: 'world.png',
          imagewidth: 32,
          imageheight: 16,
          tilewidth: 16,
          tileheight: 16,
          tilecount: 2,
          columns: 2,
        },
      ],
      layers: [
        {
          id: 1,
          name: 'Ground',
          type: 'tilelayer',
          width: 2,
          height: 2,
          data: [1, 0, 2, 0],
        },
        {
          id: 2,
          name: 'Gameplay',
          type: 'objectgroup',
          objects: [
            {
              id: 1,
              name: 'Exit',
              type: 'trigger-zone',
              x: 8,
              y: 12,
              width: 16,
              height: 20,
              rotation: 90,
              properties: [
                { name: 'destination', type: 'string', value: 'level-2' },
                { name: 'enabled', type: 'bool', value: true },
              ],
            },
            {
              id: 1,
              name: 'Second marker',
              point: true,
              x: 24,
              y: 8,
            },
          ],
        },
      ],
    };
    const imported = importTiledMap(map, [
      {
        name: 'world.png',
        src: 'data:image/png;base64,AA==',
        width: 32,
        height: 16,
      },
    ]);
    const current = snapshot(imported),
      layers = activeSceneSettings(current).layers ?? [],
      ground = layers.find((layer) => layer.name === 'Ground'),
      object = activeScene(current).entities[0] as EntityDefinition;
    expect(activeSceneSettings(current)).toMatchObject({
      background: '#123456',
      gridSize: 16,
      width: 32,
      height: 32,
    });
    expect(ground?.tilemap?.cells).toEqual({
      '0,0': {
        assetId: 'world-png',
        x: 0,
        y: 0,
        width: 16,
        height: 16,
      },
      '0,1': {
        assetId: 'world-png',
        x: 16,
        y: 0,
        width: 16,
        height: 16,
      },
    });
    expect(object).toMatchObject({
      type: 'trigger',
      name: 'Exit',
      position: { x: 16, y: 22 },
      rotation: Math.PI / 2,
      properties: {
        gameplayClass: 'trigger-zone',
        customProperties: [
          { name: 'destination', type: 'string', value: 'level-2' },
          { name: 'enabled', type: 'boolean', value: true },
        ],
      },
    });
    expect(activeScene(current).entities.map(({ id }) => id)).toEqual([
      'object-1',
      'object-1-2',
    ]);
  });

  it('rejects unsupported maps with actionable errors', () => {
    const base = exportTiledMap(createInitialProject());
    expect(() => importTiledMap({ ...base, infinite: true })).toThrow(
      'Infinite Tiled maps are not supported yet',
    );
    expect(() => importTiledMap({ ...base, orientation: 'isometric' })).toThrow(
      'Only orthogonal Tiled maps are supported',
    );
    const external = structuredClone(base) as Record<string, unknown>;
    const tilesets = external.tilesets as Record<string, unknown>[];
    if (!tilesets[0]) throw new Error('Missing tileset');
    tilesets[0] = { firstgid: 1, source: 'world.tsj' };
    expect(() => importTiledMap(external)).toThrow(
      'Embed Tiled tilesets in the map',
    );
    const compressed = structuredClone(base) as Record<string, unknown>;
    const layers = compressed.layers as Record<string, unknown>[];
    const first = layers[0];
    if (!first) throw new Error('Missing layer');
    layers[0] = {
      id: 1,
      name: 'Compressed',
      type: 'tilelayer',
      width: Number(base.width),
      height: Number(base.height),
      data: 'AAAA',
      encoding: 'base64',
    };
    expect(() => importTiledMap(compressed)).toThrow('JSON data array');

    const overlapping = structuredClone(base) as Record<string, unknown>;
    const overlappingTilesets = overlapping.tilesets as Record<
      string,
      unknown
    >[];
    if (!overlappingTilesets[1]) throw new Error('Missing second tileset');
    overlappingTilesets[1].firstgid = 1;
    expect(() => importTiledMap(overlapping)).toThrow(
      'GID ranges must be unique and non-overlapping',
    );

    const mismatched = createInitialProject();
    const current = snapshot(mismatched);
    const gameplay = activeSceneSettings(current).layers?.find(
      (layer) => layer.id === 'layer-gameplay',
    );
    if (!gameplay) throw new Error('Missing gameplay layer');
    gameplay.tilemap = {
      tileSize: 32,
      cells: {
        '0,0': {
          assetId: 'asset-flixel-mark',
          x: 0,
          y: 0,
          width: 16,
          height: 16,
        },
      },
    };
    expect(() => exportTiledMap(mismatched)).toThrow(
      'uses a different tile size',
    );
  });
});
