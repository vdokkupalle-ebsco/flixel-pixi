---
title: FlxGame (Class)
description: API reference documentation for FlxGame in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGame

Headless game controller and atomic state boundary.

```ts
export declare class FlxGame implements FlxStateRuntime
```

## Constructors

```ts
constructor(gameSizeX: number, gameSizeY: number, initialState: FlxStateConstructor, zoom?: number, gameFramerate?: number, flashFramerate?: number, useSystemCursor?: boolean, inputOptions?: FlxInputManagerOptions, audioBackend?: FlxAudioBackend)
```

Constructs a new instance of the `FlxGame` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `gameSizeX` | `number` | - |
| `gameSizeY` | `number` | - |
| `initialState` | `FlxStateConstructor` | - |
| `zoom` | `number` | - |
| `gameFramerate` | `number` | - |
| `flashFramerate` | `number` | - |
| `useSystemCursor` | `boolean` | - |
| `inputOptions` | `FlxInputManagerOptions` | - |
| `audioBackend` | `FlxAudioBackend` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`audio`** | `readonly` | `FlxAudioManager` | - |
| **`context`** | `readonly` | `FlxContext` | - |
| **`debugChannel`** | `readonly` | `DebugChannel` | Typed event bus for debug consumers. Zero cost when no listeners. |
| **`flashFramerate`** | `readonly` | `number` | - |
| **`forceDebugger`** | - | `boolean` | - |
| **`input`** | `readonly` | `FlxInputManager` | - |
| **`interpolationAlpha`** | `readonly` | `number` | - |
| **`log`** | `readonly` | `FlxLog` | Shared log service. Access via FlxG.log. |
| **`state`** | `readonly` | `FlxState \| null` | - |
| **`updateFramerate`** | `readonly` | `number` | - |
| **`useSoundHotKeys`** | - | `boolean` | - |
| **`useSystemCursor`** | `readonly` | `boolean` | - |
| **`watch`** | `readonly` | `FlxWatch` | Shared watch service. Access via FlxG.watch. |
| **`zoom`** | `readonly` | `number` | - |

## Methods

### `advance()`

```ts
advance(elapsedSeconds: number): FixedStepAdvanceResult
```

Feeds browser-clock time through the deterministic fixed-step loop.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `elapsedSeconds` | `number` | - |

**Returns:** `FixedStepAdvanceResult`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `requestState()`

```ts
requestState(state: FlxState): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `state` | `FlxState` | - |

**Returns:** `void`

### `resetState()`

```ts
resetState(): void
```

**Returns:** `void`

### `step()`

```ts
step(stepSeconds?: number): void
```

Executes one authoritative simulation step.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `stepSeconds` | `number` | - |

**Returns:** `void`

