---
title: FlxPhysicsBody (Interface)
description: API reference documentation for FlxPhysicsBody in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsBody

Portable body exposed to game code without a solver-native handle.

```ts
export interface FlxPhysicsBody
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`id`** | `readonly` | `string` | - |
| **`object`** | `readonly` | `FlxObject` | - |
| **`type`** | `readonly` | `FlxPhysicsBodyType` | - |

## Methods

### `applyForce()`

```ts
applyForce(force: FlxPhysicsVector, point?: FlxPhysicsVector): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `force` | `FlxPhysicsVector` | - |
| `point` | `FlxPhysicsVector` | - |

**Returns:** `void`

### `applyImpulse()`

```ts
applyImpulse(impulse: FlxPhysicsVector, point?: FlxPhysicsVector): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `impulse` | `FlxPhysicsVector` | - |
| `point` | `FlxPhysicsVector` | - |

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `setTransform()`

```ts
setTransform(transform: FlxPhysicsTransform): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `transform` | `FlxPhysicsTransform` | - |

**Returns:** `void`

### `setType()`

```ts
setType(type: FlxPhysicsBodyType): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `type` | `FlxPhysicsBodyType` | - |

**Returns:** `void`

### `setVelocity()`

```ts
setVelocity(velocity: FlxPhysicsVector, angularVelocity?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `velocity` | `FlxPhysicsVector` | - |
| `angularVelocity` | `number` | - |

**Returns:** `void`

