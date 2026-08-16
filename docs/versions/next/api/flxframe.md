---
title: FlxFrame (Class)
description: API reference documentation for FlxFrame in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxFrame

One named animation frame backed by a lazily resolved Pixi texture view.

```ts
export declare class FlxFrame
```

## Constructors

```ts
constructor(options: { index: number; name?: string | null; texture: Texture | (() => Texture); duration?: number; width?: number; height?: number; })
```

Constructs a new instance of the `FlxFrame` class

| Parameter | Type                                                                                                                                 | Description |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| `options` | `{ index: number; name?: string \| null; texture: Texture \| (() => Texture); duration?: number; width?: number; height?: number; }` | -           |

## Properties

| Property       | Modifiers  | Type             | Description |
| :------------- | :--------- | :--------------- | :---------- |
| **`duration`** | -          | `number`         | -           |
| **`height`**   | `readonly` | `number`         | -           |
| **`index`**    | `readonly` | `number`         | -           |
| **`name`**     | -          | `string \| null` | -           |
| **`texture`**  | `readonly` | `Texture`        | -           |
| **`width`**    | `readonly` | `number`         | -           |
