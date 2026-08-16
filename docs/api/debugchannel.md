---
title: DebugChannel (Class)
description: API reference documentation for DebugChannel in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# DebugChannel

Typed pub/sub channel that connects the game loop to optional debug consumers.

```ts
export declare class DebugChannel
```

## Methods

### `destroy()`

```ts
destroy(): void
```

Removes all listeners.

**Returns:** `void`

### `emit()`

```ts
emit<T extends DebugEventType>(type: T, payload: DebugEvents[T]): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `type` | `T` | - |
| `payload` | `DebugEvents[T]` | - |

**Returns:** `void`

### `off()`

```ts
off<T extends DebugEventType>(type: T, handler: DebugHandler<T>): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `type` | `T` | - |
| `handler` | `DebugHandler<T>` | - |

**Returns:** `void`

### `on()`

```ts
on<T extends DebugEventType>(type: T, handler: DebugHandler<T>): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `type` | `T` | - |
| `handler` | `DebugHandler<T>` | - |

**Returns:** `void`

