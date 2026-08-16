---
title: FlxU (Class)
description: API reference documentation for FlxU in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Collision & Math</span>
  <span class="api-badge public">@public</span>
</div>

# FlxU

Math, color, formatting, and motion helpers from the AS3 `FlxU` surface.

```ts
export declare class FlxU
```

## Methods

### `static` `abs()`

```ts
static abs(value: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `value`   | `number` | -           |

**Returns:** `number`

### `static` `bound()`

```ts
static bound(value: number, minimum: number, maximum: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `value`   | `number` | -           |
| `minimum` | `number` | -           |
| `maximum` | `number` | -           |

**Returns:** `number`

### `static` `ceil()`

```ts
static ceil(value: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `value`   | `number` | -           |

**Returns:** `number`

### `static` `compareClassNames()`

```ts
static compareClassNames(first: object, second: object): boolean
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `first`   | `object` | -           |
| `second`  | `object` | -           |

**Returns:** `boolean`

### `static` `computeVelocity()`

```ts
static computeVelocity(velocity: number, acceleration?: number, drag?: number, maximum?: number, elapsed?: number): number
```

**Parameters:**

| Parameter      | Type     | Description |
| :------------- | :------- | :---------- |
| `velocity`     | `number` | -           |
| `acceleration` | `number` | -           |
| `drag`         | `number` | -           |
| `maximum`      | `number` | -           |
| `elapsed`      | `number` | -           |

**Returns:** `number`

### `static` `floor()`

```ts
static floor(value: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `value`   | `number` | -           |

**Returns:** `number`

### `static` `formatArray()`

```ts
static formatArray(values: readonly unknown[] | null): string
```

**Parameters:**

| Parameter | Type                         | Description |
| :-------- | :--------------------------- | :---------- |
| `values`  | `readonly unknown[] \| null` | -           |

**Returns:** `string`

### `static` `formatMoney()`

```ts
static formatMoney(amount: number, showDecimal?: boolean, englishStyle?: boolean): string
```

**Parameters:**

| Parameter      | Type      | Description |
| :------------- | :-------- | :---------- |
| `amount`       | `number`  | -           |
| `showDecimal`  | `boolean` | -           |
| `englishStyle` | `boolean` | -           |

**Returns:** `string`

### `static` `formatTicks()`

```ts
static formatTicks(startTicks: number, endTicks: number): string
```

**Parameters:**

| Parameter    | Type     | Description |
| :----------- | :------- | :---------- |
| `startTicks` | `number` | -           |
| `endTicks`   | `number` | -           |

**Returns:** `string`

### `static` `formatTime()`

```ts
static formatTime(seconds: number, showMilliseconds?: boolean): string
```

**Parameters:**

| Parameter          | Type      | Description |
| :----------------- | :-------- | :---------- |
| `seconds`          | `number`  | -           |
| `showMilliseconds` | `boolean` | -           |

**Returns:** `string`

### `static` `getAngle()`

```ts
static getAngle(first: PointLike, second: PointLike): number
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `first`   | `PointLike` | -           |
| `second`  | `PointLike` | -           |

**Returns:** `number`

### `static` `getClassName()`

```ts
static getClassName(value: object, simple?: boolean): string
```

**Parameters:**

| Parameter | Type      | Description |
| :-------- | :-------- | :---------- |
| `value`   | `object`  | -           |
| `simple`  | `boolean` | -           |

**Returns:** `string`

### `static` `getDistance()`

```ts
static getDistance(first: PointLike, second: PointLike): number
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `first`   | `PointLike` | -           |
| `second`  | `PointLike` | -           |

**Returns:** `number`

### `static` `getHSB()`

```ts
static getHSB(color: number, results?: number[]): number[]
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `color`   | `number`   | -           |
| `results` | `number[]` | -           |

**Returns:** `number[]`

### `static` `getRandom()`

```ts
static getRandom<T>(objects: readonly T[] | null, startIndex?: number, length?: number, random?: () => number): T | null
```

**Parameters:**

| Parameter    | Type                   | Description |
| :----------- | :--------------------- | :---------- |
| `objects`    | `readonly T[] \| null` | -           |
| `startIndex` | `number`               | -           |
| `length`     | `number`               | -           |
| `random`     | `() => number`         | -           |

**Returns:** `T | null`

### `static` `getRGBA()`

```ts
static getRGBA(color: number, results?: number[]): number[]
```

Splits an AS3-style `0xAARRGGBB` color into RGBA components.

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `color`   | `number`   | -           |
| `results` | `number[]` | -           |

**Returns:** `number[]`

### `static` `getTicks()`

```ts
static getTicks(): number
```

**Returns:** `number`

### `static` `makeColor()`

```ts
static makeColor(red: number, green: number, blue: number, alpha?: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `red`     | `number` | -           |
| `green`   | `number` | -           |
| `blue`    | `number` | -           |
| `alpha`   | `number` | -           |

**Returns:** `number`

### `static` `makeColorFromHSB()`

```ts
static makeColorFromHSB(hue: number, saturation: number, brightness: number, alpha?: number): number
```

**Parameters:**

| Parameter    | Type     | Description |
| :----------- | :------- | :---------- |
| `hue`        | `number` | -           |
| `saturation` | `number` | -           |
| `brightness` | `number` | -           |
| `alpha`      | `number` | -           |

**Returns:** `number`

### `static` `max()`

```ts
static max(first: number, second: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `first`   | `number` | -           |
| `second`  | `number` | -           |

**Returns:** `number`

### `static` `min()`

```ts
static min(first: number, second: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `first`   | `number` | -           |
| `second`  | `number` | -           |

**Returns:** `number`

### `static` `rotatePoint()`

```ts
static rotatePoint(x: number, y: number, pivotX: number, pivotY: number, angle: number, point?: FlxPoint): FlxPoint
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `x`       | `number`   | -           |
| `y`       | `number`   | -           |
| `pivotX`  | `number`   | -           |
| `pivotY`  | `number`   | -           |
| `angle`   | `number`   | -           |
| `point`   | `FlxPoint` | -           |

**Returns:** `FlxPoint`

### `static` `round()`

```ts
static round(value: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `value`   | `number` | -           |

**Returns:** `number`

### `static` `shuffle()`

```ts
static shuffle<T>(objects: T[], howManyTimes: number, random?: () => number): T[]
```

**Parameters:**

| Parameter      | Type           | Description |
| :------------- | :------------- | :---------- |
| `objects`      | `T[]`          | -           |
| `howManyTimes` | `number`       | -           |
| `random`       | `() => number` | -           |

**Returns:** `T[]`

### `static` `srand()`

```ts
static srand(seed: number): number
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `seed`    | `number` | -           |

**Returns:** `number`
