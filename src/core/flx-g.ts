/* eslint-disable @typescript-eslint/no-extraneous-class -- AS3 compatibility facade. */
import { FLX_AUDIO_SERVICE } from '../audio/flx-audio-backend';
import type { FlxAudioService } from '../audio/flx-audio-manager';
import type { FlxSound } from '../audio/flx-sound';
import {
  FlxQuadTree,
  type FlxOverlapCallback,
  type FlxProcessCallback,
} from '../collision/flx-quadtree';
import type { FlxRect } from '../math/flx-rect';
import {
  FLX_INPUT_SERVICE,
  type FlxInputService,
} from '../input/flx-input-manager';
import type { Keyboard } from '../input/keyboard';
import type { Mouse } from '../input/mouse';
import { FlxObject } from '../objects/flx-object';
import type { FlxSave } from '../storage/flx-save';
import { FLX_STORAGE_SERVICE } from '../storage/flx-storage-backend';
import { FlxTilemap } from '../tilemap/flx-tilemap';
import type { FlxBasic } from './flx-basic';
import type {
  FlxCamera,
  FlxCameraEffectCallback,
  FlxCameraShakeDirection,
} from './flx-camera';
import type { FlxContext } from './flx-context';
import type { FlxGroup } from './flx-group';
import type { FlxState } from './flx-state';

/** Constructor used by the plugin compatibility facade. @public */
export type FlxPluginConstructor<T extends FlxBasic = FlxBasic> = abstract new (
  ...args: never[]
) => T;

/** Static compatibility facade delegating to one active {@link FlxContext}. @public */
export class FlxG {
  static readonly LIBRARY_NAME = 'flixel-pixi';
  static readonly LIBRARY_MAJOR_VERSION = 0;
  static readonly LIBRARY_MINOR_VERSION = 0;

  static readonly DEBUGGER_STANDARD = 0;
  static readonly DEBUGGER_MICRO = 1;
  static readonly DEBUGGER_BIG = 2;
  static readonly DEBUGGER_TOP = 3;
  static readonly DEBUGGER_LEFT = 4;
  static readonly DEBUGGER_RIGHT = 5;

  static readonly RED = 0xffff0012;
  static readonly GREEN = 0xff00f225;
  static readonly BLUE = 0xff0090e9;
  static readonly PINK = 0xfff01eff;
  static readonly WHITE = 0xffffffff;
  static readonly BLACK = 0xff000000;

  static #context: FlxContext | null = null;

  static get hasContext(): boolean {
    return FlxG.#context !== null;
  }

  static get context(): FlxContext {
    if (FlxG.#context === null) {
      throw new Error(
        'FlxG has no active FlxContext. Create or activate a FlxGame first.',
      );
    }
    return FlxG.#context;
  }

  static installContext(context: FlxContext): void {
    if (FlxG.#context !== null && FlxG.#context !== context) {
      throw new Error(
        'Only one FlxContext can be active in a JavaScript realm.',
      );
    }
    FlxG.#context = context;
  }

