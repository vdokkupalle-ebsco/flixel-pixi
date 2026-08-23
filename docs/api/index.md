---
title: API Reference
description: Complete public API reference for Flixel-Pixi game engine.
editLink: false
---

# API Reference

Complete reference for all classes, functions, interfaces, and types exported by `flixel-pixi`.

## Core & Lifecycle

Game container, states, loop execution, context, and basic entities.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FixedStepAccumulator`**](./fixedstepaccumulator.md) | `Class` | Converts variable display-frame durations into deterministic simulation updates. Rendering may consume `alpha`, but simulation must not. |
| [**`FixedStepAccumulatorOptions`**](./fixedstepaccumulatoroptions.md) | `Interface` | Configuration for a deterministic fixed-step accumulator. |
| [**`FLX_ASSETS_SERVICE`**](./flx_assets_service.md) | `Variable` | Context service token for a `FlxAssets` instance. |
| [**`FLX_ATLAS_SERVICE`**](./flx_atlas_service.md) | `Variable` | Service token for the atlas registry. |
| [**`FLX_AUDIO_SERVICE`**](./flx_audio_service.md) | `Variable` | Service token for the audio manager. |
| [**`FLX_CAMERA_HOST_SERVICE`**](./flx_camera_host_service.md) | `Variable` | Service token for the active camera renderer adapter. |
| [**`FLX_INPUT_SERVICE`**](./flx_input_service.md) | `Variable` | Service token for deterministic keyboard and pointer input. |
| [**`FLX_LOG_SERVICE`**](./flx_log_service.md) | `Variable` | Service token for the log service in FlxContext. |
| [**`FLX_STORAGE_SERVICE`**](./flx_storage_service.md) | `Variable` | Service token for the storage backend. |
| [**`FLX_VIRTUAL_INPUT_SERVICE`**](./flx_virtual_input_service.md) | `Variable` | Service token for controls that expose deterministic virtual input. |
| [**`FLX_WATCH_SERVICE`**](./flx_watch_service.md) | `Variable` | Service token for the watch service in FlxContext. |
| [**`FlxBasic`**](./flxbasic.md) | `Class` | Base lifecycle object shared by gameplay objects, groups, and plugins. |
| [**`FlxContainer`**](./flxcontainer.md) | `Class` | Exclusive logical group. A member can belong to only one `FlxContainer`; adding it elsewhere reparents it synchronously. |
| [**`FlxContext`**](./flxcontext.md) | `Class` | Explicit owner of mutable engine state and replaceable services. |
| [**`FlxGame`**](./flxgame.md) | `Class` | Headless game controller and atomic state boundary. |
| [**`FlxSignal`**](./flxsignal.md) | `Class` | Small mutation-safe signal used by state lifecycle events. |
| [**`FlxState`**](./flxstate.md) | `Class` | Base game state; initialize state-owned objects in `create`. |
| [**`FlxSubState`**](./flxsubstate.md) | `Class` | A state that can be layered over another state, including another substate. |
| [**`libraryName`**](./libraryname.md) | `Variable` | Current library name. |
| [**`upstreamBaseline`**](./upstreambaseline.md) | `Variable` | The immutable upstream source baseline for compatibility work. |
| [**`UpstreamBaseline`**](./upstreambaseline.md) | `Interface` | Metadata for the ActionScript 3 source baseline used by this port. |

## Game Objects & Sprites

Visual entities, sprites, groups, graphics, and emitters.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxBackdrop`**](./flxbackdrop.md) | `Class` | Infinitely repeating, independently scrolling texture region.<br><br>The authoritative state stays renderer-neutral while the Pixi adapter uses one `TilingSprite`, avoiding duplicate gameplay objects and wrap seams. |
| [**`FlxBackdropRenderHandle`**](./flxbackdroprenderhandle.md) | `Class` | Pixi tiling-sprite projection for one [link](#). |
| [**`FlxEmitter`**](./flxemitter.md) | `Class` | Deterministic burst/stream emitter backed by `FlxGroup` recycling. |
| [**`FlxEmitterRenderHandle`**](./flxemitterrenderhandle.md) | `Class` | Pixi projection of an authoritative, group-backed emitter pool. |
| [**`FlxEmitterRenderOptions`**](./flxemitterrenderoptions.md) | `Interface` | Selects the renderer-only projection used by an emitter. |
| [**`FlxGradient`**](./flxgradient.md) | `Class` | Immutable renderer-neutral local gradient descriptor. |
| [**`FlxGradientStop`**](./flxgradientstop.md) | `Interface` | One RGBA color stop in a local gradient. |
| [**`FlxGraphics`**](./flxgraphics.md) | `Class` | Stable renderer-neutral vector drawing object.<br><br>Commands are tessellated per camera only when the revision changes. Use a mesh for shapes whose geometry changes every frame. |
| [**`FlxGraphicsFill`**](./flxgraphicsfill.md) | `TypeAlias` | Solid RGBA color or gradient fill. |
| [**`FlxGraphicsRenderHandle`**](./flxgraphicsrenderhandle.md) | `Class` | Camera-local Pixi materialization of stable vector commands. |
| [**`FlxGraphicsStroke`**](./flxgraphicsstroke.md) | `Interface` | Renderer-neutral vector stroke style. |
| [**`FlxGraphicsStyle`**](./flxgraphicsstyle.md) | `Interface` | Fill/stroke pair applied to one vector primitive. |
| [**`FlxObject`**](./flxobject.md) | `Class` | Authoritative world-space motion and collision object. |
| [**`FlxObjectInspector`**](./flxobjectinspector.md) | `Class` | Optional debugger adapter for CPU-authoritative pointer selection. It never relies on Pixi hit testing and only intercepts matching debug clicks. |
| [**`FlxObjectInspectorModifier`**](./flxobjectinspectormodifier.md) | `TypeAlias` | Pointer modifier required to activate debugger picking. |
| [**`FlxObjectInspectorOptions`**](./flxobjectinspectoroptions.md) | `Interface` | Configuration for the optional pointer object inspector. |
| [**`FlxParticle`**](./flxparticle.md) | `Class` | Sprite with lifespan and gravity-contact behavior for emitters. |
| [**`FlxParticleConstructor`**](./flxparticleconstructor.md) | `TypeAlias` | Constructor for custom particles created and recycled by an emitter. |
| [**`FlxParticleEffect`**](./flxparticleeffect.md) | `Class` | A movable, ordered group of emitters created from a Particle Editor export. Add the effect itself to a state; its child emitters follow the document's layer order and offsets. |
| [**`FlxParticleEffectAssetOptions`**](./flxparticleeffectassetoptions.md) | `Interface` | Options for creating a composed effect from preloaded [link](#). |
| [**`FlxParticleEffectDiagnostics`**](./flxparticleeffectdiagnostics.md) | `Interface` | Aggregate diagnostics across every enabled emitter layer. |
| [**`FlxParticleEffectLayer`**](./flxparticleeffectlayer.md) | `Interface` | Runtime association between an exported layer and its emitter. |
| [**`FlxParticleEffectSourceResolver`**](./flxparticleeffectsourceresolver.md) | `TypeAlias` | Resolve a preloaded particle texture or frame collection for one layer. |
| [**`FlxParticleEmitter`**](./flxparticleemitter.md) | `Class` | Renders a validated particle preset through Flixel-Pixi's existing emitter and camera pipeline while delegating simulation to the deterministic runtime. |
| [**`FlxParticleEmitterAssetOptions`**](./flxparticleemitterassetoptions.md) | `Interface` | Options for resolving a preset's preloaded asset through [link](#). |
| [**`FlxParticleEmitterSource`**](./flxparticleemittersource.md) | `TypeAlias` | A preloaded image or named frame collection used by a particle preset. |
| [**`FlxSprite`**](./flxsprite.md) | `Class` | Renderer-neutral Flixel sprite state with adapter-owned Pixi views. |
| [**`FlxSpriteContainer`**](./flxspritecontainer.md) | `Class` | Sprite composite whose backing group enforces exclusive ownership. |
| [**`FlxSpriteGroup`**](./flxspritegroup.md) | `Class` | A transformable sprite composite backed by a logical `FlxGroup`.<br><br>Members use world-space `x`/`y` while owned. `add()` interprets an incoming member position as local to the composite and translates it into world space; `remove()` converts it back to local space. Collision expands to the member AABBs rather than treating the composite as one rectangle. |
| [**`FlxSpriteGroupRenderHandle`**](./flxspritegrouprenderhandle.md) | `Class` | Adapter-owned Pixi container branch for one logical sprite composite. |
| [**`FlxSpriteRenderHandle`**](./flxspriterenderhandle.md) | `Class` | Pixi container/sprite pair synchronized from one `FlxSprite`. |
| [**`FlxSpriteTransform`**](./flxspritetransform.md) | `TypeAlias` | Function applied to one direct sprite-group member. |
| [**`FlxStrip`**](./flxstrip.md) | `Class` | Textured triangle geometry with Flixel object/camera semantics.<br><br>Geometry inputs are cloned. Prefer [link](#) / [link](#) for animation. If you mutate a typed-array view directly, call [link](#) once after the edits. |
| [**`FlxStripGeometry`**](./flxstripgeometry.md) | `Interface` | Geometry accepted by [link](#). |
| [**`FlxStripRenderHandle`**](./flxstriprenderhandle.md) | `Class` | Camera-local Pixi materialization of renderer-neutral strip geometry. |
| [**`FlxStripTopology`**](./flxstriptopology.md) | `TypeAlias` | Supported renderer-neutral triangle connectivity. |
| [**`FlxTileblock`**](./flxtileblock.md) | `Class` | Generated, immovable block filled from random sprite-sheet frames. |

## Animation & Atlases

Texture atlases, frame animations, and sprite controllers.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxAnim`**](./flxanim.md) | `Class` | Named frame sequence used by `FlxSprite`. |
| [**`FlxAnimationCallback`**](./flxanimationcallback.md) | `TypeAlias` | Called whenever a sprite materializes a new animation frame. |
| [**`FlxAnimationController`**](./flxanimationcontroller.md) | `Class` | HaxeFlixel-style animation API backed by a deterministic FlxSprite clock. |
| [**`FlxAnimationFrameEvent`**](./flxanimationframeevent.md) | `Interface` | Payload dispatched whenever an animation materializes a new frame. |
| [**`FlxAnimationPlayOptions`**](./flxanimationplayoptions.md) | `Interface` | Options for `FlxSprite.play` when using the object-form overload. |
| [**`FlxAtlas`**](./flxatlas.md) | `Class` | A loaded texture atlas with named frame lookup and ordered pickers.<br><br>Obtain instances via `FlxG.atlas.load(...)` / `FlxG.atlas.get(...)`. |
| [**`FlxAtlasAnimationOptions`**](./flxatlasanimationoptions.md) | `Interface` | Options when registering an animation from [link](#). |
| [**`FlxAtlasAssetSource`**](./flxatlasassetsource.md) | `Interface` | Already-loaded asset aliases used to construct a non-owning atlas. |
| [**`FlxAtlasFrame`**](./flxatlasframe.md) | `Interface` | A named region inside a shared atlas texture. `index` is the stable 0-based insertion order within this atlas. |
| [**`FlxAtlasFrameList`**](./flxatlasframelist.md) | `TypeAlias` | An ordered, immutable list of atlas frames. |
| [**`FlxAtlasFrameRect`**](./flxatlasframerect.md) | `Interface` | Raw axis-aligned bounding rect for one atlas sub-image. Produced by the three parsers; consumed by FlxAtlas to build textures. |
| [**`FlxAtlasGridMeta`**](./flxatlasgridmeta.md) | `Interface` | Grid-based atlas descriptor. Frames are named `"0"`, `"1"`, … in row-major (left-to-right, top-to-bottom) order. |
| [**`FlxAtlasMeta`**](./flxatlasmeta.md) | `TypeAlias` | Third argument to [link](#). - A string ending in `.json` (or whose content parses as JSON) → TexturePacker/Pixi JSON. - A string ending in `.xml` (or any other string) → TextureAtlas XML. - A `FlxAtlasGridMeta` object → uniform fixed-size grid. |
| [**`FlxAtlasPrefixOptions`**](./flxatlasprefixoptions.md) | `Interface` | Options for [link](#). |
| [**`FlxAtlasRegistry`**](./flxatlasregistry.md) | `Class` | Registry that loads and stores named `FlxAtlas` instances. Access the singleton via `FlxG.atlas`. |
| [**`FlxFrame`**](./flxframe.md) | `Class` | One named animation frame backed by a lazily resolved Pixi texture view. |
| [**`FlxFramesCollection`**](./flxframescollection.md) | `Class` | Ordered frame views shared by sprite animation and atlas workflows. |

## Input & Controls

Keyboard, mouse, touch gestures, gamepads, virtual pads, and actions.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxActions`**](./flxactions.md) | `Class` | Maps logical actions to keyboard, pointer, and gamepad sources.<br><br>The legacy `bind(action, ...keys)` helper remains a keyboard-only shorthand. |
| [**`FlxGamepad`**](./flxgamepad.md) | `Class` | One stable logical controller, retained across disconnect/reconnect. |
| [**`FlxGamepadButton`**](./flxgamepadbutton.md) | `Enum` | Standard Web Gamepad button indices. |
| [**`FlxGamepadButtonLike`**](./flxgamepadbuttonlike.md) | `Interface` | Minimal browser gamepad button shape used by the injectable provider. |
| [**`FlxGamepadFrameRecord`**](./flxgamepadframerecord.md) | `Interface` | Serializable authoritative gamepad state for one replay frame. |
| [**`FlxGamepadLike`**](./flxgamepadlike.md) | `Interface` | Browser-neutral gamepad snapshot accepted by the manager. |
| [**`FlxGamepadManager`**](./flxgamepadmanager.md) | `Class` | Fixed-step Web Gamepad poller with reconnect-stable logical IDs. |
| [**`FlxGamepadProvider`**](./flxgamepadprovider.md) | `TypeAlias` | Function polled exactly once at each authoritative simulation step. |
| [**`FlxInputManager`**](./flxinputmanager.md) | `Class` | Owns DOM listeners and publishes their events only on simulation steps. |
| [**`FlxInputManagerOptions`**](./flxinputmanageroptions.md) | `Interface` | Browser event targets used by [link](#). |
| [**`FlxInputService`**](./flxinputservice.md) | `Interface` | Input service consumed by the fixed-step game loop. |
| [**`FlxInputText`**](./flxinputtext.md) | `Class` | Flixel text field backed by a native browser input for selection, IME, and mobile keyboard behavior. DOM changes become authoritative on fixed updates. |
| [**`FlxInputTextChangeCallback`**](./flxinputtextchangecallback.md) | `TypeAlias` | Callback published after a DOM edit is consumed by a fixed update. |
| [**`FlxInputTextOptions`**](./flxinputtextoptions.md) | `Interface` | Optional construction settings for [link](#). |
| [**`FlxInputTextSubmitCallback`**](./flxinputtextsubmitcallback.md) | `TypeAlias` | Callback published after a single-line Enter submission on a fixed update. |
| [**`FlxInputTextType`**](./flxinputtexttype.md) | `TypeAlias` | Browser text-entry types supported by [link](#). |
| [**`FlxKeyRecord`**](./flxkeyrecord.md) | `Interface` | A recorded key transition compatible with the AS3 replay shape. |
| [**`FlxMouseRecord`**](./flxmouserecord.md) | `Interface` | A recorded pointer snapshot compatible with deterministic replay. |
| [**`FlxSwipe`**](./flxswipe.md) | `Interface` | A swipe published for the simulation step in which its touch ends. |
| [**`FlxSwipeDirection`**](./flxswipedirection.md) | `TypeAlias` | Cardinal direction of a recognized swipe. |
| [**`FlxTouch`**](./flxtouch.md) | `Class` | State of one browser touch pointer. |
| [**`FlxTouchEventLike`**](./flxtoucheventlike.md) | `Interface` | Minimal touch-pointer event accepted by the deterministic input queue. |
| [**`FlxTouchFrameRecord`**](./flxtouchframerecord.md) | `Interface` | Serializable touch state for one simulation frame. |
| [**`FlxTouchManager`**](./flxtouchmanager.md) | `Class` | Deterministic multi-touch tracker with step-based swipe recognition. |
| [**`FlxTouchOptions`**](./flxtouchoptions.md) | `Interface` | Swipe recognition thresholds measured in logical pixels and simulation steps. |
| [**`FlxVirtualActionMode`**](./flxvirtualactionmode.md) | `TypeAlias` | Action-button layouts for a virtual pad. |
| [**`FlxVirtualButton`**](./flxvirtualbutton.md) | `Class` | Deterministic touch/pointer button that can be bound through [link](#). |
| [**`FlxVirtualButtonOptions`**](./flxvirtualbuttonoptions.md) | `Interface` | Options for one texture-free virtual action or direction button. |
| [**`FlxVirtualButtonRenderHandle`**](./flxvirtualbuttonrenderhandle.md) | `Class` | Texture-free Pixi projection for one [link](#). |
| [**`FlxVirtualButtonState`**](./flxvirtualbuttonstate.md) | `Interface` | Read-only digital state published by one virtual control. |
| [**`FlxVirtualDPadMode`**](./flxvirtualdpadmode.md) | `TypeAlias` | Direction layouts compatible with the common HaxeFlixel virtual-pad modes. |
| [**`FlxVirtualInput`**](./flxvirtualinput.md) | `Class` | Registry used by [link](#) to resolve serializable virtual sources. |
| [**`FlxVirtualPad`**](./flxvirtualpad.md) | `Class` | HUD-aligned collection of deterministic direction and action buttons. |
| [**`FlxVirtualPadActionMap`**](./flxvirtualpadactionmap.md) | `Interface` | Optional logical action names bound by [link](#). |
| [**`FlxVirtualPadAxisMap`**](./flxvirtualpadaxismap.md) | `Interface` | Optional scalar action names bound from the pad's directional pairs. |
| [**`FlxVirtualPadOptions`**](./flxvirtualpadoptions.md) | `Interface` | Layout and naming options for [link](#). |
| [**`FlxVirtualStick`**](./flxvirtualstick.md) | `Class` | Texture-free HUD analog stick derived from authoritative fixed-step pointer state. |
| [**`FlxVirtualStickAxisMap`**](./flxvirtualstickaxismap.md) | `Interface` | Maps the stick's normalized axes to scalar action names. |
| [**`FlxVirtualStickOptions`**](./flxvirtualstickoptions.md) | `Interface` | Visual and response configuration for [link](#). |
| [**`FlxVirtualStickRenderHandle`**](./flxvirtualstickrenderhandle.md) | `Class` | Pixi projection for a texture-free virtual analog stick. |
| [**`FlxVirtualStickState`**](./flxvirtualstickstate.md) | `Interface` | Read-only two-axis state published by one virtual stick. |
| [**`Input`**](./input.md) | `Class` | Deterministic named digital-input state machine. |
| [**`Keyboard`**](./keyboard.md) | `Class` | AS3-compatible keyboard names backed by physical DOM `code` mappings. |
| [**`Mouse`**](./mouse.md) | `Class` | Deterministic pointer/mouse state with camera-aware coordinates. |
| [**`MouseRecord`**](./mouserecord.md) | `Class` | Represents a mouse input snapshot within a single replay frame. |

## Collision & Math

Spatial quadtree, collision separation, vectors, rects, and RNG.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`clamp`**](./clamp.md) | `Function` | Restricts a number to an inclusive, ordered range. |
| [**`clamp01`**](./clamp01.md) | `Function` | Restricts a number to the inclusive unit range from 0 to 1. |
| [**`FlxPoint`**](./flxpoint.md) | `Class` | Stores a two-dimensional floating-point coordinate. |
| [**`FlxPointerEventLike`**](./flxpointereventlike.md) | `Interface` | Minimal browser pointer event shape accepted by the deterministic queue. |
| [**`FlxQuadTree`**](./flxquadtree.md) | `Class` | Flixel-compatible broad-phase quadtree with single/dual-list operation. |
| [**`FlxRandom`**](./flxrandom.md) | `Class` | Mutable deterministic random source compatible with `FlxG.globalSeed`. |
| [**`FlxRect`**](./flxrect.md) | `Class` | Stores a mutable axis-aligned rectangle. |
| [**`FlxU`**](./flxu.md) | `Class` | Math, color, formatting, and motion helpers from the AS3 `FlxU` surface. |
| [**`nextFlixelSeed`**](./nextflixelseed.md) | `Function` | Advances the original Flixel seeded-random recurrence. |
| [**`PointLike`**](./pointlike.md) | `Interface` | A mutable point shape accepted by Flash-compatibility copy helpers. |
| [**`RectangleLike`**](./rectanglelike.md) | `Interface` | A mutable rectangle shape accepted by Flash-compatibility helpers. |

## Audio System

WebAudio backend, spatial audio, sound groups, and volume control.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxAudioBackend`**](./flxaudiobackend.md) | `Interface` | Replaceable audio backend. The browser implementation wraps Web Audio API; the null implementation enables headless testing. |
| [**`FlxAudioControls`**](./flxaudiocontrols.md) | `Class` | Accessible, dependency-free DOM controls for master game audio. |
| [**`FlxAudioControlsOptions`**](./flxaudiocontrolsoptions.md) | `Interface` | Options for [link](#). |
| [**`FlxAudioControlsPosition`**](./flxaudiocontrolsposition.md) | `TypeAlias` | Corner used by the optional browser audio controls. |
| [**`FlxAudioManager`**](./flxaudiomanager.md) | `Class` | Owns the audio backend, the music singleton, and the sound-effects group.<br><br>Registered on the `FlxContext` service map via `FLX_AUDIO_SERVICE`. `FlxG` resolves it to expose `FlxG.music`, `FlxG.sounds`, `FlxG.play()`, `FlxG.playMusic()`, `FlxG.stream()`, `FlxG.volume`, `FlxG.mute`, `FlxG.pauseSounds()`, and `FlxG.resumeSounds()`. |
| [**`FlxAudioService`**](./flxaudioservice.md) | `Interface` | Audio service interface consumed by `FlxG` and `FlxGame`. |
| [**`FlxAudioState`**](./flxaudiostate.md) | `Interface` | Serializable master audio preferences. |
| [**`FlxSound`**](./flxsound.md) | `Class` | Port of `org.flixel.FlxSound`.<br><br>Extends `FlxBasic` and drives playback through a `FlxSoundHandle` obtained from the active `FlxAudioBackend`. All authoritative state (volume, fade, proximity, loop, alive/exists) lives on this object; the handle is a platform-specific playback delegate. |
| [**`FlxSoundAttachmentOptions`**](./flxsoundattachmentoptions.md) | `Interface` | Configuration for [link](#). |
| [**`FlxSoundGroup`**](./flxsoundgroup.md) | `Class` | A hierarchical volume and mute bus for [link](#) instances. |
| [**`FlxSoundHandle`**](./flxsoundhandle.md) | `Interface` | Low-level handle to a single playing sound, owned by a backend. `FlxSound` drives playback through this interface. |
| [**`FlxSoundOffscreenBehavior`**](./flxsoundoffscreenbehavior.md) | `TypeAlias` | Behavior used by an attached sound after its source leaves the viewport. |
| [**`NullAudioBackend`**](./nullaudiobackend.md) | `Class` | No-op audio backend for headless unit tests. Always unlocked, never suspended, all methods are inert. |
| [**`WebAudioBackend`**](./webaudiobackend.md) | `Class` | Browser `AudioContext` implementation of `FlxAudioBackend`.<br><br>Creates the `AudioContext` lazily on first play or `unlockAudio()`. Handles autoplay policy via a queue: sounds played before unlock are recorded and replayed on the first user gesture. By default, hiding the document suspends the context and returning resumes it. |
| [**`WebAudioBackendOptions`**](./webaudiobackendoptions.md) | `Interface` | Options for [link](#). |
| [**`WebAudioVisibilityPolicy`**](./webaudiovisibilitypolicy.md) | `TypeAlias` | Policy used by [link](#) when document visibility changes. |

## Tweens & Motion

Interpolation, easing formulas, motion curves, and tween management.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxAngleTween`**](./flxangletween.md) | `Class` | Tweens a numeric angle and optionally writes it to an object. |
| [**`FlxCircularMotion`**](./flxcircularmotion.md) | `Class` | Motion around one complete circle. Angles are supplied in degrees. |
| [**`FlxColorTween`**](./flxcolortween.md) | `Class` | Interpolates packed ARGB colors and optionally updates a sprite-like target. |
| [**`FlxColorTweenTarget`**](./flxcolortweentarget.md) | `Interface` | Minimal sprite-like target accepted by color tweens. |
| [**`FlxCubicMotion`**](./flxcubicmotion.md) | `Class` | Motion along a cubic Bézier curve. |
| [**`FlxEase`**](./flxease.md) | `Class` | HaxeFlixel-compatible easing functions. |
| [**`FlxEaseFunction`**](./flxeasefunction.md) | `TypeAlias` | Function used to transform normalized tween progress. |
| [**`FlxFlickerTween`**](./flxflickertween.md) | `Class` | Flickers a lifecycle object's visibility using deterministic game time. |
| [**`FlxFlickerTweenOptions`**](./flxflickertweenoptions.md) | `Interface` | Flicker-specific options layered onto normal tween options. |
| [**`FlxLinearMotion`**](./flxlinearmotion.md) | `Class` | Motion along a straight line. |
| [**`FlxLinearPath`**](./flxlinearpath.md) | `Class` | Constant-speed motion through a polyline. |
| [**`FlxMotion`**](./flxmotion.md) | `Class` | Base tween for moving an optional physics object through world space. |
| [**`FlxNumTween`**](./flxnumtween.md) | `Class` | Standalone numeric tween created by `FlxTween.num`. |
| [**`FlxPath`**](./flxpath.md) | `Class` | Mutable path data followed by a `FlxObject`. |
| [**`FlxQuadMotion`**](./flxquadmotion.md) | `Class` | Motion along a quadratic Bézier curve. |
| [**`FlxQuadPath`**](./flxquadpath.md) | `Class` | Constant-speed traversal of connected quadratic Bézier segments. |
| [**`FlxShakeTween`**](./flxshaketween.md) | `Class` | Applies deterministic random offset shake to a sprite. |
| [**`FlxTween`**](./flxtween.md) | `Class` | Base deterministic tween. Use the static factories for common tweens. |
| [**`FlxTweenAxes`**](./flxtweenaxes.md) | `TypeAlias` | Axes accepted by sprite shake tweens. |
| [**`FlxTweenCallback`**](./flxtweencallback.md) | `TypeAlias` | Callback invoked with its owning tween. |
| [**`FlxTweenColor`**](./flxtweencolor.md) | `Interface` | A Pixi-compatible RGB color with an explicit normalized alpha channel. |
| [**`FlxTweenColorValue`**](./flxtweencolorvalue.md) | `TypeAlias` | Numeric RGB/ARGB color or an explicit RGB-and-alpha value. |
| [**`FlxTweenManager`**](./flxtweenmanager.md) | `Class` | Owns and advances deterministic game-time tweens. |
| [**`FlxTweenOptions`**](./flxtweenoptions.md) | `Interface` | Common tween configuration. |
| [**`FlxTweenType`**](./flxtweentype.md) | `TypeAlias` | Tween completion behavior. |
| [**`FlxVarTween`**](./flxvartween.md) | `Class` | Numeric property tween created by `FlxTween.tween`. |

## UI & Typography

Buttons, 9-slice sprites, progress bars, and high-performance text.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxBar`**](./flxbar.md) | `Class` | Deterministic value bar with renderer-owned fill geometry.<br><br>The optional parent/property binding is read once per fixed update. Rendering never regenerates textures when the value changes. |
| [**`FlxBarCallback`**](./flxbarcallback.md) | `TypeAlias` | Callback invoked when a bar first reaches one of its range limits. |
| [**`FlxBarFillDirection`**](./flxbarfilldirection.md) | `TypeAlias` | Supported `FlxBar` fill directions. |
| [**`FlxBarParentLike`**](./flxbarparentlike.md) | `Interface` | Parent object followed for position and optional scroll factor. |
| [**`FlxBarRenderHandle`**](./flxbarrenderhandle.md) | `Class` | Pixi projection for a texture-free [link](#). |
| [**`FlxBarValueProvider`**](./flxbarvalueprovider.md) | `TypeAlias` | Numeric value provider used by a bound bar. |
| [**`FlxBitmapFont`**](./flxbitmapfont.md) | `Class` | Bitmap glyph font backed by a Pixi `BitmapFont` and registered for `BitmapText`. |
| [**`FlxBitmapFontPageSource`**](./flxbitmapfontpagesource.md) | `TypeAlias` | Texture or engine graphic supplying one AngelCode bitmap-font page. |
| [**`FlxBitmapText`**](./flxbitmaptext.md) | `Class` | Bitmap-font text rendered through Pixi `BitmapText`. |
| [**`FlxBitmapTextRenderHandle`**](./flxbitmaptextrenderhandle.md) | `Class` | Pixi `BitmapText` projection for one [link](#). |
| [**`FlxBmFontData`**](./flxbmfontdata.md) | `Interface` | Parsed AngelCode / BMFont XML payload for Pixi `BitmapFont`. |
| [**`FlxButton`**](./flxbutton.md) | `Class` | Deterministic Flixel button with optional toggle and native accessibility hooks. |
| [**`FlxButtonCallback`**](./flxbuttoncallback.md) | `TypeAlias` | Callback invoked by a button transition. |
| [**`FlxButtonRenderHandle`**](./flxbuttonrenderhandle.md) | `Class` | Composite Pixi view for a button background and its optional label. |
| [**`FlxButtonSound`**](./flxbuttonsound.md) | `Interface` | Sound-like hook accepted without coupling the button to an audio backend. |
| [**`FlxNineSliceBorderInput`**](./flxninesliceborderinput.md) | `Interface` | Partial border insets accepted by [link](#). |
| [**`FlxNineSliceBorders`**](./flxninesliceborders.md) | `Interface` | Insets for one 9-slice texture region. |
| [**`FlxNineSliceButton`**](./flxnineslicebutton.md) | `Class` | [link](#) with a renderer-owned Pixi `NineSliceSprite` background. |
| [**`FlxNineSliceButtonRenderHandle`**](./flxnineslicebuttonrenderhandle.md) | `Class` | Composite Pixi view for a 9-slice button background and optional label. |
| [**`FlxNineSliceRenderHandle`**](./flxnineslicerenderhandle.md) | `Class` | Pixi 9-slice projection for one [link](#). |
| [**`FlxNineSliceSprite`**](./flxnineslicesprite.md) | `Class` | Resizable sprite with fixed corner and edge art via Pixi 9-slice scaling.<br><br>Use [link](#) or [link](#) instead of [link](#) so border insets are tracked for rendering. |
| [**`FlxText`**](./flxtext.md) | `Class` | Flixel-compatible text state rendered by Pixi `Text` or `BitmapText`. |
| [**`FlxTextRenderHandle`**](./flxtextrenderhandle.md) | `Class` | Pixi text leaf wrapped by a transform-owning container. |
| [**`FlxTextRenderMode`**](./flxtextrendermode.md) | `TypeAlias` | Pixi text implementation chosen for a `FlxText` render handle. |
| [**`parseBmFontXml`**](./parsebmfontxml.md) | `Function` | Parse AngelCode BMFont XML into the structure expected by Pixi `BitmapFont`. |

## Tilemaps

2D grid rendering, collision indexing, and map buffers.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxTile`**](./flxtile.md) | `Class` | Reusable collision proxy for one tile type. |
| [**`FlxTileCallback`**](./flxtilecallback.md) | `TypeAlias` | Callback registered for a tile type. |
| [**`FlxTileFilter`**](./flxtilefilter.md) | `TypeAlias` | Runtime constructor used to filter tile callbacks. |
| [**`FlxTilemap`**](./flxtilemap.md) | `Class` | Renderer-neutral tile data, collision, ray, and pathfinding object. |
| [**`FlxTilemapBuffer`**](./flxtilemapbuffer.md) | `Class` | Compatibility metadata for the classic camera-sized bitmap tile buffer. Pixi rendering uses [link](#) chunks instead. |
| [**`FlxTilemapLoadOptions`**](./flxtilemaploadoptions.md) | `Interface` | Options for loading a numeric tile array. |
| [**`FlxTilemapOverlapCallback`**](./flxtilemapoverlapcallback.md) | `TypeAlias` | Callback used while testing a tile proxy against an object. |
| [**`FlxTilemapRenderHandle`**](./flxtilemaprenderhandle.md) | `Class` | Pixi sprite chunks synchronized from one authoritative tilemap. |

## Assets & Loading

Asset bundles, asynchronous loading sessions, and graphics cache.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`FlxAssetBackend`**](./flxassetbackend.md) | `Interface` | Injectable subset of Pixi Assets used by the engine service. |
| [**`FlxAssetBundle`**](./flxassetbundle.md) | `Interface` | A named group of assets with state/scene lifetime. |
| [**`FlxAssetDescriptor`**](./flxassetdescriptor.md) | `Interface` | Browser asset descriptor accepted by `FlxAssets`. |
| [**`FlxAssetInitOptions`**](./flxassetinitoptions.md) | `Interface` | Initialization options for the Pixi asset resolver. |
| [**`FlxAssetLoadError`**](./flxassetloaderror.md) | `Class` | Failure enriched with the alias or URL requested by the game. |
| [**`FlxAssetLoadOptions`**](./flxassetloadoptions.md) | `Interface` | Retry, progress, and failure policy for a foreground asset load. |
| [**`FlxAssetManifest`**](./flxassetmanifest.md) | `Interface` | Declarative bundle manifest. |
| [**`FlxAssets`**](./flxassets.md) | `Class` | Typed, explicitly asynchronous facade over PixiJS v8 `Assets`. |
| [**`FlxGraphic`**](./flxgraphic.md) | `Class` | A loaded or generated Pixi texture plus optional CPU-side pixel data. |
| [**`FlxLoadingBundleOptions`**](./flxloadingbundleoptions.md) | `Interface` | Options for loading an asset bundle through a shared loading session. |
| [**`FlxLoadingError`**](./flxloadingerror.md) | `Class` | A loading failure enriched with the stage that failed. |
| [**`FlxLoadingSession`**](./flxloadingsession.md) | `Class` | Renderer-independent loading state for both browser boot and in-game screens. Progress is monotonic within one run and can be reset explicitly for retry. |
| [**`FlxLoadingSnapshot`**](./flxloadingsnapshot.md) | `Interface` | Immutable loading state delivered to DOM or Pixi/Flixel loading views. |
| [**`FlxLoadingStage`**](./flxloadingstage.md) | `TypeAlias` | Lifecycle stage reported by a loading operation. |
| [**`FlxLoadingState`**](./flxloadingstate.md) | `TypeAlias` | High-level state shared by boot and in-game loading presentations. |
| [**`FlxLoadingTaskContext`**](./flxloadingtaskcontext.md) | `Interface` | Context provided to a custom loading task. |
| [**`FlxLoadingTaskOptions`**](./flxloadingtaskoptions.md) | `Interface` | Maps a task into a section of the session's overall progress. |
| [**`FlxLoadingUpdate`**](./flxloadingupdate.md) | `Interface` | Partial update accepted by [link](#). |
| [**`throwIfAborted`**](./throwifaborted.md) | `Function` | Throws a browser-standard abort error when a loading signal is cancelled. |

## Browser DX & Viewport

Browser application bootstrap, auto-scaling viewports, and safe areas.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`BrowserGameApplication`**](./browsergameapplication.md) | `Interface` | Running browser game application handle returned by [link](#). |
| [**`BrowserGameAssetOptions`**](./browsergameassetoptions.md) | `Interface` | Declarative asset configuration for browser startup. |
| [**`BrowserGameFrame`**](./browsergameframe.md) | `Interface` | Timing information for one completed browser render frame. |
| [**`BrowserGamePreloadContext`**](./browsergamepreloadcontext.md) | `Interface` | Loading helpers supplied to a game's custom startup preparation. |
| [**`BrowserGamePreloaderOptions`**](./browsergamepreloaderoptions.md) | `Interface` | Configuration for the default or a custom bootstrap-preloader view. |
| [**`BrowserGameRendererBackend`**](./browsergamerendererbackend.md) | `TypeAlias` | GPU renderer backends supported by the browser game host. |
| [**`BrowserGameRendererFallback`**](./browsergamerendererfallback.md) | `Interface` | Details of an automatic renderer recovery completed during startup. |
| [**`BrowserGameRendererOptions`**](./browsergamerendereroptions.md) | `Interface` | Renderer selection and recovery policy for browser startup. |
| [**`createBrowserGame`**](./createbrowsergame.md) | `Function` | Boot Pixi + FlxGame + FlxCameraRenderer for a browser game. Asset preparation, retry, cancellation, and first-frame readiness share one loading model that can also drive later in-game loading screens. |
| [**`FlxBrowserSafePadding`**](./flxbrowsersafepadding.md) | `TypeAlias` | Developer-defined logical padding inside the visible viewport. |
| [**`FlxBrowserScaleMode`**](./flxbrowserscalemode.md) | `TypeAlias` | Browser presentation modes that preserve a fixed logical game size. |
| [**`FlxBrowserScaleOptions`**](./flxbrowserscaleoptions.md) | `Interface` | Configuration for the browser canvas presentation policy. |
| [**`FlxBrowserViewport`**](./flxbrowserviewport.md) | `Class` | Owns CSS-space canvas sizing while the renderer keeps a stable logical size. Pointer and accessibility projection use the resulting canvas bounds. |
| [**`FlxBrowserViewportInsets`**](./flxbrowserviewportinsets.md) | `Interface` | Per-edge spacing used by browser-safe layout. |
| [**`FlxBrowserViewportRect`**](./flxbrowserviewportrect.md) | `Interface` | Immutable rectangle expressed in logical game coordinates. |
| [**`FlxBrowserViewportSnapshot`**](./flxbrowserviewportsnapshot.md) | `Interface` | Resolved CSS-space placement of a logical game canvas. |

## Debugger & Diagnostics

Interactive console, variable watch, FPS meter, and object inspector.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`DebugChannel`**](./debugchannel.md) | `Class` | Typed pub/sub channel that connects the game loop to optional debug consumers. |
| [**`DebugPathDisplay`**](./debugpathdisplay.md) | `Class` | Plugin that owns path-debug registration and Pixi geometry projection. |
| [**`FlxConsole`**](./flxconsole.md) | `Class` | Headless, allow-listed debugger command registry with bounded history. It never evaluates arbitrary JavaScript; consumers decide which operations are safe by explicitly registering commands. |
| [**`FlxConsoleCommand`**](./flxconsolecommand.md) | `Interface` | A command explicitly exposed to the debugger console. |
| [**`FlxConsoleCommandContext`**](./flxconsolecommandcontext.md) | `Interface` | Context passed to a registered debugger console command. |
| [**`FlxConsoleOptions`**](./flxconsoleoptions.md) | `Interface` | Configuration for the headless debugger console. |
| [**`FlxConsoleResult`**](./flxconsoleresult.md) | `Interface` | Normalized result returned by every debugger console execution. |
| [**`FlxDebugger`**](./flxdebugger.md) | `Class` | DOM overlay debugger with Console, Log, Watch, Perf, VCR, and Vis panels. Mounts as a fixed bottom bar. Fully keyboard/screen-reader accessible. |
| [**`FlxDebuggerDiagnosticSnapshot`**](./flxdebuggerdiagnosticsnapshot.md) | `Interface` | Versioned JSON-safe debugger export. |
| [**`FlxDebuggerOptions`**](./flxdebuggeroptions.md) | `Interface` |  |
| [**`FlxDebuggerVCRCallbacks`**](./flxdebuggervcrcallbacks.md) | `Interface` | Callbacks the debugger needs to invoke VCR actions on the game. |
| [**`FlxDiagnostics`**](./flxdiagnostics.md) | `Class` | Bounded, renderer-neutral runtime diagnostics collector. |
| [**`FlxDiagnosticsOptions`**](./flxdiagnosticsoptions.md) | `Interface` | Bounded diagnostics collector configuration. |
| [**`FlxFpsDisplay`**](./flxfpsdisplay.md) | `Class` | Small dependency-free DOM display for render FPS and frame pacing. |
| [**`FlxFpsDisplayOptions`**](./flxfpsdisplayoptions.md) | `Interface` | Options for [link](#). |
| [**`FlxFpsDisplayPosition`**](./flxfpsdisplayposition.md) | `TypeAlias` | Screen corner used by the lightweight FPS overlay. |
| [**`FlxFpsDisplayTheme`**](./flxfpsdisplaytheme.md) | `Interface` | Theme tokens for the lightweight FPS overlay. |
| [**`FlxLog`**](./flxlog.md) | `Class` | Ring-buffer log that keeps the last MAX_ENTRIES messages. Mirrors AS3 FlxG.log. |
| [**`FlxPreloader`**](./flxpreloader.md) | `Class` | Accessible, customizable HTML loading view. Dismissed automatically when a ready snapshot is received. |
| [**`FlxPreloaderOptions`**](./flxpreloaderoptions.md) | `Interface` | Options for the default DOM preloader. |
| [**`FlxPreloaderTheme`**](./flxpreloadertheme.md) | `Interface` | Theme tokens used by the default DOM preloader. |
| [**`FlxPreloaderView`**](./flxpreloaderview.md) | `Interface` | Replaceable presentation driven by a shared loading session. |
| [**`FlxPreloaderViewContext`**](./flxpreloaderviewcontext.md) | `Interface` | Context passed to a custom bootstrap-preloader factory. |
| [**`FlxPreloaderViewFactory`**](./flxpreloaderviewfactory.md) | `TypeAlias` | Creates a custom DOM-first bootstrap preloader. |
| [**`FlxWatch`**](./flxwatch.md) | `Class` | Live field watcher. Mirrors AS3 FlxG.watch. |
| [**`FlxWatchDefinition`**](./flxwatchdefinition.md) | `Interface` | Getter-backed tracked value definition. |
| [**`FlxWatchEditor`**](./flxwatcheditor.md) | `Interface` | Explicit mutation contract for an editable tracked value. |
| [**`FlxWatchMutationGuard`**](./flxwatchmutationguard.md) | `TypeAlias` | Guard result: true permits mutation; false or a message rejects it. |
| [**`FlxWatchMutationResult`**](./flxwatchmutationresult.md) | `Interface` | Result of an attempted debugger watch mutation. |
| [**`LogEntry`**](./logentry.md) | `Interface` | A single log entry stored in the ring buffer. |
| [**`PreloaderState`**](./preloaderstate.md) | `TypeAlias` | State of the preloader. |
| [**`TimerManager`**](./timermanager.md) | `Class` | Plugin that advances deterministic game-time timers. |
| [**`WatchEntry`**](./watchentry.md) | `Interface` | A single watched field entry. |
| [**`WatchSnapshot`**](./watchsnapshot.md) | `Interface` | A resolved snapshot value. |

## Storage & Replay

Persistent save data, deterministic recording, and AS3 replay compatibility.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`CodePair`**](./codepair.md) | `Interface` | Serializable key input state for a single replay frame. |
| [**`convertAS3ReplayToFlxReplay`**](./convertas3replaytoflxreplay.md) | `Function` | Converts legacy AS3 Flixel text replay data into a modern FlxReplay instance. |
| [**`convertFlxReplayToAS3Text`**](./convertflxreplaytoas3text.md) | `Function` | Converts a modern FlxReplay instance into legacy AS3 Flixel plain-text format. |
| [**`FlxReplay`**](./flxreplay.md) | `Class` | Manages deterministic input recording, playback, and checksum verification. |
| [**`FlxSave`**](./flxsave.md) | `Class` | Port of `org.flixel.FlxSave`.<br><br>Provides namespaced, versioned save slots backed by a replaceable `FlxStorageBackend`. The default backend is provided by the `FlxContext` service map (typically `LocalStorageBackend`). |
| [**`FlxSaveBindOptions`**](./flxsavebindoptions.md) | `Interface` | Options for `FlxSave.bind()`. |
| [**`FlxSaveMigration`**](./flxsavemigration.md) | `TypeAlias` | Callback for migrating save data between schema versions. |
| [**`FlxSaveResult`**](./flxsaveresult.md) | `TypeAlias` | Result of a `FlxSave.flush()` operation. On failure, includes an error category and human-readable message. |
| [**`FlxStorageBackend`**](./flxstoragebackend.md) | `Interface` | Replaceable storage backend.<br><br>The default implementation uses `localStorage`; an optional `IndexedDB` adapter is available for larger data. A `NullStorageBackend` enables headless testing. |
| [**`FlxVCR`**](./flxvcr.md) | `Interface` | VCR control interface for recording, playback, and step controls. |
| [**`FrameRecord`**](./framerecord.md) | `Class` | Represents recorded inputs and state checksum for a single simulation frame. |
| [**`FrameRecordData`**](./framerecorddata.md) | `Interface` | Raw JSON representation of a FrameRecord. |
| [**`IndexedDBBackend`**](./indexeddbbackend.md) | `Class` | Optional IndexedDB-backed storage adapter.<br><br>Reads from a cache populated while opening. Writes and erases must use the async `FlxSave` methods so their results represent transaction completion.<br><br>**Usage:**<br><br><br>```ts<br>const db = await IndexedDBBackend.open('my-game-saves');<br>const save = new FlxSave();<br>save.bind('slot1', { backend: db });<br>await save.flushAsync();<br><br>``` |
| [**`LocalStorageBackend`**](./localstoragebackend.md) | `Class` | `localStorage`-backed storage implementation.<br><br>Keys are namespaced as `flixel:{name}` to avoid collisions with other web applications. Quota failures are detected via `DOMException` and surfaced through the `FlxSaveResult` type. Malformed stored JSON returns `null` and logs a console warning rather than throwing. |
| [**`NullStorageBackend`**](./nullstoragebackend.md) | `Class` | In-memory storage backend for headless unit tests. Data lives only for the lifetime of this instance. |

## Rendering & Filters

PixiJS render handles, post-processing filters, shaders, and camera views.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`collectRenderables`**](./collectrenderables.md) | `Function` | Collect displayables under a Flixel basic (state/group tree). |
| [**`FlxBlurFilter`**](./flxblurfilter.md) | `Class` | Renderer-neutral blur effect descriptor. |
| [**`FlxBlurFilterOptions`**](./flxblurfilteroptions.md) | `Interface` | Options for [link](#). |
| [**`FlxCamera`**](./flxcamera.md) | `Class` | Renderer-neutral Flixel camera state.<br><br>Pixi render targets and display objects are owned by `FlxCameraRenderer`; this class owns only deterministic simulation and coordinate transforms. |
| [**`FlxCameraEffectCallback`**](./flxcameraeffectcallback.md) | `TypeAlias` | Callback invoked after a deterministic camera effect completes. |
| [**`FlxCameraFollowStyle`**](./flxcamerafollowstyle.md) | `TypeAlias` | Camera follow presets retained from the AS3 API. |
| [**`FlxCameraHost`**](./flxcamerahost.md) | `Interface` | Adapter hook used to mirror logical camera lifecycle into a renderer. |
| [**`FlxCameraLike`**](./flxcameralike.md) | `Interface` | Camera fields needed by headless screen-coordinate helpers. |
| [**`FlxCameraObjectPick`**](./flxcameraobjectpick.md) | `Interface` | CPU-authoritative result of debugger object picking. |
| [**`FlxCameraRenderer`**](./flxcamerarenderer.md) | `Class` | Pixi render-texture adapter for one logical world and any number of cameras. |
| [**`FlxCameraShakeDirection`**](./flxcamerashakedirection.md) | `TypeAlias` | Camera shake direction presets retained from the AS3 API. |
| [**`FlxCameraView`**](./flxcameraview.md) | `Interface` | Pixi resources owned for one logical camera. |
| [**`FlxColorMatrixFilter`**](./flxcolormatrixfilter.md) | `Class` | Renderer-neutral 4×5 color-matrix effect descriptor. |
| [**`FlxDisplacementFilter`**](./flxdisplacementfilter.md) | `Class` | Texture-backed displacement effect with revisioned runtime parameters. |
| [**`FlxDisplacementFilterOptions`**](./flxdisplacementfilteroptions.md) | `Interface` | Options for [link](#). |
| [**`FlxFilter`**](./flxfilter.md) | `TypeAlias` | Built-in renderer-neutral sprite effects. |
| [**`FlxRenderable`**](./flxrenderable.md) | `TypeAlias` | Sprite, tilemap, or emitter that can be registered with [link](#). |
| [**`FlxRenderHandle`**](./flxrenderhandle.md) | `Interface` | Adapter-owned Pixi view synchronized from an authoritative Flixel object. |
| [**`FlxShaderFilter`**](./flxshaderfilter.md) | `Class` | Renderer-neutral custom filter descriptor with typed runtime uniforms. |
| [**`FlxShaderFilterOptions`**](./flxshaderfilteroptions.md) | `Interface` | Options for [link](#). |
| [**`FlxShaderUniformDefinition`**](./flxshaderuniformdefinition.md) | `Interface` | Initial type and value for one shader uniform. |
| [**`FlxShaderUniforms`**](./flxshaderuniforms.md) | `Class` | Mutable, type-checked values shared by every projection of a shader filter. |
| [**`FlxShaderUniformSchema`**](./flxshaderuniformschema.md) | `TypeAlias` | Named shader-uniform schema inferred by [link](#). |
| [**`FlxShaderUniformType`**](./flxshaderuniformtype.md) | `TypeAlias` | Uniform data types supported by [link](#). |
| [**`FlxShaderUniformValue`**](./flxshaderuniformvalue.md) | `TypeAlias` | Type-safe JavaScript value for a shader uniform type. |
| [**`makeGraphicPixels`**](./makegraphicpixels.md) | `Function` | Creates a packed `0xRRGGBBAA` buffer filled with one color. |
| [**`PixelBuffer`**](./pixelbuffer.md) | `Interface` | A CPU-side packed RGBA pixel buffer used by generated graphics. |
| [**`syncWorldToRenderer`**](./syncworldtorenderer.md) | `Function` | Synchronize renderer entries with the active state's renderables. Adds missing objects; removes entries for objects no longer in the tree. Does not clear and rebuild all handles. Clears [link](#) when a context is attached. |

## Types & Utilities

Data types, helper interfaces, and utility declarations.

| Symbol | Kind | Description |
| :--- | :--- | :--- |
| [**`CreateBrowserGameOptions`**](./createbrowsergameoptions.md) | `Interface` | Options for [link](#). |
| [**`DebugEvents`**](./debugevents.md) | `Interface` | Payload shapes for each debug event type. |
| [**`DebugEventType`**](./debugeventtype.md) | `TypeAlias` |  |
| [**`FixedStepAdvanceResult`**](./fixedstepadvanceresult.md) | `Interface` | Result of advancing a [link](#). |
| [**`FlxActionBindingsData`**](./flxactionbindingsdata.md) | `Interface` | Versioned binding schema returned by [link](#). |
| [**`FlxActionGamepadAxisSource`**](./flxactiongamepadaxissource.md) | `Interface` | One gamepad axis exposed as a scalar analog source. |
| [**`FlxActionGamepadButtonAxisSource`**](./flxactiongamepadbuttonaxissource.md) | `Interface` | Pair of gamepad buttons exposed as a scalar analog source. |
| [**`FlxActionGamepadButtonSource`**](./flxactiongamepadbuttonsource.md) | `Interface` | Gamepad button used as a digital action source. |
| [**`FlxActionGamepadTarget`**](./flxactiongamepadtarget.md) | `TypeAlias` | Selects one logical gamepad, the first active pad, or every connected pad. |
| [**`FlxActionKeyboardAxisSource`**](./flxactionkeyboardaxissource.md) | `Interface` | Pair of keyboard keys exposed as a scalar analog source. |
| [**`FlxActionKeyboardSource`**](./flxactionkeyboardsource.md) | `Interface` | Keyboard key used as a digital action source. |
| [**`FlxActionMouseSource`**](./flxactionmousesource.md) | `Interface` | Pointer button used as a digital action source. |
| [**`FlxActionRebindOptions`**](./flxactionrebindoptions.md) | `Interface` | Controls whether a newly assigned source is removed from other actions. |
| [**`FlxActionSource`**](./flxactionsource.md) | `TypeAlias` | Serializable digital or scalar-analog source for one named action. |
| [**`FlxActionVirtualButtonAxisSource`**](./flxactionvirtualbuttonaxissource.md) | `Interface` | Pair of virtual buttons exposed as a scalar analog source. |
| [**`FlxActionVirtualButtonSource`**](./flxactionvirtualbuttonsource.md) | `Interface` | One registered virtual control exposed as a digital action source. |
| [**`FlxActionVirtualStickAxisSource`**](./flxactionvirtualstickaxissource.md) | `Interface` | One normalized axis from a registered virtual stick. |
| [**`FlxActionWheelSource`**](./flxactionwheelsource.md) | `Interface` | Mouse-wheel direction used as a one-step digital action source. |
| [**`FlxAsyncStorageBackend`**](./flxasyncstoragebackend.md) | `Interface` | Storage backend whose durable writes must be awaited. |
| [**`FlxBasicConstructor`**](./flxbasicconstructor.md) | `TypeAlias` | Constructor accepted by [link](#). |
| [**`FlxDiagnosticSample`**](./flxdiagnosticsample.md) | `Interface` | One bounded runtime diagnostic sample. |
| [**`FlxDiagnosticSnapshot`**](./flxdiagnosticsnapshot.md) | `Interface` | Versioned, serializable performance snapshot. |
| [**`FlxDiagnosticSummary`**](./flxdiagnosticsummary.md) | `Interface` | Aggregate metrics included with diagnostic exports. |
| [**`FlxDisplacementPoint`**](./flxdisplacementpoint.md) | `Interface` | Point-like input used by displacement scale and texture offset. |
| [**`FlxFpsMetrics`**](./flxfpsmetrics.md) | `Interface` | Metrics from the most recently completed FPS sampling window. |
| [**`FlxG`**](./flxg.md) | `Class` | Static compatibility facade delegating to one active [link](#). |
| [**`FlxGridFramesOptions`**](./flxgridframesoptions.md) | `Interface` | Options for creating a uniform grid frame collection. |
| [**`FlxGroup`**](./flxgroup.md) | `Class` | Mutation-safe collection that owns member lifecycle traversal. |
| [**`FlxKeyboardEventLike`**](./flxkeyboardeventlike.md) | `Interface` | Minimal browser keyboard event shape accepted by the deterministic queue. |
| [**`FlxLinearGradientOptions`**](./flxlineargradientoptions.md) | `Interface` | Local normalized options for a linear gradient. |
| [**`FlxOverlapCallback`**](./flxoverlapcallback.md) | `TypeAlias` | Called after an accepted overlap pair is found. |
| [**`FlxPixiTextNode`**](./flxpixitextnode.md) | `TypeAlias` | Pixi leaf used by a `FlxTextRenderHandle`. |
| [**`FlxPluginConstructor`**](./flxpluginconstructor.md) | `TypeAlias` | Constructor used by the plugin compatibility facade. |
| [**`FlxProcessCallback`**](./flxprocesscallback.md) | `TypeAlias` | Decides whether an overlap pair is accepted. |
| [**`FlxRadialGradientOptions`**](./flxradialgradientoptions.md) | `Interface` | Local normalized options for a radial gradient. |
| [**`FlxShaderWebGLProgram`**](./flxshaderwebglprogram.md) | `Interface` | WebGL fragment program for a custom filter. |
| [**`FlxShaderWebGPUProgram`**](./flxshaderwebgpuprogram.md) | `Interface` | Combined WebGPU program for a custom filter. |
| [**`FlxSignalListener`**](./flxsignallistener.md) | `TypeAlias` | Listener registered with [link](#). |
| [**`FlxStateConstructor`**](./flxstateconstructor.md) | `TypeAlias` | Zero-argument state constructor used by reset and startup. |
| [**`FlxStateRuntime`**](./flxstateruntime.md) | `Interface` | Runtime bridge installed by a `FlxGame` into its context. |
| [**`FlxSubStateCallback`**](./flxsubstatecallback.md) | `TypeAlias` | Lifecycle callback invoked when a substate opens or closes. |
| [**`FlxTimer`**](./flxtimer.md) | `Class` | Deterministic timer advanced by the context's `TimerManager`. |
| [**`FlxTimerCallback`**](./flxtimercallback.md) | `TypeAlias` | Callback fired for each completed timer loop. |
| [**`isParticleEffectValidationError`**](./isparticleeffectvalidationerror.md) | `Function` | Narrow an unknown thrown value to a particle effect validation error. |
| [**`isParticlePresetValidationError`**](./isparticlepresetvalidationerror.md) | `Function` | Return whether an error came from particle preset parsing. |
| [**`JsonObject`**](./jsonobject.md) | `Interface` |  |
| [**`JsonPrimitive`**](./jsonprimitive.md) | `TypeAlias` |  |
| [**`JsonValue`**](./jsonvalue.md) | `TypeAlias` |  |
| [**`MAX_PARTICLE_EFFECT_EMITTERS`**](./max_particle_effect_emitters.md) | `Variable` | Maximum number of emitter layers supported by a version 1 effect. |
| [**`parseParticleEffect`**](./parseparticleeffect.md) | `Function` | Parse and validate a versioned particle effect document. |
| [**`parseParticlePreset`**](./parseparticlepreset.md) | `Function` | Parse an unknown value or throw a [link](#). |
| [**`ParticleAppearanceDefinition`**](./particleappearancedefinition.md) | `Interface` |  |
| [**`ParticleBlendMode`**](./particleblendmode.md) | `TypeAlias` | Portable blend modes supported by particle presets. |
| [**`ParticleColorStop`**](./particlecolorstop.md) | `Interface` |  |
| [**`ParticleCurve`**](./particlecurve.md) | `Interface` |  |
| [**`ParticleCurveInterpolation`**](./particlecurveinterpolation.md) | `TypeAlias` |  |
| [**`ParticleCurveStop`**](./particlecurvestop.md) | `Interface` |  |
| [**`ParticleEffectDocumentV1`**](./particleeffectdocumentv1.md) | `Interface` | Portable, ordered multi-emitter effect exported by the Particle Editor. |
| [**`ParticleEffectOffset`**](./particleeffectoffset.md) | `Interface` | Local emitter offset from the composed effect origin. |
| [**`ParticleEffectValidationError`**](./particleeffectvalidationerror.md) | `Class` | Structured error thrown while parsing a particle effect document. |
| [**`ParticleEffectValidationResult`**](./particleeffectvalidationresult.md) | `TypeAlias` | Validation result for a composed particle effect document. |
| [**`ParticleEmissionDefinition`**](./particleemissiondefinition.md) | `TypeAlias` |  |
| [**`ParticleEmitterDiagnostics`**](./particleemitterdiagnostics.md) | `Interface` |  |
| [**`ParticleEmitterLayerV1`**](./particleemitterlayerv1.md) | `Interface` | One ordered emitter layer inside a composed particle effect. |
| [**`ParticleEmitterState`**](./particleemitterstate.md) | `TypeAlias` |  |
| [**`ParticleFrameSelection`**](./particleframeselection.md) | `TypeAlias` |  |
| [**`ParticleMotionDefinition`**](./particlemotiondefinition.md) | `Interface` |  |
| [**`ParticleNumberRange`**](./particlenumberrange.md) | `Interface` |  |
| [**`ParticlePreset`**](./particlepreset.md) | `TypeAlias` |  |
| [**`ParticlePresetV1`**](./particlepresetv1.md) | `Interface` |  |
| [**`ParticlePresetValidationError`**](./particlepresetvalidationerror.md) | `Class` | Error thrown when a particle preset cannot be parsed. |
| [**`ParticlePresetValidationResult`**](./particlepresetvalidationresult.md) | `TypeAlias` |  |
| [**`ParticleRotationDefinition`**](./particlerotationdefinition.md) | `Interface` |  |
| [**`ParticleSpace`**](./particlespace.md) | `TypeAlias` |  |
| [**`ParticleSpawnDefinition`**](./particlespawndefinition.md) | `TypeAlias` |  |
| [**`ParticleState`**](./particlestate.md) | `Interface` |  |
| [**`ParticleTextureDefinition`**](./particletexturedefinition.md) | `Interface` |  |
| [**`ParticleTextureShape`**](./particletextureshape.md) | `TypeAlias` | Editor drawing hint retained so exported effects can be reopened losslessly. |
| [**`ParticleVectorRange`**](./particlevectorrange.md) | `Interface` |  |
| [**`ReplayFileFormat`**](./replayfileformat.md) | `Interface` | Structure of a serialized FlxReplay JSON file. |
| [**`serializeParticleEffect`**](./serializeparticleeffect.md) | `Function` | Serialize a validated particle effect with deterministic field ordering. |
| [**`SerializeParticleEffectOptions`**](./serializeparticleeffectoptions.md) | `Interface` |  |
| [**`serializeParticlePreset`**](./serializeparticlepreset.md) | `Function` | Serialize a validated particle preset with deterministic key ordering. |
| [**`SerializeParticlePresetOptions`**](./serializeparticlepresetoptions.md) | `Interface` |  |
| [**`validateParticleEffect`**](./validateparticleeffect.md) | `Function` | Validate an exported particle effect and report every actionable path. |
| [**`validateParticlePreset`**](./validateparticlepreset.md) | `Function` | Validate an unknown value as a version 1 particle preset. |
| [**`ValidationIssue`**](./validationissue.md) | `Interface` |  |
| [**`ValidationIssueCode`**](./validationissuecode.md) | `TypeAlias` |  |
| [**`ValidationResult`**](./validationresult.md) | `TypeAlias` |  |

