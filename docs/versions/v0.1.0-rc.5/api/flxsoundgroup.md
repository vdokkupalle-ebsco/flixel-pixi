---
title: FlxSoundGroup (Class)
description: API reference documentation for FlxSoundGroup in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSoundGroup

A hierarchical volume and mute bus for [link](#) instances.

```ts
export declare class FlxSoundGroup
```

## Constructors

```ts
constructor(name: string, parent?: FlxSoundGroup | null)
```

Constructs a new instance of the `FlxSoundGroup` class

| Parameter | Type                    | Description |
| :-------- | :---------------------- | :---------- |
| `name`    | `string`                | -           |
| `parent`  | `FlxSoundGroup \| null` | -           |

## Properties

| Property           | Modifiers  | Type                    | Description                                    |
| :----------------- | :--------- | :---------------------- | :--------------------------------------------- |
| **`actualVolume`** | `readonly` | `number`                | Volume after applying every ancestor bus.      |
| **`mute`**         | -          | `boolean`               | -                                              |
| **`muted`**        | `readonly` | `boolean`               | Whether this bus or any ancestor bus is muted. |
| **`name`**         | `readonly` | `string`                | -                                              |
| **`parent`**       | `readonly` | `FlxSoundGroup \| null` | -                                              |
| **`soundCount`**   | `readonly` | `number`                | -                                              |
| **`volume`**       | -          | `number`                | -                                              |

## Methods

### `add()`

```ts
add(sound: FlxSound): FlxSound
```

Route a sound through this bus, removing it from its previous bus.

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `sound`   | `FlxSound` | -           |

**Returns:** `FlxSound`

### `createChild()`

```ts
createChild(name: string): FlxSoundGroup
```

Create a child bus whose effective settings include this bus.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `name`    | `string` | -           |

**Returns:** `FlxSoundGroup`

### `destroy()`

```ts
destroy(): void
```

Detach sounds and recursively destroy child buses.

**Returns:** `void`

### `remove()`

```ts
remove(sound: FlxSound): FlxSound
```

Stop routing a sound through this bus.

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `sound`   | `FlxSound` | -           |

**Returns:** `FlxSound`
