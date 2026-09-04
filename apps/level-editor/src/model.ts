import { validateTileShapes } from './tile-shapes';
import {
  parsePhysicsWorld,
  parseProjectDocument,
  type AssetDefinition,
  type EntityDefinition,
  type JsonObject,
  type PhysicsWorldDocumentV1,
  type ProjectDocumentV1,
} from '@flixel-pixi/schemas';

import {
  validateTileMap,
  type TileMap,
  type TileStamp,
  type TileSelection,
  type TileTool,
} from './tiles';
import { validateTerrains, type TerrainChoice } from './terrain';
import {
  validateTileCollision,
  type TileCollisionSettings,
} from './tile-collision';

export const LEVEL_EDITOR_EXTENSION = 'flixelPixiLevelEditor';
export const LEVEL_EDITOR_VERSION = 1 as const;

export type EditorTool =
  'select' | 'pan' | 'move' | 'rotate' | 'scale' | TileTool;

export type LayerPurpose =
  'background' | 'gameplay' | 'collision' | 'foreground' | 'ui';

export interface SceneLayerDefinition {
  tilemap?: TileMap;
  tileCollision?: TileCollisionSettings;
  id: string;
  locked: boolean;
  name: string;
  order: number;
  purpose: LayerPurpose;
  visible: boolean;
}

export interface SceneEditorSettings {
  activeLayerId?: string;
  background: string;
  gridSize: number;
  height: number;
  layers?: SceneLayerDefinition[];
  physics: PhysicsWorldDocumentV1;
  width: number;
}

export interface LevelEditorExtensionV1 {
  activeSceneId: string;
  scenes: Record<string, SceneEditorSettings>;
  version: 1;
}

export interface LevelEditorSnapshot {
  document: ProjectDocumentV1;
  selectedEntityIds: string[];
  snapToGrid: boolean;
  tileStamp?: TileStamp;
  tileSelection?: TileSelection;
  terrain?: TerrainChoice;
  showGrid?: boolean;
  showTileCollisions?: boolean;
  tool: EditorTool;
}

export interface SpriteProperties extends JsonObject {
  assetId: string;
  frameColumn?: number;
  frameHeight?: number;
  frameName?: string;
  frameRow?: number;
  frameWidth?: number;
  frameX?: number;
  frameY?: number;
  height: number;
  layerId?: string;
  locked: boolean;
  originX: number;
  originY: number;
  visible: boolean;
  width: number;
  zIndex: number;
}

export interface ParticleEntityProperties extends JsonObject {
  assetId: string;
  height: number;
  layerId?: string;
  locked: boolean;
  visible: boolean;
  width: number;
  zIndex: number;
}

const demoSprite = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#1de8f1"/><stop offset="1" stop-color="#087f8c"/></linearGradient></defs><rect x="5" y="5" width="118" height="118" rx="26" fill="url(#g)"/><path d="M35 85V43h20c23 0 38 7 38 21S78 85 55 85H35zm17-13h7c10 0 17-2 17-8s-7-8-17-8h-7v16z" fill="#08101c"/><circle cx="101" cy="27" r="10" fill="#ff397e"/></svg>`;

