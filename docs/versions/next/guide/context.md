# Context & Services

Flixel-Pixi uses `FlxContext` as a dependency-injected service registry. This decouples gameplay systems (audio, input, storage, cameras) from static globals, enabling clean multi-instance testing and modular plugins.

---

## Accessing Context Services

Inside any `FlxBasic`, `FlxObject`, `FlxState`, or `FlxSubState`, `this.context` provides access to core engine services:

```ts
// In your state or sprite:
const input = this.context.input;
const audio = this.context.audio;
const storage = this.context.storage;
const cameraHost = this.context.cameras;
const atlasRegistry = this.context.atlas;
```

---

## Core Service Tokens

Services are registered under well-defined symbols:

| Service Token             | Property          | Description                                                            |
| :------------------------ | :---------------- | :--------------------------------------------------------------------- |
| `FLX_INPUT_SERVICE`       | `context.input`   | Access to Keyboard, Mouse, Touch, Gamepad, Actions, and Virtual Input. |
| `FLX_AUDIO_SERVICE`       | `context.audio`   | WebAudio manager, sound effects, BGM, and sound groups.                |
| `FLX_STORAGE_SERVICE`     | `context.storage` | LocalStorage, IndexedDB, and FlxSave backend.                          |
| `FLX_CAMERA_HOST_SERVICE` | `context.cameras` | Primary and auxiliary camera hosts.                                    |
| `FLX_ATLAS_SERVICE`       | `context.atlas`   | Shared JSON spritesheet and atlas registry.                            |
| `FLX_LOG_SERVICE`         | `context.log`     | Structured debugging and developer log channel.                        |
| `FLX_WATCH_SERVICE`       | `context.watch`   | In-game real-time variable watch inspector.                            |

---

## Custom Service Registration

You can inject custom services (e.g. networking, achievements, localization) into `FlxContext`:

```ts
import { FlxContext } from 'flixel-pixi';

const MY_NETWORK_SERVICE = Symbol('MY_NETWORK_SERVICE');

interface NetworkService {
  sendScore(player: string, score: number): Promise<void>;
}

// Register service on context
context.registerService(MY_NETWORK_SERVICE, {
  async sendScore(player, score) {
    await fetch('/api/score', {
      method: 'POST',
      body: JSON.stringify({ player, score }),
    });
  },
});

// Retrieve service elsewhere
const net = context.getService<NetworkService>(MY_NETWORK_SERVICE);
net?.sendScore('Hero', 9990);
```
