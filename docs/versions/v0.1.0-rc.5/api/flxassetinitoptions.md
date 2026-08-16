---
title: FlxAssetInitOptions (Interface)
description: API reference documentation for FlxAssetInitOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAssetInitOptions

Initialization options for the Pixi asset resolver.

```ts
export interface FlxAssetInitOptions
```

## Properties

| Property                  | Modifiers | Type                                | Description |
| :------------------------ | :-------- | :---------------------------------- | :---------- |
| **`basePath`**            | -         | `string`                            | -           |
| **`defaultSearchParams`** | -         | `string \| Record<string, unknown>` | -           |
| **`loadOptions`**         | -         | `FlxAssetLoadOptions`               | -           |
| **`manifest`**            | -         | `FlxAssetManifest \| string`        | -           |
| **`skipDetections`**      | -         | `boolean`                           | -           |