export const DEMO_ASSET_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(demoSprite)}`;
const particleTexture = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><radialGradient id="g"><stop stop-color="#fff7b2"/><stop offset=".35" stop-color="#ff397e"/><stop offset="1" stop-color="#ff397e" stop-opacity="0"/></radialGradient></defs><circle cx="16" cy="16" r="16" fill="url(#g)"/></svg>`;
export const PARTICLE_TEXTURE_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(particleTexture)}`;

const demoParticleEffect = {
  emitters: [
    {
      enabled: true,
      layerId: 'demo-sparks-layer',
      name: 'Neon sparks',
      offset: { x: 0, y: 0 },
      preset: {
        appearance: {
          alpha: {
            stops: [
              { time: 0, value: 1 },
              { time: 1, value: 0 },
            ],
          },
          blendMode: 'add',
          colors: [
            { color: 0x1de8f1ff, time: 0 },
            { color: 0xff397eff, time: 1 },
          ],
          scale: {
            stops: [
              { time: 0, value: 0.45 },
              { time: 1, value: 0.05 },
            ],
          },
          texture: { assetId: 'asset-particle-glow' },
        },
        capacity: 100,
        emission: { mode: 'continuous', rate: 32 },
        id: 'demo-neon-sparks',
        kind: 'particle-preset',
        lifespan: { max: 1.1, min: 0.55 },
        motion: {
          acceleration: { x: { max: 0, min: 0 }, y: { max: 45, min: 20 } },
          velocity: { x: { max: 90, min: -90 }, y: { max: -40, min: -130 } },
        },
        name: 'Neon sparks',
        schemaVersion: 1,
        seed: 20260827,
        space: 'world',
        spawn: { radius: 12, shape: 'circle' },
      },
      textureShape: 'circle',
    },
  ],
  id: 'demo-neon-sparks-effect',
  kind: 'flixel-pixi-particle-effect',
  name: 'Neon sparks',
  version: 1,
};

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createPhysicsWorld(sceneId: string): PhysicsWorldDocumentV1 {
  return {
    bodies: [],
    gravity: { x: 0, y: 900 },
    id: `${sceneId}-physics`,
    joints: [],
    kind: 'flixel-pixi-physics-world',
    schemaVersion: 1,
  };
}

export function createInitialProject(): ProjectDocumentV1 {
  const sceneId = 'scene-main';
  const asset: AssetDefinition = {
    id: 'asset-flixel-mark',
    kind: 'image',
    metadata: { height: 128, width: 128 },
    src: DEMO_ASSET_SRC,
  };
  const particleTextureAsset: AssetDefinition = {
    id: 'asset-particle-glow',
    kind: 'image',
    metadata: {
      fileName: 'particle-glow.svg',
      height: 32,
      hidden: true,
      width: 32,
    },
    src: PARTICLE_TEXTURE_SRC,
  };
  const particleEffectAsset: AssetDefinition = {
    id: 'asset-neon-sparks',
    kind: 'data',
    metadata: {
      effectName: 'Neon sparks',
      fileName: 'neon-sparks.effect.json',
    },
    src: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(demoParticleEffect))}`,
  };
  return {
    assets: [asset, particleTextureAsset, particleEffectAsset],
    extensions: {
      [LEVEL_EDITOR_EXTENSION]: {
        activeSceneId: sceneId,
        scenes: {
          [sceneId]: {
            activeLayerId: 'layer-gameplay',
            background: '#0b1320',
            gridSize: 16,
            height: 540,
            layers: [
              {
                id: 'layer-background',
                locked: false,
                name: 'Background',
                order: 0,
                purpose: 'background',
                visible: true,
              },
              {
                id: 'layer-gameplay',
                locked: false,
                name: 'Gameplay',
                order: 100,
                purpose: 'gameplay',
                visible: true,
              },
              {
                id: 'layer-collision',
                locked: false,
                name: 'Collision',
                order: 200,
                purpose: 'collision',
                visible: true,
              },
              {
                id: 'layer-foreground',
                locked: false,
                name: 'Foreground',
                order: 300,
                purpose: 'foreground',
                visible: true,
              },
              {
                id: 'layer-ui',
                locked: false,
                name: 'UI / HUD',
                order: 400,
                purpose: 'ui',
                visible: true,
              },
            ],
            physics: createPhysicsWorld(sceneId),
            width: 960,
          },
        },
        version: LEVEL_EDITOR_VERSION,
      } as unknown as JsonObject,
    },
    project: { id: 'untitled-project', name: 'Untitled game' },
    scenes: [{ entities: [], id: sceneId, name: 'Main scene' }],
    schemaVersion: 1,
  };
}

export function cloneProject(document: ProjectDocumentV1): ProjectDocumentV1 {
  return structuredClone(document);
}

