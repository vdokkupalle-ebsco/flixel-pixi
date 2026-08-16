---
title: FlxEmitter (Class)
description: API reference documentation for FlxEmitter in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxEmitter

Deterministic burst/stream emitter backed by `FlxGroup` recycling.

```ts
export declare class FlxEmitter extends FlxGroup<FlxParticle>
```

## Constructors

```ts
constructor(x?: number, y?: number, size?: number)
```

Constructs a new instance of the `FlxEmitter` class

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |
| `size`    | `number` | -           |

## Properties

| Property               | Modifiers | Type                             | Description |
| :--------------------- | :-------- | :------------------------------- | :---------- |
| **`bounce`**           | -         | `number`                         | -           |
| **`frequency`**        | -         | `number`                         | -           |
| **`gravity`**          | -         | `number`                         | -           |
| **`height`**           | -         | `number`                         | -           |
| **`lifespan`**         | -         | `number`                         | -           |
| **`maxParticleSpeed`** | -         | `FlxPoint`                       | -           |
| **`maxRotation`**      | -         | `number`                         | -           |
| **`minParticleSpeed`** | -         | `FlxPoint`                       | -           |
| **`minRotation`**      | -         | `number`                         | -           |
| **`on`**               | -         | `boolean`                        | -           |
| **`particleClass`**    | -         | `FlxParticleConstructor \| null` | -           |
| **`particleDrag`**     | -         | `FlxPoint`                       | -           |
| **`width`**            | -         | `number`                         | -           |
| **`x`**                | -         | `number`                         | -           |
| **`y`**                | -         | `number`                         | -           |

## Methods

### `at()`

```ts
at(object: FlxObject): void
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `object`  | `FlxObject` | -           |

**Returns:** `void`

### `createRenderHandle()`

```ts
createRenderHandle(options?: FlxEmitterRenderOptions): FlxEmitterRenderHandle
```

**Parameters:**

| Parameter | Type                      | Description |
| :-------- | :------------------------ | :---------- |
| `options` | `FlxEmitterRenderOptions` | -           |

**Returns:** `FlxEmitterRenderHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `emitParticle()`

```ts
emitParticle(): void
```

**Returns:** `void`

### `kill()`

```ts
kill(): void
```

**Returns:** `void`

### `makeParticles()`

```ts
makeParticles(source: FlxGraphic | Texture, quantity?: number, bakedRotations?: number, multiple?: boolean, collide?: number): this
```

**Parameters:**

| Parameter        | Type                    | Description |
| :--------------- | :---------------------- | :---------- |
| `source`         | `FlxGraphic \| Texture` | -           |
| `quantity`       | `number`                | -           |
| `bakedRotations` | `number`                | -           |
| `multiple`       | `boolean`               | -           |
| `collide`        | `number`                | -           |

**Returns:** `this`

### `setRotation()`

```ts
setRotation(min?: number, max?: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `min`     | `number` | -           |
| `max`     | `number` | -           |

**Returns:** `void`

### `setSize()`

```ts
setSize(width: number, height: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `width`   | `number` | -           |
| `height`  | `number` | -           |

**Returns:** `void`

### `setXSpeed()`

```ts
setXSpeed(min?: number, max?: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `min`     | `number` | -           |
| `max`     | `number` | -           |

**Returns:** `void`

### `setYSpeed()`

```ts
setYSpeed(min?: number, max?: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `min`     | `number` | -           |
| `max`     | `number` | -           |

**Returns:** `void`

### `start()`

```ts
start(explode?: boolean, lifespan?: number, frequency?: number, quantity?: number): void
```

**Parameters:**

| Parameter   | Type      | Description |
| :---------- | :-------- | :---------- |
| `explode`   | `boolean` | -           |
| `lifespan`  | `number`  | -           |
| `frequency` | `number`  | -           |
| `quantity`  | `number`  | -           |

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`
