/**
 * Browser-native TypeScript port of the original ActionScript 3 Flixel engine,
 * using PixiJS v8 as its rendering foundation.
 *
 * @packageDocumentation
 */

export { libraryName, upstreamBaseline } from './meta';
export type { UpstreamBaseline } from './meta';
export { FixedStepAccumulator } from './core/fixed-step-accumulator';
export type {
  FixedStepAccumulatorOptions,
  FixedStepAdvanceResult,
} from './core/fixed-step-accumulator';
export { FlxBasic } from './core/flx-basic';
export {
  FLX_ASSETS_SERVICE,
  FlxAssetLoadError,
  FlxAssets,
} from './assets/flx-assets';
export type {
  FlxAssetBackend,
  FlxAssetBundle,
  FlxAssetDescriptor,
  FlxAssetInitOptions,
  FlxAssetLoadOptions,
  FlxAssetManifest,
} from './assets/flx-assets';
export { FlxGraphic } from './assets/flx-graphic';

// --- Atlas ---
export { FlxAtlas } from './assets/flx-atlas';
export { FlxAtlasRegistry } from './assets/flx-atlas-registry';
export { FLX_ATLAS_SERVICE } from './core/flx-context';
export type {
  FlxAtlasFrame,
  FlxAtlasFrameList,
  FlxAtlasFrameRect,
  FlxAtlasGridMeta,
  FlxAtlasMeta,
  FlxAtlasPrefixOptions,
} from './assets/flx-atlas-frame';
export { FlxContext } from './core/flx-context';
export { FLX_CAMERA_HOST_SERVICE } from './core/flx-context';
export type { FlxCameraHost, FlxStateRuntime } from './core/flx-context';
export { FlxCamera } from './core/flx-camera';
export type {
  FlxCameraEffectCallback,
  FlxCameraFollowStyle,
  FlxCameraShakeDirection,
} from './core/flx-camera';
export { FlxG } from './core/flx-g';
export type { FlxPluginConstructor } from './core/flx-g';
export { FlxGame } from './core/flx-game';
export { FlxGroup } from './core/flx-group';
export type { FlxBasicConstructor } from './core/flx-group';
export { FlxContainer } from './core/flx-container';
export { FlxState } from './core/flx-state';
export type { FlxStateConstructor } from './core/flx-state';
export { FlxSubState } from './core/flx-sub-state';
export type { FlxSubStateCallback } from './core/flx-sub-state';
export { FlxSignal } from './core/flx-signal';
export type { FlxSignalListener } from './core/flx-signal';
export { FlxQuadTree } from './collision/flx-quadtree';
export type {
  FlxOverlapCallback,
  FlxProcessCallback,
} from './collision/flx-quadtree';
export { makeGraphicPixels } from './compat/pixel-buffer';
export type { PixelBuffer } from './compat/pixel-buffer';
export { FlxPoint } from './math/flx-point';
export type { PointLike } from './math/flx-point';
export { FlxRandom, nextFlixelSeed } from './math/flx-random';
export { FlxRect } from './math/flx-rect';
export type { RectangleLike } from './math/flx-rect';
export { FlxU } from './math/flx-u';
export { Input } from './input/input';
export type { FlxKeyRecord } from './input/input';
export { Keyboard } from './input/keyboard';
export type { FlxKeyboardEventLike } from './input/keyboard';
export { Mouse } from './input/mouse';
export type { FlxMouseRecord, FlxPointerEventLike } from './input/mouse';
export { FlxTouch, FlxTouchManager } from './input/flx-touch';
export type {
  FlxSwipe,
  FlxSwipeDirection,
  FlxTouchEventLike,
  FlxTouchFrameRecord,
  FlxTouchOptions,
} from './input/flx-touch';
export {
  FlxGamepad,
  FlxGamepadButton,
  FlxGamepadManager,
} from './input/flx-gamepad';
export type {
  FlxGamepadButtonLike,
  FlxGamepadFrameRecord,
  FlxGamepadLike,
  FlxGamepadProvider,
} from './input/flx-gamepad';
export { FLX_INPUT_SERVICE, FlxInputManager } from './input/flx-input-manager';
export type {
  FlxInputManagerOptions,
  FlxInputService,
} from './input/flx-input-manager';
export { FlxObject } from './objects/flx-object';
export type { FlxCameraLike } from './objects/flx-object';
export { FlxAnim } from './objects/flx-anim';
export { FlxAnimationController } from './animation/flx-animation-controller';
export type { FlxAnimationFrameEvent } from './animation/flx-animation-controller';
export { FlxFrame } from './animation/flx-frame';
export { FlxFramesCollection } from './animation/flx-frames-collection';
export type { FlxGridFramesOptions } from './animation/flx-frames-collection';
export { FlxNineSliceButton } from './objects/flx-nine-slice-button';
export { FlxNineSliceSprite } from './objects/flx-nine-slice-sprite';
export type {
  FlxNineSliceBorderInput,
  FlxNineSliceBorders,
} from './objects/flx-nine-slice';
export { FlxButton } from './objects/flx-button';
export type { FlxButtonCallback, FlxButtonSound } from './objects/flx-button';
export { FlxBar } from './objects/flx-bar';
export type {
  FlxBarCallback,
  FlxBarFillDirection,
  FlxBarParentLike,
  FlxBarValueProvider,
} from './objects/flx-bar';
export { FlxPath } from './objects/flx-path';
export { FlxTimer } from './objects/flx-timer';
export type { FlxTimerCallback } from './objects/flx-timer';
export { FlxParticle } from './objects/flx-particle';
export { FlxEmitter } from './objects/flx-emitter';
export type { FlxParticleConstructor } from './objects/flx-emitter';
export { FlxSprite } from './objects/flx-sprite';
export type {
  FlxAnimationCallback,
  FlxAnimationPlayOptions,
  FlxAtlasAnimationOptions,
} from './objects/flx-sprite';
export { FlxSpriteContainer, FlxSpriteGroup } from './objects/flx-sprite-group';
export type { FlxSpriteTransform } from './objects/flx-sprite-group';
export { FlxText } from './objects/flx-text';
export type { FlxTextRenderMode } from './objects/flx-text';
export { FlxTileblock } from './objects/flx-tileblock';
export { FlxTile } from './tilemap/flx-tile';
export type { FlxTileCallback, FlxTileFilter } from './tilemap/flx-tile';
export { FlxTilemap } from './tilemap/flx-tilemap';
export type {
  FlxTilemapLoadOptions,
  FlxTilemapOverlapCallback,
} from './tilemap/flx-tilemap';
export { FlxTilemapBuffer } from './tilemap/flx-tilemap-buffer';
export type { FlxRenderHandle } from './rendering/flx-render-handle';
export { FlxCameraRenderer } from './rendering/flx-camera-renderer';
export type { FlxCameraView } from './rendering/flx-camera-renderer';
export { FlxSpriteRenderHandle } from './rendering/flx-sprite-render-handle';
export { FlxSpriteGroupRenderHandle } from './rendering/flx-sprite-group-render-handle';
export { FlxEmitterRenderHandle } from './rendering/flx-emitter-render-handle';
export type { FlxEmitterRenderOptions } from './rendering/flx-emitter-render-handle';
export { FlxNineSliceButtonRenderHandle } from './rendering/flx-nine-slice-button-render-handle';
export { FlxNineSliceRenderHandle } from './rendering/flx-nine-slice-render-handle';
export { FlxButtonRenderHandle } from './rendering/flx-button-render-handle';
export { FlxBarRenderHandle } from './rendering/flx-bar-render-handle';
export { FlxTextRenderHandle } from './rendering/flx-text-render-handle';
export type { FlxPixiTextNode } from './rendering/flx-text-render-handle';
export { FlxTilemapRenderHandle } from './rendering/flx-tilemap-render-handle';
export { TimerManager } from './plugin/timer-manager';
export { DebugPathDisplay } from './plugin/debug-path-display';

