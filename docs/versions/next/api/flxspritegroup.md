---
title: FlxSpriteGroup (Class)
description: API reference documentation for FlxSpriteGroup in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSpriteGroup

A transformable sprite composite backed by a logical `FlxGroup`.

Members use world-space `x`/`y` while owned. `add()` interprets an incoming member position as local to the composite and translates it into world space; `remove()` converts it back to local space. Collision expands to the member AABBs rather than treating the composite as one rectangle.

```ts
export declare class FlxSpriteGroup<T extends FlxSprite = FlxSprite> extends FlxSprite
```

## Constructors

```ts
constructor(x?: number, y?: number, maxSize?: number)
```

Constructs a new instance of the `FlxSpriteGroup` class

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |
| `maxSize` | `number` | -           |

## Properties

| Property          | Modifiers  | Type            | Description |
| :---------------- | :--------- | :-------------- | :---------- |
| **`alpha`**       | -          | `number`        | -           |
| **`color`**       | -          | `number`        | -           |
| **`directAlpha`** | -          | `boolean`       | -           |
| **`group`**       | `readonly` | `FlxGroup<T>`   | -           |
| **`length`**      | `readonly` | `number`        | -           |
| **`maxSize`**     | -          | `number`        | -           |
| **`members`**     | `readonly` | `(T \| null)[]` | -           |
| **`solid`**       | -          | `boolean`       | -           |

## Methods

### `add()`

```ts
add(sprite: T): T
```

**Parameters:**

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `sprite`  | `T`  | -           |

**Returns:** `T`

### `callAll()`

```ts
callAll(functionName: string, recurse?: boolean): void
```

**Parameters:**

| Parameter      | Type      | Description |
| :------------- | :-------- | :---------- |
| `functionName` | `string`  | -           |
| `recurse`      | `boolean` | -           |

**Returns:** `void`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `contains()`

```ts
contains(sprite: FlxSprite, recurse?: boolean): boolean
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `sprite`  | `FlxSprite` | -           |
| `recurse` | `boolean`   | -           |

**Returns:** `boolean`

### `countDead()`

```ts
countDead(): number
```

**Returns:** `number`

### `countLiving()`

```ts
countLiving(): number
```

**Returns:** `number`

### `createGroup()`

```ts
protected createGroup(maxSize: number): FlxGroup<T>
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `maxSize` | `number` | -           |

**Returns:** `FlxGroup<T>`

### `createRenderHandle()`

```ts
createRenderHandle(): FlxRenderHandle
```

