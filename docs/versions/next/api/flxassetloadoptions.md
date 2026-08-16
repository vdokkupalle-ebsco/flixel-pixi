---
title: FlxAssetLoadOptions (Interface)
description: API reference documentation for FlxAssetLoadOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAssetLoadOptions

Retry, progress, and failure policy for a foreground asset load.

```ts
export interface FlxAssetLoadOptions
```

## Properties

| Property         | Modifiers | Type                                     | Description |
| :--------------- | :-------- | :--------------------------------------- | :---------- |
| **`onError`**    | -         | `(error: Error, source: string) => void` | -           |
| **`onProgress`** | -         | `(progress: number) => void`             | -           |
| **`retryCount`** | -         | `number`                                 | -           |
| **`retryDelay`** | -         | `number`                                 | -           |
| **`strategy`**   | -         | `'throw' \| 'skip' \| 'retry'`           | -           |
