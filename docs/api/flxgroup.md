---
title: FlxGroup (Class)
description: API reference documentation for FlxGroup in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGroup

Mutation-safe collection that owns member lifecycle traversal.

```ts
export declare class FlxGroup<T extends FlxBasic = FlxBasic> extends FlxBasic
```

## Constructors

```ts
constructor(maxSize?: number)
```

Constructs a new instance of the `FlxGroup` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `maxSize` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`ASCENDING`** | `static` `readonly` | `` | - |
| **`DESCENDING`** | `static` `readonly` | `` | - |
| **`length`** | - | `number` | - |
| **`maxSize`** | - | `number` | - |
| **`members`** | - | `(T \| null)[]` | - |

## Methods

### `add()`

```ts
add(object: T): T
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `T` | - |

**Returns:** `T`

### `callAll()`

```ts
callAll(functionName: string, recurse?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `functionName` | `string` | - |
| `recurse` | `boolean` | - |

**Returns:** `void`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

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

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `objectClass` | `FlxBasicConstructor<T>` | - |

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

### `getRandom()`

```ts
getRandom(startIndex?: number, length?: number): T | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `startIndex` | `number` | - |
| `length` | `number` | - |

**Returns:** `T | null`

### `kill()`

```ts
kill(): void
```

**Returns:** `void`

### `preUpdate()`

```ts
preUpdate(): void
```

Groups do not count themselves as active gameplay objects.

**Returns:** `void`

### `recycle()`

```ts
recycle(objectClass?: FlxBasicConstructor<T>): T | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `objectClass` | `FlxBasicConstructor<T>` | - |

**Returns:** `T | null`

### `remove()`

```ts
remove(object: T, splice?: boolean): T | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `object` | `T` | - |
| `splice` | `boolean` | - |

**Returns:** `T | null`

### `replace()`

```ts
replace(oldObject: T, newObject: T): T | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `oldObject` | `T` | - |
| `newObject` | `T` | - |

**Returns:** `T | null`

### `setAll()`

```ts
setAll(variableName: string, value: unknown, recurse?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `variableName` | `string` | - |
| `value` | `unknown` | - |
| `recurse` | `boolean` | - |

**Returns:** `void`

### `sort()`

```ts
sort(index?: string, order?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `string` | - |
| `order` | `number` | - |

**Returns:** `void`

### `update()`

```ts
update(): void
```

Traverses a stable snapshot. Additions wait until the next traversal; members removed before their turn are skipped.

**Returns:** `void`

