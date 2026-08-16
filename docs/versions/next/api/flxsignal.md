---
title: FlxSignal (Class)
description: API reference documentation for FlxSignal in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSignal

Small mutation-safe signal used by state lifecycle events.

```ts
export declare class FlxSignal<T>
```

## Methods

### `add()`

```ts
add(listener: FlxSignalListener<T>): FlxSignalListener<T>
```

**Parameters:**

| Parameter  | Type                   | Description |
| :--------- | :--------------------- | :---------- |
| `listener` | `FlxSignalListener<T>` | -           |

**Returns:** `FlxSignalListener<T>`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `dispatch()`

```ts
dispatch(value: T): void
```

**Parameters:**

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `value`   | `T`  | -           |

**Returns:** `void`

### `remove()`

```ts
remove(listener: FlxSignalListener<T>): boolean
```

**Parameters:**

| Parameter  | Type                   | Description |
| :--------- | :--------------------- | :---------- |
| `listener` | `FlxSignalListener<T>` | -           |

**Returns:** `boolean`
