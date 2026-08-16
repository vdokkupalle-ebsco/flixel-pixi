---
title: FlxObjectInspector (Class)
description: API reference documentation for FlxObjectInspector in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxObjectInspector

Optional debugger adapter for CPU-authoritative pointer selection. It never relies on Pixi hit testing and only intercepts matching debug clicks.

```ts
export declare class FlxObjectInspector
```

## Constructors

```ts
constructor(renderer: FlxCameraRenderer, options: FlxObjectInspectorOptions)
```

Constructs a new instance of the `FlxObjectInspector` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `renderer` | `FlxCameraRenderer` | - |
| `options` | `FlxObjectInspectorOptions` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`enabled`** | - | `boolean` | - |
| **`selectedObject`** | `readonly` | `FlxObject \| null` | - |
| **`selection`** | `readonly` | `FlxCameraObjectPick \| null` | - |

## Methods

### `attach()`

```ts
attach(target: HTMLElement): () => void
```

Attaches Alt+pointer selection to a letterboxed or scaled game element.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `HTMLElement` | - |

**Returns:** `() => void`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `detach()`

```ts
detach(target: HTMLElement): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `HTMLElement` | - |

**Returns:** `void`

### `selectAt()`

```ts
selectAt(point: Readonly<PointLike>): FlxCameraObjectPick | null
```

Selects the topmost object at a logical game-screen coordinate.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `Readonly<PointLike>` | - |

**Returns:** `FlxCameraObjectPick | null`