  static clearContext(context?: FlxContext): void {
    if (context === undefined || FlxG.#context === context)
      FlxG.#context = null;
  }

  static get width(): number {
    return FlxG.context.width;
  }

  static get height(): number {
    return FlxG.context.height;
  }

  static get cameras(): readonly FlxCamera[] {
    return FlxG.context.cameras;
  }

  static get camera(): FlxCamera {
    return FlxG.context.camera;
  }

  static set camera(value: FlxCamera) {
    FlxG.context.setPrimaryCamera(value);
  }

  static get keys(): Keyboard {
    return FlxG.#input.keys;
  }

  static get mouse(): Mouse {
    return FlxG.#input.mouse;
  }

  static get elapsed(): number {
    return FlxG.context.elapsed;
  }

  static set elapsed(value: number) {
    FlxG.context.elapsed = value;
  }

  static get timeScale(): number {
    return FlxG.context.timeScale;
  }

  static set timeScale(value: number) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError('timeScale must be a non-negative finite number.');
    }
    FlxG.context.timeScale = value;
  }

  static get paused(): boolean {
    return FlxG.context.paused;
  }

  static set paused(value: boolean) {
    FlxG.context.paused = value;
  }

  static get globalSeed(): number {
    return FlxG.context.randomSource.seed;
  }

  static set globalSeed(value: number) {
    if (!Number.isFinite(value))
      throw new RangeError('globalSeed must be finite.');
    FlxG.context.randomSource.seed = value;
  }

  static get worldBounds(): FlxRect {
    return FlxG.context.worldBounds;
  }

  static set worldBounds(value: FlxRect) {
    FlxG.context.worldBounds = value;
  }

  static get worldDivisions(): number {
    return FlxG.context.worldDivisions;
  }

  static set worldDivisions(value: number) {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError('worldDivisions must be a positive integer.');
    }
    FlxG.context.worldDivisions = value;
  }

  static get levels(): unknown[] {
    return FlxG.context.levels;
  }

  static get scores(): number[] {
    return FlxG.context.scores;
  }

  static get plugins(): readonly FlxBasic[] {
    return FlxG.context.plugins;
  }

  static get visualDebug(): boolean {
    return FlxG.context.visualDebug;
  }

  static set visualDebug(value: boolean) {
    FlxG.context.visualDebug = value;
  }

  static get level(): number {
    return FlxG.context.level;
  }

  static set level(value: number) {
    FlxG.context.level = value;
  }

  static get score(): number {
    return FlxG.context.score;
  }

  static set score(value: number) {
    FlxG.context.score = value;
  }

  static get state(): FlxState | null {
    return FlxG.context.state;
  }

  static get #input(): FlxInputService {
    const input = FlxG.context.getService<FlxInputService>(FLX_INPUT_SERVICE);
    if (input === undefined) {
      throw new Error(
        'No input service is installed in the active FlxContext.',
      );
    }
    return input;
  }

  static get #audio(): FlxAudioService {
    const audio = FlxG.context.getService<FlxAudioService>(FLX_AUDIO_SERVICE);
    if (audio === undefined) {
      throw new Error(
        'No audio service is installed in the active FlxContext.',
      );
    }
    return audio;
  }

  static random(): number {
    return FlxG.context.randomSource.next();
  }

  static getRandom<T>(
    objects: readonly T[] | null,
    startIndex = 0,
    length = 0,
  ): T | null {
    if (objects === null || startIndex < 0 || startIndex >= objects.length) {
      return null;
    }

    const available = objects.length - startIndex;
    const selectionLength =
      length === 0 || length > available ? available : length;
    if (selectionLength <= 0) return null;
    return (
      objects[startIndex + Math.floor(FlxG.random() * selectionLength)] ?? null
    );
  }

  static shuffle<T>(objects: T[], howManyTimes: number): T[] {
    for (let index = 0; index < howManyTimes; index += 1) {
      const first = Math.floor(FlxG.random() * objects.length);
      const second = Math.floor(FlxG.random() * objects.length);
      [objects[first], objects[second]] = [
        objects[second] as T,
        objects[first] as T,
      ];
    }
    return objects;
  }

  static switchState(state: FlxState): void {
    FlxG.context.requestState(state);
  }

  static resetState(): void {
    FlxG.context.resetState();
  }

  static resetInput(): void {
    FlxG.#input.resetInput();
  }

  static addPlugin<T extends FlxBasic>(plugin: T): T {
    return FlxG.context.addPlugin(plugin);
  }

  static getPlugin<T extends FlxBasic>(
    pluginClass: FlxPluginConstructor<T>,
  ): T | null {
    return FlxG.context.getPlugin(pluginClass);
  }

  static removePlugin<T extends FlxBasic>(plugin: T): T {
    return FlxG.context.removePlugin(plugin);
  }

  static removePluginType<T extends FlxBasic>(
    pluginClass: FlxPluginConstructor<T>,
  ): boolean {
    return FlxG.context.removePluginType(pluginClass);
  }

  static addCamera(camera: FlxCamera): FlxCamera {
    return FlxG.context.addCamera(camera);
  }

  static removeCamera(camera: FlxCamera, destroy = true): boolean {
    return FlxG.context.removeCamera(camera, destroy);
  }

  static resetCameras(camera?: FlxCamera): FlxCamera {
    return camera === undefined
      ? FlxG.context.resetCameras()
      : FlxG.context.resetCameras(camera);
  }

  static flash(
    color = 0xffffffff,
    duration = 1,
    onComplete: FlxCameraEffectCallback | null = null,
    force = false,
  ): void {
    for (const camera of FlxG.cameras) {
      camera.flash(color, duration, onComplete, force);
    }
  }

  static fade(
    color = 0xff000000,
    duration = 1,
    onComplete: FlxCameraEffectCallback | null = null,
    force = false,
  ): void {
    for (const camera of FlxG.cameras) {
      camera.fade(color, duration, onComplete, force);
    }
  }

  static shake(
    intensity = 0.05,
    duration = 0.5,
    onComplete: FlxCameraEffectCallback | null = null,
    force = true,
    direction: FlxCameraShakeDirection = 0,
  ): void {
    for (const camera of FlxG.cameras) {
      camera.shake(intensity, duration, onComplete, force, direction);
    }
  }

  static get bgColor(): number {
    return FlxG.camera.bgColor;
  }

  static set bgColor(value: number) {
    for (const camera of FlxG.cameras) camera.bgColor = value >>> 0;
  }

  static overlap(
    first: FlxBasic | null = null,
    second: FlxBasic | null = null,
    notify: FlxOverlapCallback | null = null,
    process: FlxProcessCallback | null = null,
  ): boolean {
    const firstTarget = first ?? FlxG.state;
    if (firstTarget === null) return false;
    const secondTarget = second === firstTarget ? null : second;
    if (firstTarget instanceof FlxTilemap && secondTarget !== null) {
      return FlxG.#overlapTilemap(
        firstTarget,
        secondTarget,
        true,
        notify,
        process,
      );
    }
    if (secondTarget instanceof FlxTilemap) {
      return FlxG.#overlapTilemap(
        secondTarget,
        firstTarget,
        false,
        notify,
        process,
      );
    }
    FlxQuadTree.divisions = FlxG.worldDivisions;
    const bounds = FlxG.worldBounds;
    const tree = new FlxQuadTree(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
    );
    try {
      tree.load(firstTarget, secondTarget, notify, process);
      return tree.execute();
    } finally {
      tree.destroy();
    }
  }

  static collide(
    first: FlxBasic | null = null,
    second: FlxBasic | null = null,
    notify: FlxOverlapCallback | null = null,
  ): boolean {
    return FlxG.overlap(first, second, notify, FlxObject.separate);
  }

  static getLibraryName(): string {
    return `${FlxG.LIBRARY_NAME} v${FlxG.LIBRARY_MAJOR_VERSION}.${FlxG.LIBRARY_MINOR_VERSION}`;
  }

  // ── Audio facade ──────────────────────────────────────────────────────

  /** The currently playing music track, or `null`. */
  static get music(): FlxSound | null {
    return FlxG.#audio.music;
  }

  /** The active sound-effects group. */
  static get sounds(): FlxGroup {
    return FlxG.#audio.sounds;
  }

  /** Global volume (0–1). */
  static get volume(): number {
    return FlxG.#audio.volume;
  }

  static set volume(value: number) {
    FlxG.#audio.volume = value;
  }

  /** Global mute flag. */
  static get mute(): boolean {
    return FlxG.#audio.mute;
  }

  static set mute(value: boolean) {
    FlxG.#audio.mute = value;
  }

  /**
   * Play a sound effect.
   * @param source - `AudioBuffer`, URL string, or asset alias.
   * @param volume - Per-instance volume (0–1).  Defaults to 1.
   * @param loop - Whether to loop.  Defaults to false.
   * @param autoDestroy - Whether to auto-destroy when done.  Defaults to true.
   */
  static play(
    source: unknown,
    volume?: number,
    loop?: boolean,
    autoDestroy?: boolean,
  ): FlxSound {
    return FlxG.#audio.play(source, volume, loop, autoDestroy);
  }

  /**
   * Play music, stopping the current track.
   * @param source - `AudioBuffer`, URL string, or asset alias.
   * @param volume - Volume (0–1).  Defaults to 1.
   */
  static playMusic(source: unknown, volume?: number): void {
    FlxG.#audio.playMusic(source, volume);
  }

  /**
   * Play a streaming sound from a URL.
   * @param url - The streaming URL.
   * @param volume - Per-instance volume (0–1).  Defaults to 1.
   * @param loop - Whether to loop.  Defaults to false.
   * @param autoDestroy - Whether to auto-destroy when done.  Defaults to true.
   */
  static stream(
    url: string,
    volume?: number,
    loop?: boolean,
    autoDestroy?: boolean,
  ): FlxSound {
    return FlxG.#audio.stream(url, volume, loop, autoDestroy);
  }

  /** Pause all sounds and music. */
  static pauseSounds(): void {
    FlxG.#audio.pauseSounds();
  }

  /** Resume all sounds and music. */
  static resumeSounds(): void {
    FlxG.#audio.resumeSounds();
  }

  // ── Save facade ──────────────────────────────────────────────────────

  /** Primary save slot. */
  static get save(): FlxSave {
    interface SaveService {
      save: FlxSave;
      saves: FlxSave[];
    }
    const svc = FlxG.context.getService<SaveService>(FLX_STORAGE_SERVICE);
    if (svc === undefined) {
      throw new Error(
        'No storage service is installed in the active FlxContext.',
      );
    }
    return svc.save;
  }

  /** All registered save slots. */
  static get saves(): FlxSave[] {
    interface SaveService {
      save: FlxSave;
      saves: FlxSave[];
    }
    const svc = FlxG.context.getService<SaveService>(FLX_STORAGE_SERVICE);
    if (svc === undefined) {
      throw new Error(
        'No storage service is installed in the active FlxContext.',
      );
    }
    return svc.saves;
  }

  static #overlapTilemap(
    tilemap: FlxTilemap,
    target: FlxBasic,
    tilemapFirst: boolean,
    notify: FlxOverlapCallback | null,
    process: FlxProcessCallback | null,
  ): boolean {
    if (target instanceof FlxObject) {
      return tilemap.overlapsWithCallback(
        target,
        (first, second) => {
          const accepted = process?.(first, second) ?? first.overlaps(second);
          if (accepted) notify?.(first, second);
          return accepted;
        },
        !tilemapFirst,
      );
    }
    const members =
      'members' in target && Array.isArray(target.members)
        ? (target.members as readonly (FlxBasic | null)[])
        : [];
    let result = false;
    for (const member of members) {
      if (
        member !== null &&
        FlxG.#overlapTilemap(tilemap, member, tilemapFirst, notify, process)
      ) {
        result = true;
      }
    }
    return result;
  }
}