**Returns:** `FlxRenderHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `draw()`

```ts
draw(): void
```

**Returns:** `void`

### `findMaxX()`

```ts
findMaxX(): number
```

**Returns:** `number`

### `findMaxY()`

```ts
findMaxY(): number
```

**Returns:** `number`

### `findMinX()`

```ts
findMinX(): number
```

**Returns:** `number`

### `findMinY()`

```ts
findMinY(): number
```

**Returns:** `number`

### `getFirstAlive()`

```ts
getFirstAlive(): T | null
```

**Returns:** `T | null`

### `getFirstAvailable()`

```ts
getFirstAvailable(objectClass?: FlxBasicConstructor<T>): T | null
```

**Parameters:**

| Parameter     | Type                     | Description |
| :------------ | :----------------------- | :---------- |
| `objectClass` | `FlxBasicConstructor<T>` | -           |

**Returns:** `T | null`

### `getFirstDead()`

```ts
getFirstDead(): T | null
```

**Returns:** `T | null`

### `getFirstExtant()`

```ts
getFirstExtant(): T | null
```

**Returns:** `T | null`

### `getFirstNull()`

```ts
getFirstNull(): number
```

**Returns:** `number`

### `getMemberLocalPosition()`

```ts
getMemberLocalPosition(member: T, out?: FlxPoint): FlxPoint
```

Returns a member position relative to this composite's translation.

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `member`  | `T`        | -           |
| `out`     | `FlxPoint` | -           |

**Returns:** `FlxPoint`

### `getRandom()`

```ts
getRandom(startIndex?: number, length?: number): T | null
```

**Parameters:**

| Parameter    | Type     | Description |
| :----------- | :------- | :---------- |
| `startIndex` | `number` | -           |
| `length`     | `number` | -           |

**Returns:** `T | null`

### `getWorldPosition()`

```ts
getWorldPosition(local: Readonly<FlxPoint>, out?: FlxPoint): FlxPoint
```

Converts a translation-local point into authoritative world space.

**Parameters:**

| Parameter | Type                 | Description |
| :-------- | :------------------- | :---------- |
| `local`   | `Readonly<FlxPoint>` | -           |
| `out`     | `FlxPoint`           | -           |

**Returns:** `FlxPoint`

### `kill()`

```ts
kill(): void
```

**Returns:** `void`

### `multiTransformChildren()`

```ts
multiTransformChildren<V>(transforms: readonly FlxSpriteTransform<T, V>[], values: readonly V[]): void
```

Applies several transforms to every existing direct member.

**Parameters:**

| Parameter    | Type                                  | Description |
| :----------- | :------------------------------------ | :---------- |
| `transforms` | `readonly FlxSpriteTransform<T, V>[]` | -           |
| `values`     | `readonly V[]`                        | -           |

**Returns:** `void`

### `onScreen()`

```ts
onScreen(camera?: FlxCameraLike): boolean
```

**Parameters:**

| Parameter | Type            | Description |
| :-------- | :-------------- | :---------- |
| `camera`  | `FlxCameraLike` | -           |

**Returns:** `boolean`

### `overlaps()`

```ts
overlaps(objectOrGroup: FlxBasic): boolean
```

**Parameters:**

| Parameter       | Type       | Description |
| :-------------- | :--------- | :---------- |
| `objectOrGroup` | `FlxBasic` | -           |

**Returns:** `boolean`

### `overlapsAt()`

```ts
overlapsAt(x: number, y: number, objectOrGroup: FlxBasic): boolean
```

**Parameters:**

| Parameter       | Type       | Description |
| :-------------- | :--------- | :---------- |
| `x`             | `number`   | -           |
| `y`             | `number`   | -           |
| `objectOrGroup` | `FlxBasic` | -           |

**Returns:** `boolean`

### `overlapsPoint()`

```ts
overlapsPoint(point: Readonly<FlxPoint>): boolean
```

**Parameters:**

| Parameter | Type                 | Description |
| :-------- | :------------------- | :---------- |
| `point`   | `Readonly<FlxPoint>` | -           |

**Returns:** `boolean`

### `recycle()`

```ts
recycle(objectClass?: FlxBasicConstructor<T>): T | null
```

**Parameters:**

| Parameter     | Type                     | Description |
| :------------ | :----------------------- | :---------- |
| `objectClass` | `FlxBasicConstructor<T>` | -           |

**Returns:** `T | null`

### `remove()`

```ts
remove(sprite: T, splice?: boolean): T | null
```

**Parameters:**

| Parameter | Type      | Description |
| :-------- | :-------- | :---------- |
| `sprite`  | `T`       | -           |
| `splice`  | `boolean` | -           |

**Returns:** `T | null`

### `replace()`

```ts
replace(oldObject: T, newObject: T): T | null
```

**Parameters:**

| Parameter   | Type | Description |
| :---------- | :--- | :---------- |
| `oldObject` | `T`  | -           |
| `newObject` | `T`  | -           |

**Returns:** `T | null`

### `reset()`

```ts
reset(x: number, y: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

**Returns:** `void`

### `revive()`

```ts
revive(): void
```

**Returns:** `void`

### `setAll()`

```ts
setAll(variableName: string, value: unknown, recurse?: boolean): void
```

**Parameters:**

| Parameter      | Type      | Description |
| :------------- | :-------- | :---------- |
| `variableName` | `string`  | -           |
| `value`        | `unknown` | -           |
| `recurse`      | `boolean` | -           |

**Returns:** `void`

### `setMemberLocalPosition()`

```ts
setMemberLocalPosition(member: T, x: number, y: number): T
```

Moves an owned member using translation-local coordinates.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `member`  | `T`      | -           |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

**Returns:** `T`

### `sort()`

```ts
sort(index?: string, order?: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `index`   | `string` | -           |
| `order`   | `number` | -           |

**Returns:** `void`

### `transformChildren()`

```ts
transformChildren<V>(transform: FlxSpriteTransform<T, V>, value: V): void
```

Applies one property transform to every direct member in stable order.

**Parameters:**

| Parameter   | Type                       | Description |
| :---------- | :------------------------- | :---------- |
| `transform` | `FlxSpriteTransform<T, V>` | -           |
| `value`     | `V`                        | -           |

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`
