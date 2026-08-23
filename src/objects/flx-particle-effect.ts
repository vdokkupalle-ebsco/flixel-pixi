import {
  parseParticleEffect,
  type ParticleEffectDocumentV1,
  type ParticleEmitterLayerV1,
} from '@flixel-pixi/schemas';

import { FlxAssets } from '../assets/flx-assets';
import { FlxFramesCollection } from '../animation/flx-frames-collection';
import { FlxG } from '../core/flx-g';
import { FlxGroup } from '../core/flx-group';
import {
  FlxParticleEmitter,
  type FlxParticleEmitterSource,
} from './flx-particle-emitter';

/** Resolve a preloaded particle texture or frame collection for one layer. @public */
export type FlxParticleEffectSourceResolver = (
  assetId: string,
  layer: Readonly<ParticleEmitterLayerV1>,
) => FlxParticleEmitterSource | undefined;

/** Options for creating a composed effect from preloaded {@link FlxAssets}. @public */
export interface FlxParticleEffectAssetOptions {
  assets?: FlxAssets;
  autoStart?: boolean;
  frames?: Readonly<Record<string, FlxFramesCollection>>;
  x?: number;
  y?: number;
}

/** Runtime association between an exported layer and its emitter. @public */
export interface FlxParticleEffectLayer {
  readonly definition: Readonly<ParticleEmitterLayerV1>;
  readonly emitter: FlxParticleEmitter;
}

/** Aggregate diagnostics across every enabled emitter layer. @public */
export interface FlxParticleEffectDiagnostics {
  activeCount: number;
  capacity: number;
  droppedCount: number;
  emittedCount: number;
  emitting: boolean;
  pooledCount: number;
}

/**
 * A movable, ordered group of emitters created from a Particle Editor export.
 * Add the effect itself to a state; its child emitters follow the document's
 * layer order and offsets.
 * @public
 */
export class FlxParticleEffect extends FlxGroup<FlxParticleEmitter> {
  /** Validated portable document used to construct this effect. */
  readonly document: ParticleEffectDocumentV1;
  /** Enabled runtime layers in document render order. */
  readonly layers: readonly FlxParticleEffectLayer[];
  /** World-space effect origin on the horizontal axis. */
  x: number;
  /** World-space effect origin on the vertical axis. */
  y: number;

  constructor(
    document: unknown,
    resolveSource: FlxParticleEffectSourceResolver,
    x = 0,
    y = 0,
  ) {
    const parsed = parseParticleEffect(document);
    const enabledLayers = parsed.emitters.filter((layer) => layer.enabled);
    super(enabledLayers.length);
    this.document = parsed;
    this.x = x;
    this.y = y;

    const resolvedLayers = enabledLayers.map((definition) => {
      const assetId = definition.preset.appearance.texture.assetId;
      const source = resolveSource(assetId, definition);
      if (source === undefined) {
        throw new Error(
          `Particle asset "${assetId}" for layer "${definition.layerId}" has not been loaded.`,
        );
      }
      return { definition, source };
    });

    const layers: FlxParticleEffectLayer[] = [];
    for (const { definition, source } of resolvedLayers) {
      const emitter = new FlxParticleEmitter(
        definition.preset,
        source,
        x + definition.offset.x,
        y + definition.offset.y,
      );
      emitter.active = definition.enabled;
      emitter.visible = definition.enabled;
      this.add(emitter);
      layers.push({ definition, emitter });
    }
    this.layers = layers;
  }

  /** Create an effect using textures already loaded by {@link FlxAssets}. */
  static fromAssets(
    document: unknown,
    options: FlxParticleEffectAssetOptions = {},
  ): FlxParticleEffect {
    const assets = options.assets ?? FlxAssets.fromContext(FlxG.context);
    if (assets === undefined) {
      throw new Error(
        'No FlxAssets service is installed in the active context.',
      );
    }
    const effect = new FlxParticleEffect(
      document,
      (assetId) => {
        const frames = options.frames?.[assetId] ?? assets.get(assetId);
        return frames instanceof FlxFramesCollection
          ? frames
          : assets.getGraphic(assetId);
      },
      options.x,
      options.y,
    );
    if (options.autoStart === true) effect.start();
    return effect;
  }

  /** Combined runtime counters for enabled layers. */
  get diagnostics(): FlxParticleEffectDiagnostics {
    const diagnostics: FlxParticleEffectDiagnostics = {
      activeCount: 0,
      capacity: 0,
      droppedCount: 0,
      emittedCount: 0,
      emitting: false,
      pooledCount: 0,
    };
    for (const { definition, emitter } of this.layers) {
      if (!definition.enabled) continue;
      const layer = emitter.diagnostics;
      diagnostics.activeCount += layer.activeCount;
      diagnostics.capacity += layer.capacity;
      diagnostics.droppedCount += layer.droppedCount;
      diagnostics.emittedCount += layer.emittedCount;
      diagnostics.emitting ||= layer.emitting;
      diagnostics.pooledCount += layer.pooledCount;
    }
    return diagnostics;
  }

  /** Move the effect origin while preserving every layer's local offset. */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.#syncLayerPositions();
  }

  /** Start every enabled layer in document order. */
  start(restart = true): void {
    this.revive();
    this.visible = true;
    this.#syncLayerPositions();
    for (const { definition, emitter } of this.layers) {
      if (!definition.enabled) continue;
      emitter.active = true;
      emitter.visible = true;
      emitter.start(restart);
    }
  }

  /** Pause every enabled layer without clearing active particles. */
  pause(): void {
    for (const { definition, emitter } of this.layers) {
      if (definition.enabled) emitter.pause();
    }
  }

  /** Resume every enabled layer from its paused state. */
  resume(): void {
    for (const { definition, emitter } of this.layers) {
      if (definition.enabled) emitter.resume();
    }
  }

  /** Reset the deterministic simulation and clear every enabled layer. */
  reset(): void {
    for (const { definition, emitter } of this.layers) {
      if (definition.enabled) emitter.resetPreset();
    }
  }

  /** Stop emission, optionally clearing all active particles. */
  stop(clear = false): void {
    for (const { definition, emitter } of this.layers) {
      if (definition.enabled) emitter.stop(clear);
    }
  }

  override update(): void {
    this.#syncLayerPositions();
    super.update();
  }

  #syncLayerPositions(): void {
    for (const { definition, emitter } of this.layers) {
      emitter.x = this.x + definition.offset.x;
      emitter.y = this.y + definition.offset.y;
    }
  }
}
