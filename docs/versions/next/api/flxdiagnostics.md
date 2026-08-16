---
title: FlxDiagnostics (Class)
description: API reference documentation for FlxDiagnostics in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDiagnostics

Bounded, renderer-neutral runtime diagnostics collector.

```ts
export declare class FlxDiagnostics
```

## Constructors

```ts
constructor(options?: FlxDiagnosticsOptions)
```

Constructs a new instance of the `FlxDiagnostics` class

| Parameter | Type                    | Description |
| :-------- | :---------------------- | :---------- |
| `options` | `FlxDiagnosticsOptions` | -           |

## Properties

| Property      | Modifiers  | Type                             | Description |
| :------------ | :--------- | :------------------------------- | :---------- |
| **`samples`** | `readonly` | `readonly FlxDiagnosticSample[]` | -           |

## Methods

### `capture()`

```ts
capture(now?: Date): FlxDiagnosticSnapshot
```

**Parameters:**

| Parameter | Type   | Description |
| :-------- | :----- | :---------- |
| `now`     | `Date` | -           |

**Returns:** `FlxDiagnosticSnapshot`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `record()`

```ts
record(frame: number, updateMs: number, fps: number, timestamp: number): void
```

**Parameters:**

| Parameter   | Type     | Description |
| :---------- | :------- | :---------- |
| `frame`     | `number` | -           |
| `updateMs`  | `number` | -           |
| `fps`       | `number` | -           |
| `timestamp` | `number` | -           |

**Returns:** `void`
