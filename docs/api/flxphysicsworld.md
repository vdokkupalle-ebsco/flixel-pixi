---
title: FlxPhysicsWorld (Class)
description: API reference documentation for FlxPhysicsWorld in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsWorld

State-scoped owner for an optional physics backend.

Coordinates use Flixel logical pixels, degrees, and seconds. A bound body is positioned at its object's midpoint. Static and kinematic objects push their transforms before each step; dynamic bodies pull solver state afterward.

```ts
export declare class FlxPhysicsWorld
```

## Constructors

```ts
constructor(backend: FlxPhysicsBackendWorld, options?: FlxPhysicsWorldOptions)
```

Constructs a new instance of the `FlxPhysicsWorld` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `backend` | `FlxPhysicsBackendWorld` | - |
| `options` | `FlxPhysicsWorldOptions` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`bodyCount`** | `readonly` | `number` | - |
| **`capabilities`** | `readonly` | `FlxPhysicsCapabilities` | - |
| **`contactEnded`** | `readonly` | `FlxSignal<FlxPhysicsContact>` | - |
| **`contactStarted`** | `readonly` | `FlxSignal<FlxPhysicsContact>` | - |
| **`contactStayed`** | `readonly` | `FlxSignal<FlxPhysicsContact>` | - |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`jointCount`** | `readonly` | `number` | - |
| **`paused`** | - | `boolean` | - |

## Methods

### `addBody()`

```ts
addBody(object: FlxObject, definition: FlxPhysicsObjectDefinition): FlxPhysicsBody
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `FlxObject` | - |
| `definition` | `FlxPhysicsObjectDefinition` | - |

**Returns:** `FlxPhysicsBody`

### `addJoint()`

```ts
addJoint(definition: FlxPhysicsJointDefinition): FlxPhysicsJoint
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `definition` | `FlxPhysicsJointDefinition` | - |

**Returns:** `FlxPhysicsJoint`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `getBody()`

```ts
getBody(idOrObject: string | FlxObject): FlxPhysicsBody | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `idOrObject` | `string \| FlxObject` | - |

**Returns:** `FlxPhysicsBody | undefined`

### `getDebugGeometry()`

```ts
getDebugGeometry(): readonly FlxPhysicsDebugPrimitive[]
```

**Returns:** `readonly FlxPhysicsDebugPrimitive[]`

### `getJoint()`

```ts
getJoint(id: string): FlxPhysicsJoint | undefined
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `FlxPhysicsJoint | undefined`

### `queryAabb()`

```ts
queryAabb(bounds: FlxPhysicsAabb, filter?: FlxPhysicsQueryFilter): readonly FlxPhysicsQueryHit[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `bounds` | `FlxPhysicsAabb` | - |
| `filter` | `FlxPhysicsQueryFilter` | - |

**Returns:** `readonly FlxPhysicsQueryHit[]`

### `queryPoint()`

```ts
queryPoint(point: FlxPhysicsVector, filter?: FlxPhysicsQueryFilter): readonly FlxPhysicsQueryHit[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `FlxPhysicsVector` | - |
| `filter` | `FlxPhysicsQueryFilter` | - |

**Returns:** `readonly FlxPhysicsQueryHit[]`

### `queryRay()`

```ts
queryRay(query: FlxPhysicsRayQuery): readonly FlxPhysicsQueryHit[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `query` | `FlxPhysicsRayQuery` | - |

**Returns:** `readonly FlxPhysicsQueryHit[]`

### `removeBody()`

```ts
removeBody(bodyOrObject: FlxPhysicsBody | FlxObject): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `bodyOrObject` | `FlxPhysicsBody \| FlxObject` | - |

**Returns:** `boolean`

### `removeJoint()`

```ts
removeJoint(jointOrId: FlxPhysicsJoint | string): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `jointOrId` | `FlxPhysicsJoint \| string` | - |

**Returns:** `boolean`

### `reset()`

```ts
reset(): void
```

**Returns:** `void`

### `setGravity()`

```ts
setGravity(gravity: FlxPhysicsVector): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `gravity` | `FlxPhysicsVector` | - |

**Returns:** `void`

### `step()`

```ts
step(elapsed: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `elapsed` | `number` | - |

**Returns:** `void`