// --- Tweens ---
export { FlxEase } from './tweens/flx-ease';
export type { FlxEaseFunction } from './tweens/flx-ease';
export { FlxNumTween, FlxTween, FlxVarTween } from './tweens/flx-tween';
export type {
  FlxTweenCallback,
  FlxTweenOptions,
  FlxTweenType,
} from './tweens/flx-tween';
export { FlxTweenManager } from './tweens/flx-tween-manager';
export {
  FlxAngleTween,
  FlxColorTween,
  FlxFlickerTween,
  FlxShakeTween,
} from './tweens/flx-tween-misc';
export {
  FlxCircularMotion,
  FlxCubicMotion,
  FlxLinearMotion,
  FlxLinearPath,
  FlxMotion,
  FlxQuadMotion,
  FlxQuadPath,
} from './tweens/flx-tween-motion';
export type {
  FlxColorTweenTarget,
  FlxFlickerTweenOptions,
  FlxTweenAxes,
  FlxTweenColor,
  FlxTweenColorValue,
} from './tweens/flx-tween-misc';

// --- Audio ---
export { FLX_AUDIO_SERVICE } from './audio/flx-audio-backend';
export type {
  FlxAudioBackend,
  FlxSoundHandle,
} from './audio/flx-audio-backend';
export { FlxSound } from './audio/flx-sound';
export { FlxAudioManager } from './audio/flx-audio-manager';
export type { FlxAudioService } from './audio/flx-audio-manager';
export { NullAudioBackend } from './audio/null-audio-backend';
export { WebAudioBackend } from './audio/web-audio-backend';

