---
title: FlxPhysicsBackendWorld (Interface)
description: API reference documentation for FlxPhysicsBackendWorld in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPhysicsBackendWorld

Low-level renderer-neutral world implemented by an optional solver adapter. Game code normally uses `FlxPhysicsWorld` instead of backend body handles.

```ts
export interface FlxPhysicsBackendWorld
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`capabilities`** | `readonly` | `FlxPhysicsCapabilities` | - |

## Methods

### `applyForce()`

```ts
applyForce(body: FlxPhysicsBackendBody, force: FlxPhysicsVector, point?: FlxPhysicsVector): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `body` | `FlxPhysicsBackendBody` | - |
| `force` | `FlxPhysicsVector` | - |
| `point` | `FlxPhysicsVector` | - |

**Returns:** `void`

### `applyImpulse()`

```ts
applyImpulse(body: FlxPhysicsBackendBody, impulse: FlxPhysicsVector, point?: FlxPhysicsVector): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `body` | `FlxPhysicsBackendBody` | - |
| `impulse` | `FlxPhysicsVector` | - |
| `point` | `FlxPhysicsVector` | - |

**Returns:** `void`

### `createBody()`

```ts
createBody(definition: FlxPhysicsBodyDefinition): FlxPhysicsBackendBody
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `definition` | `FlxPhysicsBodyDefinition` | - |

**Returns:** `FlxPhysicsBackendBody`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `destroyBody()`

```ts
destroyBody(body: FlxPhysicsBackendBody): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `body` | `FlxPhysicsBackendBody` | - |

**Returns:** `void`

### `drainContacts()`

```ts
drainContacts(): readonly FlxPhysicsBackendContact[]
```

**Returns:** `readonly FlxPhysicsBackendContact[]`

### `getBodyState()`

```ts
getBodyState(body: FlxPhysicsBackendBody): FlxPhysicsBodyState
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `body` | `FlxPhysicsBackendBody` | - |

**Returns:** `FlxPhysicsBodyState`

### `getDebugGeometry()`

```ts
getDebugGeometry?(): readonly FlxPhysicsDebugPrimitive[]
```

**Returns:** `readonly FlxPhysicsDebugPrimitive[]`

### `queryAabb()`

```ts
queryAabb(bounds: FlxPhysicsAabb, filter?: FlxPhysicsQueryFilter): readonly FlxPhysicsBackendQueryHit[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `bounds` | `FlxPhysicsAabb` | - |
| `filter` | `FlxPhysicsQueryFilter` | - |

**Returns:** `readonly FlxPhysicsBackendQueryHit[]`

### `queryPoint()`

```ts
queryPoint(point: FlxPhysicsVector, filter?: FlxPhysicsQueryFilter): readonly FlxPhysicsBackendQueryHit[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `FlxPhysicsVector` | - |
| `filter` | `FlxPhysicsQueryFilter` | - |

**Returns:** `readonly FlxPhysicsBackendQueryHit[]`

### `queryRay()`

```ts
queryRay?(query: FlxPhysicsRayQuery): readonly FlxPhysicsBackendQueryHit[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `query` | `FlxPhysicsRayQuery` | - |

**Returns:** `readonly FlxPhysicsBackendQueryHit[]`

### `reset()`

```ts
reset(): void
```

**Returns:** `void`

### `setBodyTransform()`

```ts
setBodyTransform(body: FlxPhysicsBackendBody, transform: FlxPhysicsTransform): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `body` | `FlxPhysicsBackendBody` | - |
| `transform` | `FlxPhysicsTransform` | - |

**Returns:** `void`

### `setBodyType()`

```ts
setBodyType(body: FlxPhysicsBackendBody, type: FlxPhysicsBodyType): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `body` | `FlxPhysicsBackendBody` | - |
| `type` | `FlxPhysicsBodyType` | - |

**Returns:** `void`

### `setBodyVelocity()`

```ts
setBodyVelocity(body: FlxPhysicsBackendBody, velocity: FlxPhysicsVector, angularVelocity: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `body` | `FlxPhysicsBackendBody` | - |
| `velocity` | `FlxPhysicsVector` | - |
| `angularVelocity` | `number` | - |

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

