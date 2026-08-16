---
title: CreateBrowserGameOptions (Interface)
description: API reference documentation for CreateBrowserGameOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# CreateBrowserGameOptions

Options for [link](#).

```ts
export interface CreateBrowserGameOptions
```

## Properties

| Property                  | Modifiers | Type                                                            | Description                                                                             |
| :------------------------ | :-------- | :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **`accessibility`**       | -         | `boolean`                                                       | Native keyboard and screen-reader controls for supported Flixel UI. Defaults to true.   |
| **`assets`**              | -         | `BrowserGameAssetOptions`                                       | Declarative Pixi asset bundles and resolver configuration.                              |
| **`audioBackend`**        | -         | `FlxAudioBackend`                                               | -                                                                                       |
| **`audioControls`**       | -         | `boolean \| FlxAudioControlsOptions`                            | Optional accessible master volume/mute controls. Disabled by default.                   |
| **`autoPause`**           | -         | `boolean`                                                       | Pause fixed simulation updates while the page is hidden or unfocused. Defaults to true. |
| **`backgroundColor`**     | -         | `number`                                                        | -                                                                                       |
| **`fpsDisplay`**          | -         | `boolean \| FlxFpsDisplayOptions`                               | Optional lightweight in-game FPS overlay. Disabled by default.                          |
| **`height`**              | -         | `number`                                                        | -                                                                                       |
| **`host`**                | -         | `HTMLElement`                                                   | -                                                                                       |
| **`initialState`**        | -         | `FlxStateConstructor`                                           | -                                                                                       |
| **`maxDevicePixelRatio`** | -         | `number`                                                        | Upper bound for renderer resolution as browser DPR changes. Defaults to 2.              |
| **`onLoadingSnapshot`**   | -         | `(snapshot: FlxLoadingSnapshot) => void`                        | Observe the same snapshots used by DOM and in-game loading screens.                     |
| **`preload`**             | -         | `(context: BrowserGamePreloadContext) => Promise<void> \| void` | Custom preparation that runs while the bootstrap preloader is active.                   |
| **`preloader`**           | -         | `false \| BrowserGamePreloaderOptions`                          | Default DOM preloader, custom view configuration, or false to disable it.               |
| **`renderer`**            | -         | `BrowserGameRendererOptions`                                    | GPU backend preference and WebGPU-to-WebGL recovery policy.                             |
| **`renderFramerate`**     | -         | `number`                                                        | Optional visual frame-rate cap. By default rendering follows the display.               |
| **`renderInterpolation`** | -         | `boolean`                                                       | Smooth fixed-step motion between updates without changing game state. Defaults to true. |
| **`scaling`**             | -         | `FlxBrowserScaleMode \| FlxBrowserScaleOptions`                 | CSS-space canvas scaling policy. Defaults to aspect-preserving `fit`.                   |
| **`showPreloader`**       | -         | `boolean`                                                       | -                                                                                       |
| **`signal`**              | -         | `AbortSignal`                                                   | Cancels pending application-level startup and retry waits.                              |
| **`title`**               | -         | `string`                                                        | -                                                                                       |
| **`updateFramerate`**     | -         | `number`                                                        | Fixed simulation rate in updates per second. Defaults to 60.                            |
| **`width`**               | -         | `number`                                                        | -                                                                                       |
| **`zoom`**                | -         | `number`                                                        | -                                                                                       |
