---
title: FlxEmitterRenderHandle (Class)
description: API reference documentation for FlxEmitterRenderHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxEmitterRenderHandle

Pixi projection of an authoritative, group-backed emitter pool.

```ts
export declare class FlxEmitterRenderHandle implements FlxRenderHandle
```

## Constructors

```ts
constructor(owner: FlxEmitter, options?: FlxEmitterRenderOptions, onDestroy?: () => void)
```

Constructs a new instance of the `FlxEmitterRenderHandle` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `FlxEmitter` | - |
| `options` | `FlxEmitterRenderOptions` | - |
| `onDestroy` | `() => void` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`optimized`** | `readonly` | `boolean` | - |
| **`particleContainer`** | `readonly` | `ParticleContainer<Particle> \| null` | - |
| **`projectedParticleCount`** | `readonly` | `number` | - |
| **`view`** | `readonly` | `Container<import("pixi.js").ContainerChild>` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `sync()`

```ts
sync(camera?: FlxCamera, interpolationAlpha?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |
| `interpolationAlpha` | `number` | - |

**Returns:** `void`

