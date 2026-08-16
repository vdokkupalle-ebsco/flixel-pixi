---
title: FlxAudioControls (Class)
description: API reference documentation for FlxAudioControls in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAudioControls

Accessible, dependency-free DOM controls for master game audio.

```ts
export declare class FlxAudioControls
```

## Constructors

```ts
constructor(audio: FlxAudioService, options?: FlxAudioControlsOptions)
```

Constructs a new instance of the `FlxAudioControls` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `audio` | `FlxAudioService` | - |
| `options` | `FlxAudioControlsOptions` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

Remove controls, subscriptions, and browser event listeners.

**Returns:** `void`

