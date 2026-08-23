---
title: FlxParticleEmitter (Class)
description: API reference documentation for FlxParticleEmitter in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxParticleEmitter

Renders a validated particle preset through Flixel-Pixi's existing emitter and camera pipeline while delegating simulation to the deterministic runtime.

```ts
export declare class FlxParticleEmitter extends FlxEmitter
```

## Constructors

```ts
constructor(preset: unknown, source: FlxParticleEmitterSource, x?: number, y?: number)
```

Constructs a new instance of the `FlxParticleEmitter` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `preset` | `unknown` | - |
| `source` | `FlxParticleEmitterSource` | - |
| `x` | `number` | - |
| `y` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`diagnostics`** | `readonly` | `ParticleEmitterDiagnostics` | - |
| **`preset`** | `readonly` | `ParticlePresetV1` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `static` `fromAssets()`

```ts
static fromAssets(preset: unknown, options?: FlxParticleEmitterAssetOptions): FlxParticleEmitter
```

Create an emitter from an asset that has already been loaded by [link](#). Named frame presets may provide a frame collection.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `preset` | `unknown` | - |
| `options` | `FlxParticleEmitterAssetOptions` | - |

**Returns:** `FlxParticleEmitter`

### `kill()`

```ts
kill(): void
```

**Returns:** `void`

### `pause()`

```ts
pause(): void
```

**Returns:** `void`

### `resetPreset()`

```ts
resetPreset(): void
```

**Returns:** `void`

### `resume()`

```ts
resume(): void
```

**Returns:** `void`

### `start()`

```ts
start(restart?: boolean, _lifespan?: number, _frequency?: number, _quantity?: number): void
```

Start the preset. Passing false continues without resetting its pool.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `restart` | `boolean` | - |
| `_lifespan` | `number` | - |
| `_frequency` | `number` | - |
| `_quantity` | `number` | - |

**Returns:** `void`

### `stop()`

```ts
stop(clear?: boolean): void
```

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