// --- Persistent storage ---
export { FLX_STORAGE_SERVICE } from './storage/flx-storage-backend';
export type {
  FlxAsyncStorageBackend,
  FlxSaveResult,
  FlxStorageBackend,
} from './storage/flx-storage-backend';
export { FlxSave } from './storage/flx-save';
export type { FlxSaveBindOptions, FlxSaveMigration } from './storage/flx-save';
export { NullStorageBackend } from './storage/null-storage-backend';
export { LocalStorageBackend } from './storage/local-storage-backend';
export { IndexedDBBackend } from './storage/indexed-db-backend';

// --- Replay and deterministic verification ---
export { MouseRecord } from './replay/mouse-record';
export { FrameRecord } from './replay/frame-record';
export type { CodePair, FrameRecordData } from './replay/frame-record';
export { FlxReplay } from './replay/flx-replay';
export type { ReplayFileFormat } from './replay/flx-replay';
export {
  convertAS3ReplayToFlxReplay,
  convertFlxReplayToAS3Text,
} from './replay/as3-replay-adapter';
export type { FlxVCR } from './replay/flx-vcr';

// --- Debugger and preloader ---
export { DebugChannel } from './debugger/debug-channel';
export type { DebugEvents, DebugEventType } from './debugger/debug-channel';
export { FlxLog, FLX_LOG_SERVICE } from './debugger/flx-log';
export type { LogEntry } from './debugger/flx-log';
export { FlxWatch, FLX_WATCH_SERVICE } from './debugger/flx-watch';
export type { WatchEntry, WatchSnapshot } from './debugger/flx-watch';
export { FlxPreloader } from './debugger/flx-preloader';
export type {
  FlxPreloaderOptions,
  FlxPreloaderTheme,
  FlxPreloaderView,
  FlxPreloaderViewContext,
  FlxPreloaderViewFactory,
  PreloaderState,
} from './debugger/flx-preloader';
export { FlxFpsDisplay } from './debugger/flx-fps-display';
export type {
  FlxFpsDisplayOptions,
  FlxFpsMetrics,
  FlxFpsDisplayPosition,
  FlxFpsDisplayTheme,
} from './debugger/flx-fps-display';
export { FlxDebugger } from './debugger/flx-debugger';
export type {
  FlxDebuggerOptions,
  FlxDebuggerVCRCallbacks,
} from './debugger/flx-debugger';

export { FlxActions } from './input/flx-actions';
export type {
  FlxActionBindingsData,
  FlxActionGamepadAxisSource,
  FlxActionGamepadButtonSource,
  FlxActionGamepadButtonAxisSource,
  FlxActionGamepadTarget,
  FlxActionKeyboardAxisSource,
  FlxActionKeyboardSource,
  FlxActionMouseSource,
  FlxActionRebindOptions,
  FlxActionSource,
  FlxActionWheelSource,
} from './input/flx-actions';

// --- Loading ---

export {
  FlxLoadingError,
  FlxLoadingSession,
  throwIfAborted,
} from './loading/flx-loading';
export type {
  FlxLoadingBundleOptions,
  FlxLoadingSnapshot,
  FlxLoadingStage,
  FlxLoadingState,
  FlxLoadingTaskContext,
  FlxLoadingTaskOptions,
  FlxLoadingUpdate,
} from './loading/flx-loading';

// --- Game Maker DX ---

export { createBrowserGame } from './browser/create-browser-game';
export type {
  BrowserGameApplication,
  BrowserGameAssetOptions,
  BrowserGameFrame,
  BrowserGamePreloadContext,
  BrowserGamePreloaderOptions,
  CreateBrowserGameOptions,
} from './browser/create-browser-game';
export {
  collectRenderables,
  syncWorldToRenderer,
} from './rendering/flx-world-sync';
export type { FlxRenderable } from './rendering/flx-world-sync';
