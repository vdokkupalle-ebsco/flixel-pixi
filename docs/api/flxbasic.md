---
title: FlxBasic (Class)
description: API reference documentation for FlxBasic in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBasic

Base lifecycle object shared by gameplay objects, groups, and plugins.

```ts
export declare class FlxBasic
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`active`** | - | `boolean` | - |
| **`activeCount`** | `static` | `number` | - |
| **`alive`** | - | `boolean` | - |
| **`cameras`** | - | `readonly FlxCamera[] \| null` | - |
| **`container`** | - | `FlxContainer \| null` | Exclusive logical container that currently owns this object, if any. |
| **`exists`** | - | `boolean` | - |
| **`ID`** | - | `number` | - |
| **`ignoreDrawDebug`** | - | `boolean` | - |
| **`visible`** | - | `boolean` | - |
| **`visibleCount`** | `static` | `number` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

Override to release owned resources.

**Returns:** `void`

### `draw()`

```ts
draw(): void
```

Renderer adapters override this without making core depend on PixiJS.

**Returns:** `void`

### `drawDebug()`

```ts
drawDebug(camera?: unknown): void
```

Override to enqueue debug geometry for an adapter-owned camera.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `unknown` | - |

**Returns:** `void`

### `kill()`

```ts
kill(): void
```

Marks the object both dead and nonexistent.

**Returns:** `void`

### `postUpdate()`

```ts
postUpdate(): void
```

Called immediately after `update`.

**Returns:** `void`

### `preUpdate()`

```ts
preUpdate(): void
```

Called immediately before `update`.

**Returns:** `void`

### `revive()`

```ts
revive(): void
```

Marks the object alive and existing.

**Returns:** `void`

### `toString()`

```ts
toString(): string
```

**Returns:** `string`

### `update()`

```ts
update(): void
```

Override with authoritative simulation behavior.

**Returns:** `void`

