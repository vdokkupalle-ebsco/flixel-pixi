# Context & Services

Flixel-Pixi uses `FlxContext` as a dependency-injected service registry. This decouples gameplay systems (audio, input, storage, cameras) from static globals, enabling clean multi-instance testing and modular plugins.

---

## Accessing Context Services

`FlxG` is the gameplay-facing facade for services owned by the active
`FlxContext`:

```ts
import { FlxG } from 'flixel-pixi';

const keyboard = FlxG.keys;
const mouse = FlxG.mouse;
const gamepads = FlxG.gamepads;
const touches = FlxG.touches;
const atlasRegistry = FlxG.atlas;
```

---

## Core Service Tokens

Services are registered under well-defined symbols:

| Service Token             | Gameplay facade                             | Description                                     |
| :------------------------ | :------------------------------------------ | :---------------------------------------------- |
| `FLX_INPUT_SERVICE`       | `FlxG.keys`, `mouse`, `gamepads`, `touches` | Deterministic browser and controller input.     |
| `FLX_AUDIO_SERVICE`       | `FlxG.play(...)`, `playMusic(...)`          | WebAudio sound effects, BGM, and sound groups.  |
| `FLX_STORAGE_SERVICE`     | `FlxG.save`, `saves`                        | Primary and registered save slots.              |
| `FLX_CAMERA_HOST_SERVICE` | `FlxG.camera` / `cameras`                   | Primary and auxiliary cameras.                  |
| `FLX_ATLAS_SERVICE`       | `FlxG.atlas`                                | Shared JSON spritesheet and atlas registry.     |
| `FLX_LOG_SERVICE`         | `FlxG.log`                                  | Structured debugging and developer log channel. |
| `FLX_WATCH_SERVICE`       | `FlxG.watch`                                | In-game real-time variable watch inspector.     |

For custom or adapter-level services, retrieve the token from
`FlxG.context.getService(...)`.

---

## Custom Service Registration

You can inject custom services (e.g. networking, achievements, localization) into `FlxContext`:

```ts
import { FlxG } from 'flixel-pixi';

const MY_NETWORK_SERVICE = Symbol('MY_NETWORK_SERVICE');

interface NetworkService {
  sendScore(player: string, score: number): Promise<void>;
}

// Register service on context
FlxG.context.setService(MY_NETWORK_SERVICE, {
  async sendScore(player, score) {
    await fetch('/api/score', {
      method: 'POST',
      body: JSON.stringify({ player, score }),
    });
  },
});

// Retrieve service elsewhere
const net = FlxG.context.getService<NetworkService>(MY_NETWORK_SERVICE);
net?.sendScore('Hero', 9990);
```
