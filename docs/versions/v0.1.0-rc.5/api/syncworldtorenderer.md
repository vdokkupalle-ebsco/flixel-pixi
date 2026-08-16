---
title: syncWorldToRenderer (Function)
description: API reference documentation for syncWorldToRenderer in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-function">Function</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# syncWorldToRenderer

Synchronize renderer entries with the active state's renderables. Adds missing objects; removes entries for objects no longer in the tree. Does not clear and rebuild all handles. Clears [link](#) when a context is attached.

```ts
export declare function syncWorldToRenderer(
  game: FlxGame,
  renderer: FlxCameraRenderer,
): void;
```

## Parameters

| Parameter  | Type                | Description |
| :--------- | :------------------ | :---------- |
| `game`     | `FlxGame`           | -           |
| `renderer` | `FlxCameraRenderer` | -           |

## Returns

`void`
