---
title: FlxAssetLoadError (Class)
description: API reference documentation for FlxAssetLoadError in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAssetLoadError

Failure enriched with the alias or URL requested by the game.

```ts
export declare class FlxAssetLoadError extends Error
```

## Constructors

```ts
constructor(assetId: string, options: { cause: unknown; })
```

Constructs a new instance of the `FlxAssetLoadError` class

| Parameter | Type                  | Description |
| :-------- | :-------------------- | :---------- |
| `assetId` | `string`              | -           |
| `options` | `{ cause: unknown; }` | -           |

## Properties

| Property      | Modifiers  | Type     | Description |
| :------------ | :--------- | :------- | :---------- |
| **`assetId`** | `readonly` | `string` | -           |
