---
title: FixedStepAccumulator (Class)
description: API reference documentation for FixedStepAccumulator in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FixedStepAccumulator

Converts variable display-frame durations into deterministic simulation updates. Rendering may consume `alpha`, but simulation must not.

```ts
export declare class FixedStepAccumulator
```

## Constructors

```ts
constructor(options?: FixedStepAccumulatorOptions)
```

Constructs a new instance of the `FixedStepAccumulator` class

| Parameter | Type                          | Description |
| :-------- | :---------------------------- | :---------- |
| `options` | `FixedStepAccumulatorOptions` | -           |

## Properties

| Property              | Modifiers  | Type      | Description                                                   |
| :-------------------- | :--------- | :-------- | :------------------------------------------------------------ |
| **`alpha`**           | `readonly` | `number`  | Current interpolation fraction in the half-open range [0, 1). |
| **`maxCatchUpSteps`** | `readonly` | `number`  | Maximum authoritative updates allowed for one display frame.  |
| **`paused`**          | `readonly` | `boolean` | Whether display time is currently ignored.                    |
| **`stepSeconds`**     | `readonly` | `number`  | Authoritative simulation-step duration, in seconds.           |

## Methods

### `advance()`

```ts
advance(elapsedSeconds: number, update: (stepSeconds: number) => void): FixedStepAdvanceResult
```

Advances the clock and invokes `update` once per authoritative step. Excess elapsed time is discarded to prevent a spiral of death.

**Parameters:**

| Parameter        | Type                            | Description |
| :--------------- | :------------------------------ | :---------- |
| `elapsedSeconds` | `number`                        | -           |
| `update`         | `(stepSeconds: number) => void` | -           |

**Returns:** `FixedStepAdvanceResult`

### `reset()`

```ts
reset(): void
```

Clears interpolation and elapsed-time debt without changing pause state.

**Returns:** `void`

### `setPaused()`

```ts
setPaused(paused: boolean): void
```

Pauses or resumes the clock. Changing state clears accumulated time so a hidden tab cannot trigger a catch-up burst when it becomes visible.

**Parameters:**

| Parameter | Type      | Description |
| :-------- | :-------- | :---------- |
| `paused`  | `boolean` | -           |

**Returns:** `void`
