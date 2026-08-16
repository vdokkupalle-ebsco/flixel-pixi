---
title: Mouse (Class)
description: API reference documentation for Mouse in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# Mouse

Deterministic pointer/mouse state with camera-aware coordinates.

```ts
export declare class Mouse extends FlxPoint
```

## Constructors

```ts
constructor(context: FlxContext)
```

Constructs a new instance of the `Mouse` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `context` | `FlxContext` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`cursor`** | `readonly` | `string` | - |
| **`screenX`** | - | `number` | - |
| **`screenY`** | - | `number` | - |
| **`visible`** | `readonly` | `boolean` | - |
| **`wheel`** | - | `number` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `getGlobalPosition()`

```ts
getGlobalPosition(point?: FlxPoint): FlxPoint
```

Copies logical canvas coordinates before camera transforms.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `FlxPoint` | - |

**Returns:** `FlxPoint`

### `getScreenPosition()`

```ts
getScreenPosition(camera?: FlxCamera, point?: FlxPoint): FlxPoint
```

Returns camera-local coordinates before zoom/rotation/viewport transforms.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |
| `point` | `FlxPoint` | - |

**Returns:** `FlxPoint`

### `getWorldPosition()`

```ts
getWorldPosition(camera?: FlxCamera, point?: FlxPoint): FlxPoint
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |
| `point` | `FlxPoint` | - |

**Returns:** `FlxPoint`

### `handleMouseDown()`

```ts
handleMouseDown(event: FlxPointerEventLike): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `event` | `FlxPointerEventLike` | - |

**Returns:** `void`

### `handleMouseUp()`

```ts
handleMouseUp(event: FlxPointerEventLike): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `event` | `FlxPointerEventLike` | - |

**Returns:** `void`

### `handleMouseWheel()`

```ts
handleMouseWheel(delta: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `delta` | `number` | - |

**Returns:** `void`

### `handlePointerCancel()`

```ts
handlePointerCancel(event: FlxPointerEventLike): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `event` | `FlxPointerEventLike` | - |

**Returns:** `void`

### `handlePointerDown()`

```ts
handlePointerDown(event: FlxPointerEventLike): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `event` | `FlxPointerEventLike` | - |

**Returns:** `void`

### `handlePointerMove()`

```ts
handlePointerMove(event: FlxPointerEventLike): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `event` | `FlxPointerEventLike` | - |

**Returns:** `void`

### `handlePointerUp()`

```ts
handlePointerUp(event: FlxPointerEventLike): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `event` | `FlxPointerEventLike` | - |

**Returns:** `void`

### `handleWheel()`

```ts
handleWheel(delta: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `delta` | `number` | - |

**Returns:** `void`

### `hide()`

```ts
hide(): void
```

**Returns:** `void`

### `justCancelled()`

```ts
justCancelled(button?: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `boolean`

### `justPressed()`

```ts
justPressed(button?: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `boolean`

### `justReleased()`

```ts
justReleased(button?: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `boolean`

### `load()`

```ts
load(cursorUrl: string, xOffset?: number, yOffset?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `cursorUrl` | `string` | - |
| `xOffset` | `number` | - |
| `yOffset` | `number` | - |

**Returns:** `void`

### `playback()`

```ts
playback(record: FlxMouseRecord): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `record` | `FlxMouseRecord` | - |

**Returns:** `void`

### `pressed()`

```ts
pressed(button?: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `boolean`

### `record()`

```ts
record(): FlxMouseRecord
```

**Returns:** `FlxMouseRecord`

### `releaseAll()`

```ts
releaseAll(cancelled?: boolean): void
```

Queues releases for published buttons and discards unpublished input.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `cancelled` | `boolean` | - |

**Returns:** `void`

### `reset()`

```ts
reset(): void
```

**Returns:** `void`

### `show()`

```ts
show(): void
```

**Returns:** `void`

### `unload()`

```ts
unload(): void
```

**Returns:** `void`

### `update()`

```ts
update(): void
```

Publishes queued pointer changes for one authoritative simulation step.

**Returns:** `void`

