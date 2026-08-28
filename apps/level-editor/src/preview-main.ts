import {
  createProtocolPeer,
  EDITOR_PROTOCOL_VERSION,
  type ProtocolDiagnostic,
} from '@flixel-pixi/editor-protocol';
import {
  parseParticleEffect,
  parseProjectDocument,
  type EntityDefinition,
  type ProjectDocumentV1,
} from '@flixel-pixi/schemas';
import type { createPlanckPhysicsBackend as CreatePlanckPhysicsBackend } from '@flixel-pixi/physics-planck';
import {
  createBrowserGame,
  FlxAssets,
  FlxG,
  FlxParticleEffect,
  FlxPhysicsWorld,
  FlxSprite,
  FlxState,
  type BrowserGameApplication,
} from 'flixel-pixi';

import { getEditorExtension, type LevelEditorExtensionV1 } from './model';
import { createWindowTransport } from './protocol-transport';

let runtimeDocument: ProjectDocumentV1 | undefined;
let runtimeExtension: LevelEditorExtensionV1 | undefined;
let createPhysicsBackend: typeof CreatePlanckPhysicsBackend | undefined;

function numeric(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function decodeDataJson(src: string): unknown {
  const comma = src.indexOf(',');
  if (!src.startsWith('data:') || comma < 0)
    throw new Error('Expected an embedded JSON data URL.');
  return JSON.parse(decodeURIComponent(src.slice(comma + 1)));
}

class LevelPreviewState extends FlxState {
  override create(): void {
    super.create();
    if (runtimeDocument === undefined || runtimeExtension === undefined) {
      throw new Error('No level project has been registered.');
    }
    const scene = runtimeDocument.scenes.find(
      (candidate) => candidate.id === runtimeExtension?.activeSceneId,
    );
    if (scene === undefined) throw new Error('The active scene is missing.');
    const settings = runtimeExtension.scenes[scene.id];
    if (settings === undefined) throw new Error('Scene settings are missing.');
    FlxG.camera.bgColor =
      Number.parseInt(settings.background.slice(1), 16) | 0xff000000;
    const assets = FlxAssets.fromContext(FlxG.context);
    const sprites = new Map<string, FlxSprite>();
    for (const entity of [...scene.entities].sort(
      (a, b) =>
        numeric(a.properties?.zIndex, 0) - numeric(b.properties?.zIndex, 0),
    )) {
      const sprite = this.#addEntity(entity, runtimeDocument, assets);
      if (sprite !== undefined) sprites.set(entity.id, sprite);
    }
    if (settings.physics.bodies.length > 0) {
      if (createPhysicsBackend === undefined)
        throw new Error('The physics adapter has not loaded.');
      const world = new FlxPhysicsWorld(createPhysicsBackend(), {
        gravity: settings.physics.gravity,
      });
      this.setPhysicsWorld(world);
      const bodies = new Map<string, ReturnType<typeof world.addBody>>();
      for (const documentBody of settings.physics.bodies) {
        const sprite = sprites.get(documentBody.entityId);
        if (sprite === undefined) continue;
        const definition = { ...documentBody };
        Reflect.deleteProperty(definition, 'entityId');
        Reflect.deleteProperty(definition, 'extensions');
        Reflect.deleteProperty(definition, 'kind');
        Reflect.deleteProperty(definition, 'schemaVersion');
        bodies.set(documentBody.id, world.addBody(sprite, definition));
      }
      for (const documentJoint of settings.physics.joints ?? []) {
        const bodyA = bodies.get(documentJoint.bodyA);
        const bodyB = bodies.get(documentJoint.bodyB);
        if (bodyA === undefined || bodyB === undefined) continue;
        world.addJoint({ ...documentJoint, bodyA, bodyB });
      }
    }
  }

  #addEntity(
    entity: EntityDefinition,
    document: ProjectDocumentV1,
    assets: FlxAssets | undefined,
  ): FlxSprite | undefined {
    const properties = entity.properties ?? {};
    if (properties.visible === false) return;
    const assetId =
      typeof properties.assetId === 'string' ? properties.assetId : '';
    const asset = document.assets.find((candidate) => candidate.id === assetId);
    if (entity.type === 'particle-effect' && asset !== undefined) {
      const effectDocument = parseParticleEffect(decodeDataJson(asset.src));
      const effect = FlxParticleEffect.fromAssets(effectDocument, {
        autoStart: true,
        x: entity.position.x,
        y: entity.position.y,
      });
      this.add(effect);
      return undefined;
    }
    const graphic = assets?.getGraphic(assetId);
    if (graphic === undefined) return undefined;
    const width = numeric(properties.width, graphic.width);
    const height = numeric(properties.height, graphic.height);
    const originX = numeric(properties.originX, 0.5);
    const originY = numeric(properties.originY, 0.5);
    const entityScaleX = entity.scale?.x ?? 1;
    const entityScaleY = entity.scale?.y ?? 1;
    const sprite = new FlxSprite(
      entity.position.x - width * entityScaleX * originX,
      entity.position.y - height * entityScaleY * originY,
    );
    const frameWidth = Math.floor(numeric(properties.frameWidth, 0));
    const frameHeight = Math.floor(numeric(properties.frameHeight, 0));
    if (frameWidth > 0 && frameHeight > 0) {
      const columns = Math.max(1, Math.floor(graphic.width / frameWidth));
      const column = Math.max(
        0,
        Math.min(columns - 1, Math.floor(numeric(properties.frameColumn, 0))),
      );
      const rows = Math.max(1, Math.floor(graphic.height / frameHeight));
      const row = Math.max(
        0,
        Math.min(rows - 1, Math.floor(numeric(properties.frameRow, 0))),
      );
      sprite.loadGraphic(graphic, true, false, frameWidth, frameHeight);
      sprite.animation.frameIndex = row * columns + column;
    } else sprite.loadGraphic(graphic);
    sprite.angle = ((entity.rotation ?? 0) * 180) / Math.PI;
    sprite.scale.x =
      (width / Math.max(1, frameWidth || graphic.width)) * entityScaleX;
    sprite.scale.y =
      (height / Math.max(1, frameHeight || graphic.height)) * entityScaleY;
    this.add(sprite);
    return sprite;
  }
}

