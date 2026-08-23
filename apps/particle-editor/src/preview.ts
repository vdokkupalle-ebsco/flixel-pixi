import {
  createBrowserGame,
  FlxG,
  FlxGraphic,
  FlxParticleEmitter,
  FlxState,
  parseParticlePreset,
  type BrowserGameApplication,
  type ParticleEmitterDiagnostics,
  type ParticlePresetV1,
  type PixelBuffer,
} from 'flixel-pixi';
import type {
  ParticleEffectDocumentV1,
  ParticleEmitterLayerV1,
  PreviewSettings,
} from './editor-store';

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 220;

let activeState: ParticlePreviewState | undefined;
let pendingDocument: ParticleEffectDocumentV1;
let pendingTextureResolver: (layer: ParticleEmitterLayerV1) => PixelBuffer;

function previewBackground(color: string): {
  camera: number;
  renderer: number;
} {
  const renderer = Number.parseInt(color.slice(1), 16);
  return { camera: (0xff00_0000 | renderer) >>> 0, renderer };
}

function setActiveState(state: ParticlePreviewState | undefined): void {
  activeState = state;
}

interface PreviewEmitterInstance {
  layerId: string;
  emitter: FlxParticleEmitter;
  graphic: FlxGraphic;
  offset: { x: number; y: number };
}

interface PreviewEffectGroup {
  emitters: PreviewEmitterInstance[];
}

function burstPreset(preset: ParticlePresetV1): ParticlePresetV1 {
  if (preset.emission.mode === 'burst') return preset;
  return parseParticlePreset({
    ...structuredClone(preset),
    emission: {
      count: Math.max(1, Math.round(preset.emission.rate * 0.5)),
      mode: 'burst',
    },
  });
}

function trailPreset(preset: ParticlePresetV1): ParticlePresetV1 {
  if (preset.emission.mode === 'continuous') return preset;
  return parseParticlePreset({
    ...structuredClone(preset),
    emission: {
      mode: 'continuous',
      rate: Math.max(
        12,
        Math.min(120, Math.round(preset.emission.count * 0.65)),
      ),
    },
  });
}

class ParticlePreviewState extends FlxState {
  readonly #burstGroups: PreviewEffectGroup[] = [];
  #primaryGroup: PreviewEffectGroup | undefined;
  #effectSequence = 0;

  override create(): void {
    setActiveState(this);
    this.load(pendingDocument, pendingTextureResolver);
  }

  get diagnostics(): ParticleEmitterDiagnostics | undefined {
    const allEmitters: FlxParticleEmitter[] = [
      ...(this.#primaryGroup?.emitters.map((item) => item.emitter) ?? []),
      ...this.#burstGroups.flatMap((group) =>
        group.emitters.map((item) => item.emitter),
      ),
    ];
    if (allEmitters.length === 0) return undefined;

    const allDiagnostics = allEmitters.map((emitter) => emitter.diagnostics);
    const latest = allDiagnostics.at(-1);
    if (latest === undefined) return undefined;

    return {
      ...latest,
      activeCount: allDiagnostics.reduce(
        (total, item) => total + item.activeCount,
        0,
      ),
      capacity: allDiagnostics.reduce(
        (total, item) => total + item.capacity,
        0,
      ),
      droppedCount: allDiagnostics.reduce(
        (total, item) => total + item.droppedCount,
        0,
      ),
      emittedCount: allDiagnostics.reduce(
        (total, item) => total + item.emittedCount,
        0,
      ),
      emitting: allDiagnostics.some((item) => item.emitting),
      pooledCount: allDiagnostics.reduce(
        (total, item) => total + item.pooledCount,
        0,
      ),
    };
  }

  load(
    document: ParticleEffectDocumentV1,
    getTexture: (layer: ParticleEmitterLayerV1) => PixelBuffer,
    source?: { x: number; y: number },
  ): void {
    this.#destroyGroup(this.#primaryGroup);
    this.#primaryGroup = undefined;

    const enabledLayers = document.emitters.filter((layer) => layer.enabled);
    if (enabledLayers.length === 0) return;

    const emitterInstances: PreviewEmitterInstance[] = [];
    for (const layer of enabledLayers) {
      this.#effectSequence += 1;
      const texture = getTexture(layer);
      const graphic = FlxGraphic.fromPixels(
        texture,
        `particle-editor-primary-${layer.layerId}-${String(this.#effectSequence)}`,
      );
      const verticalVelocity = layer.preset.motion.velocity.y;
      const originY =
        verticalVelocity.min >= 0 ? 12 : verticalVelocity.max <= 0 ? 174 : 110;
      const posX = (source?.x ?? PREVIEW_WIDTH / 2) + layer.offset.x;
      const posY = (source?.y ?? originY) + layer.offset.y;

      const emitter = new FlxParticleEmitter(
        layer.preset,
        graphic,
        posX,
        posY,
      );
      this.add(emitter);
      emitter.start();
      emitterInstances.push({
        layerId: layer.layerId,
        emitter,
        graphic,
        offset: { ...layer.offset },
      });
    }

    this.#primaryGroup = { emitters: emitterInstances };
  }

