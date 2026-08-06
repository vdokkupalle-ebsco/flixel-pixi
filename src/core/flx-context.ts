import { FlxRandom } from '../math/flx-random';
import { FlxRect } from '../math/flx-rect';
import type { FlxBasic } from './flx-basic';
import { FlxCamera } from './flx-camera';
import type { FlxState } from './flx-state';

/** Adapter hook used to mirror logical camera lifecycle into a renderer. @public */
export interface FlxCameraHost {
  addCamera(camera: FlxCamera): void;
  removeCamera(camera: FlxCamera): void;
}

/** Service token for the active camera renderer adapter. @public */
export const FLX_CAMERA_HOST_SERVICE = Symbol('flixel-pixi.camera-host');

/** Runtime bridge installed by a `FlxGame` into its context. @public */
export interface FlxStateRuntime {
  readonly state: FlxState | null;
  requestState(state: FlxState): void;
  resetState(): void;
}

/** Explicit owner of mutable engine state and replaceable services. @public */
export class FlxContext {
  elapsed = 0;
  paused = false;
  timeScale = 1;
  worldBounds: FlxRect;
  worldDivisions = 6;
  readonly levels: unknown[] = [];
  readonly scores: number[] = [];
  level = 0;
  score = 0;
  visualDebug = false;
  readonly randomSource: FlxRandom;
  readonly cameras: FlxCamera[] = [];
  readonly plugins: FlxBasic[] = [];
  camera: FlxCamera;

  readonly #services = new Map<symbol, unknown>();
  #runtime: FlxStateRuntime | null = null;

  constructor(
    readonly width: number,
    readonly height: number,
    seed = 0.5,
  ) {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new RangeError(
        'Context dimensions must be positive finite numbers.',
      );
    }

    this.randomSource = new FlxRandom(seed);
    this.worldBounds = new FlxRect(-10, -10, width + 20, height + 20);
    this.camera = new FlxCamera(0, 0, width, height);
    this.cameras.push(this.camera);
  }

  get state(): FlxState | null {
    return this.#runtime?.state ?? null;
  }

  attachRuntime(runtime: FlxStateRuntime): void {
    if (this.#runtime !== null && this.#runtime !== runtime) {
      throw new Error('A runtime is already attached to this context.');
    }
    this.#runtime = runtime;
  }

  detachRuntime(runtime: FlxStateRuntime): void {
    if (this.#runtime === runtime) this.#runtime = null;
  }

  requestState(state: FlxState): void {
    if (this.#runtime === null) throw new Error('No game runtime is attached.');
    this.#runtime.requestState(state);
  }

  resetState(): void {
    if (this.#runtime === null) throw new Error('No game runtime is attached.');
    this.#runtime.resetState();
  }

  addCamera(camera: FlxCamera): FlxCamera {
    if (camera.destroyed) throw new Error('Cannot add a destroyed camera.');
    if (!this.cameras.includes(camera)) {
      this.cameras.push(camera);
      this.getService<FlxCameraHost>(FLX_CAMERA_HOST_SERVICE)?.addCamera(
        camera,
      );
    }
    return camera;
  }

  removeCamera(camera: FlxCamera, destroy = true): boolean {
    const index = this.cameras.indexOf(camera);
    if (index < 0) return false;
    const host = this.getService<FlxCameraHost>(FLX_CAMERA_HOST_SERVICE);
    this.cameras.splice(index, 1);
    host?.removeCamera(camera);
    if (this.camera === camera) {
      this.camera =
        this.cameras[0] ?? new FlxCamera(0, 0, this.width, this.height);
      if (this.cameras.length === 0) {
        this.cameras.push(this.camera);
        host?.addCamera(this.camera);
      }
    }
    if (destroy) camera.destroy();
    return true;
  }

  resetCameras(
    camera = new FlxCamera(0, 0, this.width, this.height),
  ): FlxCamera {
    const host = this.getService<FlxCameraHost>(FLX_CAMERA_HOST_SERVICE);
    for (const current of this.cameras) {
      host?.removeCamera(current);
      if (current !== camera) current.destroy();
    }
    this.cameras.length = 0;
    this.camera = camera;
    this.cameras.push(camera);
    host?.addCamera(camera);
    return camera;
  }

  setPrimaryCamera(camera: FlxCamera): void {
    this.addCamera(camera);
    this.camera = camera;
  }

  updateCameras(): void {
    for (const camera of this.cameras) camera.update();
  }

  addPlugin<T extends FlxBasic>(plugin: T): T {
    const duplicate = this.plugins.some((current) => {
      return current.constructor === plugin.constructor;
    });
    if (!duplicate) this.plugins.push(plugin);
    return plugin;
  }

  getPlugin<T extends FlxBasic>(
    pluginClass: abstract new (...args: never[]) => T,
  ): T | null {
    return (
      (this.plugins.find(
        (plugin): plugin is T => plugin instanceof pluginClass,
      ) as T | undefined) ?? null
    );
  }

  removePlugin<T extends FlxBasic>(plugin: T): T {
    for (let index = this.plugins.length - 1; index >= 0; index -= 1) {
      if (this.plugins[index] === plugin) this.plugins.splice(index, 1);
    }
    return plugin;
  }

  removePluginType<T extends FlxBasic>(
    pluginClass: abstract new (...args: never[]) => T,
  ): boolean {
    let removed = false;
    for (let index = this.plugins.length - 1; index >= 0; index -= 1) {
      if (this.plugins[index] instanceof pluginClass) {
        this.plugins.splice(index, 1);
        removed = true;
      }
    }
    return removed;
  }

  updatePlugins(): void {
    const snapshot = [...this.plugins];
    for (const plugin of snapshot) {
      if (this.plugins.includes(plugin) && plugin.exists && plugin.active) {
        plugin.update();
      }
    }
  }

  drawPlugins(): void {
    const snapshot = [...this.plugins];
    for (const plugin of snapshot) {
      if (this.plugins.includes(plugin) && plugin.exists && plugin.visible) {
        plugin.draw();
      }
    }
  }

  destroyPlugins(): void {
    const snapshot = [...this.plugins];
    this.plugins.length = 0;
    for (const plugin of snapshot) plugin.destroy();
  }

  setService<T>(token: symbol, service: T): void {
    this.#services.set(token, service);
  }

  getService<T>(token: symbol): T | undefined {
    return this.#services.get(token) as T | undefined;
  }

  removeService(token: symbol): boolean {
    return this.#services.delete(token);
  }

  clearServices(): void {
    this.#services.clear();
  }
}
