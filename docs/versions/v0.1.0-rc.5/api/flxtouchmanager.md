---
title: FlxTouchManager (Class)
description: API reference documentation for FlxTouchManager in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTouchManager

Deterministic multi-touch tracker with step-based swipe recognition.

```ts
export declare class FlxTouchManager
```

## Constructors

```ts
constructor(context: FlxContext, options?: FlxTouchOptions)
```

Constructs a new instance of the `FlxTouchManager` class

| Parameter | Type              | Description |
| :-------- | :---------------- | :---------- |
| `context` | `FlxContext`      | -           |
| `options` | `FlxTouchOptions` | -           |

## Properties

| Property                   | Modifiers  | Type                  | Description |
| :------------------------- | :--------- | :-------------------- | :---------- |
| **`active`**               | `readonly` | `readonly FlxTouch[]` | -           |
| **`firstActive`**          | `readonly` | `FlxTouch \| null`    | -           |
| **`maximumSwipeDuration`** | `readonly` | `number`              | -           |
| **`minimumSwipeDistance`** | `readonly` | `number`              | -           |
| **`swipes`**               | `readonly` | `readonly FlxSwipe[]` | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `get()`

```ts
get(pointerId: number): FlxTouch | null
```

**Parameters:**

| Parameter   | Type     | Description |
| :---------- | :------- | :---------- |
| `pointerId` | `number` | -           |

**Returns:** `FlxTouch | null`

### `handlePointerCancel()`

```ts
handlePointerCancel(event: FlxTouchEventLike): void
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `event`   | `FlxTouchEventLike` | -           |

**Returns:** `void`

### `handlePointerDown()`

```ts
handlePointerDown(event: FlxTouchEventLike): void
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `event`   | `FlxTouchEventLike` | -           |

**Returns:** `void`

### `handlePointerMove()`

```ts
handlePointerMove(event: FlxTouchEventLike): void
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `event`   | `FlxTouchEventLike` | -           |

**Returns:** `void`

### `handlePointerUp()`

```ts
handlePointerUp(event: FlxTouchEventLike): void
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `event`   | `FlxTouchEventLike` | -           |

**Returns:** `void`

### `playback()`

```ts
playback(records: readonly FlxTouchFrameRecord[]): void
```

**Parameters:**

| Parameter | Type                             | Description |
| :-------- | :------------------------------- | :---------- |
| `records` | `readonly FlxTouchFrameRecord[]` | -           |

**Returns:** `void`

### `record()`

```ts
record(): FlxTouchFrameRecord[]
```

**Returns:** `FlxTouchFrameRecord[]`

### `releaseAll()`

```ts
releaseAll(): void
```

**Returns:** `void`

### `reset()`

```ts
reset(): void
```

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`
