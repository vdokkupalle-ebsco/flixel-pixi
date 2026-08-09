import {
  Container,
  Graphics,
  RenderTexture,
  Sprite,
  type Renderer,
} from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import {
  FLX_CAMERA_HOST_SERVICE,
  type FlxCameraHost,
  type FlxContext,
} from '../core/flx-context';
import { FlxObject } from '../objects/flx-object';
import { FlxEmitter } from '../objects/flx-emitter';
import type { FlxSprite } from '../objects/flx-sprite';
import { DebugPathDisplay } from '../plugin/debug-path-display';
import { FlxTilemap } from '../tilemap/flx-tilemap';
import type { FlxEmitterRenderOptions } from './flx-emitter-render-handle';
import type { FlxRenderHandle } from './flx-render-handle';
import { FlxTilemapRenderHandle } from './flx-tilemap-render-handle';
import {
  interpolateCameraScrollX,
  interpolateCameraScrollY,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';

/** Pixi resources owned for one logical camera. @public */
export interface FlxCameraView {
  readonly container: Container;
  readonly output: Sprite;
  readonly target: RenderTexture;
}

interface RenderEntry {
  readonly object: FlxSprite | FlxTilemap | FlxEmitter;
  readonly handle: FlxRenderHandle;
}

function colorParts(
  argb: number,
  zeroAlphaIsOpaque = false,
): { alpha: number; color: number } {
  const alphaByte = argb >>> 24;
  return {
    alpha: alphaByte === 0 && zeroAlphaIsOpaque ? 1 : alphaByte / 255,
    color: argb & 0xffffff,
  };
}

/**
 * Pixi render-texture adapter for one logical world and any number of cameras.
 * @public
 */
export class FlxCameraRenderer implements FlxCameraHost {
  debugBounds = false;

  readonly #renderer: Renderer;
  readonly #outputStage: Container;
  readonly #context: FlxContext;
  readonly #cameraPass = new Container({ label: 'FlxCameraPass' });
  readonly #background = new Graphics({ label: 'FlxCameraBackground' });
  readonly #scene = new Container({ label: 'FlxCameraScene' });
  readonly #world = new Container({ label: 'FlxCameraWorld' });
  readonly #pathDebug = new Graphics({ label: 'FlxPathDebug' });
  readonly #debug = new Graphics({ label: 'FlxCameraDebug' });
  readonly #flash = new Graphics({ label: 'FlxCameraFlash' });
  readonly #fade = new Graphics({ label: 'FlxCameraFade' });
  readonly #views = new Map<FlxCamera, FlxCameraView>();
  readonly #entries = new Map<
    FlxSprite | FlxTilemap | FlxEmitter,
    RenderEntry
  >();
  #destroyed = false;

  constructor(renderer: Renderer, outputStage: Container, context: FlxContext) {
    this.#renderer = renderer;
    this.#outputStage = outputStage;
    this.#context = context;
    const installed = context.getService<FlxCameraHost>(
      FLX_CAMERA_HOST_SERVICE,
    );
    if (installed !== undefined && installed !== this) {
      throw new Error(
        'A camera renderer is already installed in this context.',
      );
    }
    context.setService(FLX_CAMERA_HOST_SERVICE, this);
    this.#scene.addChild(this.#world, this.#pathDebug, this.#debug);
    this.#cameraPass.addChild(
      this.#background,
      this.#scene,
      this.#flash,
      this.#fade,
    );
    for (const camera of context.cameras) this.addCamera(camera);
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  get cameraCount(): number {
    return this.#views.size;
  }

  get registeredObjectCount(): number {
    return this.#entries.size;
  }

  get registeredObjects(): IterableIterator<
    FlxSprite | FlxTilemap | FlxEmitter
  > {
    return this.#entries.keys();
  }

  get renderTargetBytes(): number {
    let bytes = 0;
    for (const view of this.#views.values()) {
      bytes +=
        view.target.source.pixelWidth * view.target.source.pixelHeight * 4;
    }
    return bytes;
  }

  addCamera(camera: FlxCamera): void {
    this.#assertUsable();
    if (camera.destroyed) throw new Error('Cannot add a destroyed camera.');
    if (this.#views.has(camera)) return;
    const target = RenderTexture.create({
      dynamic: true,
      height: camera.height,
      resolution: this.#renderer.resolution,
      width: camera.width,
    });
    const output = new Sprite({
      anchor: 0.5,
      label: 'FlxCameraOutput',
      texture: target,
    });
    output.position.set(camera.width * 0.5, camera.height * 0.5);
    const container = new Container({ label: 'FlxCameraViewport' });
    container.addChild(output);
    this.#outputStage.addChild(container);
    this.#views.set(camera, { container, output, target });
  }

  removeCamera(camera: FlxCamera): void {
    const view = this.#views.get(camera);
    if (view === undefined) return;
    this.#views.delete(camera);
    view.container.removeFromParent();
    view.container.destroy({ children: true });
    view.target.destroy(true);
  }

  add(
    object: FlxSprite | FlxTilemap | FlxEmitter,
    emitterOptions: FlxEmitterRenderOptions = {},
  ): FlxRenderHandle {
    this.#assertUsable();
    const existing = this.#entries.get(object);
    if (existing !== undefined) return existing.handle;
    const handle =
      object instanceof FlxTilemap
        ? new FlxTilemapRenderHandle(object)
        : object instanceof FlxEmitter
          ? object.createRenderHandle(emitterOptions)
          : object.createRenderHandle();
    this.#world.addChild(handle.view);
    this.#entries.set(object, { handle, object });
    return handle;
  }

  remove(
    object: FlxSprite | FlxTilemap | FlxEmitter,
    destroyHandle = true,
  ): boolean {
    const entry = this.#entries.get(object);
    if (entry === undefined) return false;
    this.#entries.delete(object);
    entry.handle.view.removeFromParent();
    if (destroyHandle) entry.handle.destroy();
    return true;
  }

  clearObjects(): void {
    this.#assertUsable();
    for (const entry of this.#entries.values()) {
      entry.handle.view.removeFromParent();
      entry.handle.destroy();
    }
    this.#entries.clear();
  }

  getCameraView(camera: FlxCamera): FlxCameraView | null {
    return this.#views.get(camera) ?? null;
  }

  resize(resolution = this.#renderer.resolution): void {
    this.#assertUsable();
    if (!Number.isFinite(resolution) || resolution <= 0) {
      throw new RangeError('Camera render resolution must be positive.');
    }
    for (const [camera, view] of this.#views) {
      view.target.resize(camera.width, camera.height, resolution);
      view.output.position.set(camera.width * 0.5, camera.height * 0.5);
    }
  }

  /** Render selected cameras, optionally between their previous and current fixed states. */
  render(
    cameras: readonly FlxCamera[] = this.#context.cameras,
    interpolationAlpha = 1,
  ): void {
    this.#assertUsable();
    if (
      !Number.isFinite(interpolationAlpha) ||
      interpolationAlpha < 0 ||
      interpolationAlpha > 1
    ) {
      throw new RangeError('interpolationAlpha must be between 0 and 1.');
    }
    this.#context.drawPlugins();
    for (const camera of cameras) {
      if (!this.#views.has(camera)) this.addCamera(camera);
      this.#renderCamera(camera, interpolationAlpha);
    }
    this.#syncOutputOrder();
    this.#renderer.render({ clear: true, container: this.#outputStage });
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    if (
      this.#context.getService<FlxCameraHost>(FLX_CAMERA_HOST_SERVICE) === this
    ) {
      this.#context.removeService(FLX_CAMERA_HOST_SERVICE);
    }
    for (const entry of this.#entries.values()) entry.handle.destroy();
    this.#entries.clear();
    for (const camera of [...this.#views.keys()]) this.removeCamera(camera);
    this.#cameraPass.destroy({ children: true });
  }

  #renderCamera(camera: FlxCamera, interpolationAlpha: number): void {
    const view = this.#views.get(camera);
    if (view === undefined) return;
    const visible = camera.exists && camera.visible;
    view.container.visible = visible;
    if (!visible) return;

    const background = colorParts(camera.bgColor);
    this.#background
      .clear()
      .rect(0, 0, camera.width, camera.height)
      .fill(background);

    this.#scene.position.set(camera.width * 0.5, camera.height * 0.5);
    this.#scene.pivot.set(camera.width * 0.5, camera.height * 0.5);
    this.#scene.scale.set(camera.zoom);
    this.#debug.clear();
    this.#pathDebug.clear();

    for (const [object, entry] of [...this.#entries.entries()]) {
      if (entry.handle.destroyed) {
        this.#entries.delete(object);
        continue;
      }
      entry.handle.sync(camera, interpolationAlpha);
      const routedCameras = object.cameras ?? this.#context.cameras;
      const routed = routedCameras.includes(camera);
      if (object instanceof FlxEmitter) {
        entry.handle.view.visible = routed && object.exists && object.visible;
        entry.handle.view.position.set(0, 0);
        if (this.debugBounds && !object.ignoreDrawDebug) {
          this.#debug
            .rect(
              object.x - Math.trunc(camera.scroll.x),
              object.y - Math.trunc(camera.scroll.y),
              object.width,
              object.height,
            )
            .stroke({
              alpha: 0.65,
              color: 0x0090e9,
              pixelLine: true,
              width: 1,
            });
        }
        continue;
      }
      const onScreen = routed && object.onScreen(camera);
      entry.handle.view.visible =
        onScreen &&
        object.exists &&
        object.visible &&
        (object instanceof FlxTilemap || object.alpha > 0);
      if (!entry.handle.view.visible) continue;
      const offset = object instanceof FlxTilemap ? null : object.offset;
      const cameraScrollX = interpolateCameraScrollX(
        camera,
        interpolationAlpha,
      );
      const cameraScrollY = interpolateCameraScrollY(
        camera,
        interpolationAlpha,
      );
      const x =
        interpolateObjectX(object, interpolationAlpha) -
        (offset?.x ?? 0) -
        Math.trunc(cameraScrollX * object.scrollFactor.x);
      const y =
        interpolateObjectY(object, interpolationAlpha) -
        (offset?.y ?? 0) -
        Math.trunc(cameraScrollY * object.scrollFactor.y);
      entry.handle.view.position.set(x, y);

      if (this.debugBounds && !object.ignoreDrawDebug) {
        const color =
          object.allowCollisions === FlxObject.NONE
            ? 0x0090e9
            : object.immovable
              ? 0x00f225
              : 0xff0012;
        this.#debug
          .rect(
            object.x - Math.trunc(camera.scroll.x * object.scrollFactor.x),
            object.y - Math.trunc(camera.scroll.y * object.scrollFactor.y),
            object.width,
            object.height,
          )
          .stroke({ alpha: 0.65, color, pixelLine: true, width: 1 });
      }
    }

    const pathDisplay = this.#context.getPlugin(DebugPathDisplay);
    if (
      this.#context.visualDebug &&
      pathDisplay?.exists &&
      pathDisplay.visible &&
      !pathDisplay.ignoreDrawDebug
    ) {
      pathDisplay.drawTo(this.#pathDebug, camera);
    }

    this.#drawEffect(this.#flash, camera.flashColor, camera.flashAlpha, camera);
    this.#drawEffect(this.#fade, camera.fadeColor, camera.fadeAlpha, camera);
    this.#renderer.render({
      clear: true,
      container: this.#cameraPass,
      target: view.target,
    });

    view.container.position.set(
      camera.x + camera.shakeOffset.x,
      camera.y + camera.shakeOffset.y,
    );
    view.output.position.set(
      camera.width * 0.5 * camera.scale.x,
      camera.height * 0.5 * camera.scale.y,
    );
    view.output.scale.copyFrom(camera.scale);
    view.output.angle = camera.angle;
    view.output.alpha = camera.alpha;
    view.output.tint = camera.color;
    view.output.texture.source.scaleMode = camera.antialiasing
      ? 'linear'
      : 'nearest';
  }

  #drawEffect(
    graphics: Graphics,
    color: number,
    progress: number,
    camera: FlxCamera,
  ): void {
    graphics.clear();
    if (progress <= 0) return;
    const parts = colorParts(color, true);
    graphics
      .rect(0, 0, camera.width, camera.height)
      .fill({ alpha: parts.alpha * progress, color: parts.color });
  }

  #syncOutputOrder(): void {
    let index = 0;
    for (const camera of this.#context.cameras) {
      const view = this.#views.get(camera);
      if (view === undefined || view.container.parent !== this.#outputStage) {
        continue;
      }
      this.#outputStage.setChildIndex(view.container, index);
      index += 1;
    }
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('Camera renderer is destroyed.');
  }
}