  moveSource(x: number, y: number): void {
    if (this.#primaryGroup === undefined) return;
    for (const item of this.#primaryGroup.emitters) {
      item.emitter.x = x + item.offset.x;
      item.emitter.y = y + item.offset.y;
    }
  }

  spawnBurst(
    document: ParticleEffectDocumentV1,
    getTexture: (layer: ParticleEmitterLayerV1) => PixelBuffer,
    source?: { x: number; y: number },
  ): void {
    const enabledLayers = document.emitters.filter((layer) => layer.enabled);
    if (enabledLayers.length === 0) return;

    const emitterInstances: PreviewEmitterInstance[] = [];
    const originX = source?.x ?? PREVIEW_WIDTH / 2;
    const originY = source?.y ?? PREVIEW_HEIGHT / 2;

    for (const layer of enabledLayers) {
      this.#effectSequence += 1;
      const texture = getTexture(layer);
      const graphic = FlxGraphic.fromPixels(
        texture,
        `particle-editor-burst-${String(this.#effectSequence)}-${layer.layerId}`,
      );
      const emitter = new FlxParticleEmitter(
        burstPreset(layer.preset),
        graphic,
        originX + layer.offset.x,
        originY + layer.offset.y,
      );
      this.add(emitter);
      emitter.start();
      emitterInstances.push({
        layerId: layer.layerId,
        emitter,
        graphic,
        offset: { ...layer.offset },
      });
    }

    this.#burstGroups.push({ emitters: emitterInstances });
  }

  startTrail(
    document: ParticleEffectDocumentV1,
    getTexture: (layer: ParticleEmitterLayerV1) => PixelBuffer,
    source: { x: number; y: number },
  ): void {
    this.#destroyGroup(this.#primaryGroup);
    this.#primaryGroup = undefined;

    const enabledLayers = document.emitters.filter((layer) => layer.enabled);
    if (enabledLayers.length === 0) return;

    const emitterInstances: PreviewEmitterInstance[] = [];
    for (const layer of enabledLayers) {
      this.#effectSequence += 1;
      const texture = getTexture(layer);
      const graphic = FlxGraphic.fromPixels(
        texture,
        `particle-editor-trail-${String(this.#effectSequence)}-${layer.layerId}`,
      );
      const emitter = new FlxParticleEmitter(
        trailPreset(layer.preset),
        graphic,
        source.x + layer.offset.x,
        source.y + layer.offset.y,
      );
      this.add(emitter);
      emitter.start();
      emitterInstances.push({
        layerId: layer.layerId,
        emitter,
        graphic,
        offset: { ...layer.offset },
      });
    }

    this.#primaryGroup = { emitters: emitterInstances };
  }

  stopTrail(): void {
    if (this.#primaryGroup === undefined) return;
    for (const item of this.#primaryGroup.emitters) {
      item.emitter.stop(false);
    }
    this.#burstGroups.push(this.#primaryGroup);
    this.#primaryGroup = undefined;
  }

  pause(): void {
    if (this.#primaryGroup !== undefined) {
      for (const item of this.#primaryGroup.emitters) {
        item.emitter.pause();
      }
    }
  }

  resume(): void {
    if (this.#primaryGroup !== undefined) {
      for (const item of this.#primaryGroup.emitters) {
        item.emitter.resume();
      }
    }
  }

  stop(clear = false): void {
    if (this.#primaryGroup !== undefined) {
      for (const item of this.#primaryGroup.emitters) {
        item.emitter.stop(clear);
      }
    }
  }

  #destroyGroup(group: PreviewEffectGroup | undefined): void {
    if (group === undefined) return;
    for (const item of group.emitters) {
      this.remove(item.emitter, true);
      item.emitter.destroy();
      item.graphic.destroy();
    }
    group.emitters.length = 0;
  }

  override update(): void {
    super.update();
    for (let index = this.#burstGroups.length - 1; index >= 0; index -= 1) {
      const group = this.#burstGroups[index];
      if (group === undefined) continue;

      const isComplete = group.emitters.every(
        (item) =>
          !item.emitter.diagnostics.emitting &&
          item.emitter.diagnostics.activeCount === 0,
      );

      if (isComplete) {
        this.#destroyGroup(group);
        this.#burstGroups.splice(index, 1);
      }
    }
  }

  override destroy(): void {
    if (activeState === this) setActiveState(undefined);
    this.#destroyGroup(this.#primaryGroup);
    this.#primaryGroup = undefined;
    for (const group of this.#burstGroups) {
      this.#destroyGroup(group);
    }
    this.#burstGroups.length = 0;
    super.destroy();
  }
}

export interface ParticlePreviewController {
  burst(): void;
  destroy(): void;
  load(
    document: ParticleEffectDocumentV1,
    getTexture: (layer: ParticleEmitterLayerV1) => PixelBuffer,
  ): void;
  pause(): void;
  restart(): void;
  resume(): void;
  setBackground(color: string): void;
  setPointerMode(mode: PreviewSettings['pointerMode']): void;
  setTimeScale(scale: number): void;
}

export async function createParticlePreview(
  host: HTMLElement,
  initialDocument: ParticleEffectDocumentV1,
  getTexture: (layer: ParticleEmitterLayerV1) => PixelBuffer,
  onDiagnostics: (diagnostics: ParticleEmitterDiagnostics) => void,
): Promise<ParticlePreviewController> {
  pendingDocument = initialDocument;
  pendingTextureResolver = getTexture;

  const application: BrowserGameApplication = await createBrowserGame({
    accessibility: false,
    autoPause: false,
    backgroundColor: 0x07101c,
    height: 220,
    host,
    initialState: ParticlePreviewState,
    preloader: false,
    scaling: 'fit',
    width: 320,
  });

  const unsubscribe = application.onFrame(() => {
    const diagnostics = activeState?.diagnostics;
    if (diagnostics !== undefined) onDiagnostics(diagnostics);
  });

  const canvas = application.app.canvas as HTMLCanvasElement;
  let pointerMode: PreviewSettings['pointerMode'] = 'auto';
  let draggingPointer: number | undefined;

  const pointerPosition = (event: PointerEvent): { x: number; y: number } => {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    return {
      x: Math.max(
        0,
        Math.min(
          PREVIEW_WIDTH,
          ((event.clientX - bounds.left) / width) * PREVIEW_WIDTH,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          PREVIEW_HEIGHT,
          ((event.clientY - bounds.top) / height) * PREVIEW_HEIGHT,
        ),
      ),
    };
  };

  const endDrag = (event: PointerEvent): void => {
    if (event.pointerId !== draggingPointer) return;
    activeState?.stopTrail();
    draggingPointer = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (pointerMode === 'auto') return;
    event.preventDefault();
    const source = pointerPosition(event);
    if (pointerMode === 'burst') {
      activeState?.spawnBurst(pendingDocument, pendingTextureResolver, source);
      return;
    }
    draggingPointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    activeState?.startTrail(pendingDocument, pendingTextureResolver, source);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (pointerMode !== 'trail' || event.pointerId !== draggingPointer) return;
    event.preventDefault();
    const source = pointerPosition(event);
    activeState?.moveSource(source.x, source.y);
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  FlxG.bgColor = previewBackground('#07101c').camera;

  return {
    burst() {
      activeState?.spawnBurst(pendingDocument, pendingTextureResolver);
    },
    destroy() {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      unsubscribe();
      FlxG.timeScale = 1;
      application.destroy();
    },
    load(document, textureResolver) {
      pendingDocument = document;
      pendingTextureResolver = textureResolver;
      if (pointerMode === 'auto') {
        activeState?.load(document, textureResolver);
      } else {
        activeState?.stop(true);
      }
      application.syncRenderer();
    },
    pause() {
      activeState?.pause();
    },
    restart() {
      if (pointerMode === 'auto') {
        activeState?.load(pendingDocument, pendingTextureResolver);
      } else {
        activeState?.stop(true);
      }
    },
    resume() {
      activeState?.resume();
    },
    setBackground(color) {
      const background = previewBackground(color);
      application.app.renderer.background.color = background.renderer;
      FlxG.bgColor = background.camera;
    },
    setPointerMode(mode) {
      pointerMode = mode;
      draggingPointer = undefined;
      canvas.style.cursor = mode === 'auto' ? 'default' : 'crosshair';
      canvas.style.touchAction = mode === 'auto' ? 'auto' : 'none';
      if (mode === 'auto') {
        activeState?.load(pendingDocument, pendingTextureResolver);
      } else {
        activeState?.stop(true);
      }
    },
    setTimeScale(scale) {
      FlxG.timeScale = scale;
    },
  };
}
