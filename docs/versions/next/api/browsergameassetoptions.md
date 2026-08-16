---
title: BrowserGameAssetOptions (Interface)
description: API reference documentation for BrowserGameAssetOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# BrowserGameAssetOptions

Declarative asset configuration for browser startup.

```ts
export interface BrowserGameAssetOptions
```

## Properties

| Property                | Modifiers | Type                  | Description                                                              |
| :---------------------- | :-------- | :-------------------- | :----------------------------------------------------------------------- |
| **`backgroundBundles`** | -         | `string \| string[]`  | Bundles to begin loading after the first frame without blocking startup. |
| **`bundles`**           | -         | `FlxAssetBundle[]`    | Bundles registered before the custom preload callback runs.              |
| **`init`**              | -         | `FlxAssetInitOptions` | Pixi asset resolver initialization options.                              |
| **`initialBundles`**    | -         | `string \| string[]`  | Bundle or bundles that must load before the game is created.             |
| **`service`**           | -         | `FlxAssets`           | Optional preconfigured service, primarily for adapters and tests.        |