export function cloneSnapshot(
  snapshot: LevelEditorSnapshot,
): LevelEditorSnapshot {
  return structuredClone(snapshot);
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

export function getEditorExtension(
  document: ProjectDocumentV1,
): LevelEditorExtensionV1 {
  const value = document.extensions?.[LEVEL_EDITOR_EXTENSION];
  const extension = asRecord(value, 'Level editor extension');
  if (extension.version !== LEVEL_EDITOR_VERSION) {
    throw new Error('Unsupported level editor extension version.');
  }
  const scenes = asRecord(extension.scenes, 'Level editor scenes');
  for (const [sceneId, rawSettings] of Object.entries(scenes)) {
    const settings = asRecord(rawSettings, `Settings for ${sceneId}`);
    if (
      typeof settings.width !== 'number' ||
      typeof settings.height !== 'number' ||
      typeof settings.gridSize !== 'number' ||
      typeof settings.background !== 'string'
    ) {
      throw new Error(`Scene settings for ${sceneId} are invalid.`);
    }
    if (settings.layers !== undefined) {
      if (!Array.isArray(settings.layers) || settings.layers.length === 0)
        throw new Error(`Layers for ${sceneId} are invalid.`);
      for (const rawLayer of settings.layers) {
        const layer = asRecord(rawLayer, `Layer for ${sceneId}`);
        if (
          typeof layer.id !== 'string' ||
          typeof layer.name !== 'string' ||
          typeof layer.order !== 'number' ||
          typeof layer.visible !== 'boolean' ||
          typeof layer.locked !== 'boolean' ||
          !['background', 'gameplay', 'collision', 'foreground', 'ui'].includes(
            String(layer.purpose),
          )
        )
          throw new Error(`Layer settings for ${sceneId} are invalid.`);
      }
      for (const layer of settings.layers) {
        if (layer.tilemap !== undefined)
          validateTileMap(layer.tilemap, document.assets);
        if (layer.tileCollision !== undefined)
          validateTileCollision(layer.tileCollision);
      }
    }
    parsePhysicsWorld(settings.physics);
  }
  return value as unknown as LevelEditorExtensionV1;
}

export function parseLevelProject(value: unknown): ProjectDocumentV1 {
  const document = parseProjectDocument(value);
  validateTerrains(document.assets);
  validateTileShapes(document.assets);
  const extension = getEditorExtension(document);
  if (!document.scenes.some((scene) => scene.id === extension.activeSceneId)) {
    throw new Error('The active scene does not exist.');
  }
  return document;
}

export function activeScene(snapshot: LevelEditorSnapshot) {
  const extension = getEditorExtension(snapshot.document);
  const scene = snapshot.document.scenes.find(
    (candidate) => candidate.id === extension.activeSceneId,
  );
  if (scene === undefined) throw new Error('Active scene is missing.');
  return scene;
}

export function activeSceneSettings(
  snapshot: LevelEditorSnapshot,
): SceneEditorSettings {
  const extension = getEditorExtension(snapshot.document);
  const settings = extension.scenes[extension.activeSceneId];
  if (settings === undefined)
    throw new Error('Active scene settings are missing.');
  return settings;
}

const fallbackLayer: SceneLayerDefinition = {
  id: 'layer-gameplay',
  locked: false,
  name: 'Gameplay',
  order: 100,
  purpose: 'gameplay',
  visible: true,
};

export function sceneLayers(
  snapshot: LevelEditorSnapshot,
): SceneLayerDefinition[] {
  const layers = activeSceneSettings(snapshot).layers;
  return layers === undefined || layers.length === 0 ? [fallbackLayer] : layers;
}

export function activeLayer(
  snapshot: LevelEditorSnapshot,
): SceneLayerDefinition {
  const settings = activeSceneSettings(snapshot);
  const layers = sceneLayers(snapshot);
  return (
    layers.find((layer) => layer.id === settings.activeLayerId) ??
    layers[0] ??
    fallbackLayer
  );
}

export function layerForEntity(
  snapshot: LevelEditorSnapshot,
  entity: EntityDefinition,
): SceneLayerDefinition {
  const layerId = entityProperties(entity).layerId;
  const layers = sceneLayers(snapshot);
  return (
    layers.find((layer) => layer.id === layerId) ??
    layers.find((layer) => layer.purpose === 'gameplay') ??
    layers[0] ??
    fallbackLayer
  );
}

export function entityProperties(
  entity: EntityDefinition,
): SpriteProperties | ParticleEntityProperties {
  return entity.properties as SpriteProperties | ParticleEntityProperties;
}

export function createSpriteEntity(
  assetId: string,
  index: number,
): EntityDefinition {
  return {
    id: createId('sprite'),
    name: `Sprite ${index}`,
    position: { x: 128 + index * 24, y: 112 + index * 18 },
    properties: {
      assetId,
      height: 96,
      locked: false,
      layerId: 'layer-gameplay',
      originX: 0.5,
      originY: 0.5,
      visible: true,
      width: 96,
      zIndex: index,
    },
    rotation: 0,
    scale: { x: 1, y: 1 },
    type: 'sprite',
  };
}