const host = document.querySelector<HTMLElement>('#preview-host');
const status = document.querySelector<HTMLElement>('#preview-status');
if (host === null || status === null)
  throw new Error('Preview host is missing.');
const previewHost = host;
const previewStatus = status;

const sessionId =
  new URLSearchParams(window.location.search).get('session') ??
  crypto.randomUUID();
const opener = window.parent;
const peer = createProtocolPeer({
  createMessageId: () => crypto.randomUUID(),
  role: 'preview',
  sessionId,
  transport: createWindowTransport(opener, opener),
});
let app: BrowserGameApplication | undefined;

async function loadProject(serializedProject: string): Promise<void> {
  const document = parseProjectDocument(JSON.parse(serializedProject));
  const extension = getEditorExtension(document);
  const scene = document.scenes.find(
    (candidate) => candidate.id === extension.activeSceneId,
  );
  if (scene === undefined) throw new Error('Active scene not found.');
  const settings = extension.scenes[scene.id];
  if (settings === undefined) throw new Error('Scene settings not found.');
  if (
    settings.physics.bodies.length > 0 &&
    createPhysicsBackend === undefined
  ) {
    ({ createPlanckPhysicsBackend: createPhysicsBackend } =
      await import('@flixel-pixi/physics-planck'));
  }
  app?.destroy();
  runtimeDocument = document;
  runtimeExtension = extension;
  const imageAssets = document.assets
    .filter((asset) => asset.kind === 'image')
    .map((asset) => ({ alias: asset.id, src: asset.src }));
  app = await createBrowserGame({
    assets: {
      bundles: [{ assets: imageAssets, name: 'level-project' }],
      initialBundles: imageAssets.length === 0 ? [] : ['level-project'],
    },
    height: settings.height,
    host: previewHost,
    initialState: LevelPreviewState,
    width: settings.width,
  });
  previewStatus.textContent = `${scene.name} · ${scene.entities.length} objects`;
}

peer.onMessage((message) => {
  if (message.type === 'project.load') {
    void loadProject(message.payload.serializedProject)
      .then(() => {
        peer.reply(message, 'project.loaded', {
          revision: message.payload.revision,
        });
        peer.send('preview.state', {
          revision: message.payload.revision,
          state: 'running',
        });
      })
      .catch((error: unknown) => {
        const diagnostic: ProtocolDiagnostic = {
          code: 'preview_load_failed',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error',
        };
        previewStatus.textContent = diagnostic.message;
        peer.reply(message, 'project.rejected', {
          diagnostics: [diagnostic],
          revision: message.payload.revision,
        });
      });
  } else if (message.type === 'preview.command') {
    if (message.payload.command === 'pause') FlxG.paused = true;
    else if (
      message.payload.command === 'resume' ||
      message.payload.command === 'start'
    )
      FlxG.paused = false;
    else if (message.payload.command === 'stop') app?.destroy();
    else if (
      message.payload.command === 'reset' &&
      runtimeDocument !== undefined
    )
      void loadProject(JSON.stringify(runtimeDocument));
  }
});

peer.send('preview.ready', {
  capabilities: ['project.load', 'preview.command', 'selection.set'],
  protocolVersion: EDITOR_PROTOCOL_VERSION,
});
