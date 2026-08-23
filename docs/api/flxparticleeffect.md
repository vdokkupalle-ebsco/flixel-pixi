---
title: FlxParticleEffect (Class)
description: API reference documentation for FlxParticleEffect in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxParticleEffect

A movable, ordered group of emitters created from a Particle Editor export. Add the effect itself to a state; its child emitters follow the document's layer order and offsets.

```ts
export declare class FlxParticleEffect extends FlxGroup<FlxParticleEmitter>
```

## Constructors

```ts
constructor(document: unknown, resolveSource: FlxParticleEffectSourceResolver, x?: number, y?: number)
```

Constructs a new instance of the `FlxParticleEffect` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `document` | `unknown` | - |
| `resolveSource` | `FlxParticleEffectSourceResolver` | - |
| `x` | `number` | - |
| `y` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`diagnostics`** | `readonly` | `FlxParticleEffectDiagnostics` | Combined runtime counters for enabled layers. |
| **`document`** | `readonly` | `ParticleEffectDocumentV1` | Validated portable document used to construct this effect. |
| **`layers`** | `readonly` | `readonly FlxParticleEffectLayer[]` | Enabled runtime layers in document render order. |
| **`x`** | - | `number` | World-space effect origin on the horizontal axis. |
| **`y`** | - | `number` | World-space effect origin on the vertical axis. |

## Methods

### `static` `fromAssets()`

```ts
static fromAssets(document: unknown, options?: FlxParticleEffectAssetOptions): FlxParticleEffect
```

Create an effect using textures already loaded by [link](#).

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `document` | `unknown` | - |
| `options` | `FlxParticleEffectAssetOptions` | - |

**Returns:** `FlxParticleEffect`

### `pause()`

```ts
pause(): void
```

Pause every enabled layer without clearing active particles.

**Returns:** `void`

### `reset()`

```ts
reset(): void
```

Reset the deterministic simulation and clear every enabled layer.

**Returns:** `void`

### `resume()`

```ts
resume(): void
```

Resume every enabled layer from its paused state.

**Returns:** `void`

### `setPosition()`

```ts
setPosition(x: number, y: number): void
```

Move the effect origin while preserving every layer's local offset.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |

**Returns:** `void`

### `start()`

```ts
start(restart?: boolean): void
```

Start every enabled layer in document order.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `restart` | `boolean` | - |

**Returns:** `void`

### `stop()`

```ts
stop(clear?: boolean): void
```

Stop emission, optionally clearing all active particles.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `clear` | `boolean` | - |

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`

