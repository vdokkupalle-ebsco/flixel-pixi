# Gamepads

`FlxG.gamepads` publishes Web Gamepad state at deterministic simulation-step
boundaries. The browser is polled once per update, independently of render FPS.

```ts
import { FlxG, FlxGamepadButton } from 'flixel-pixi';

const pad = FlxG.gamepads.firstActive;
if (pad?.justPressed(FlxGamepadButton.A)) jump();

const horizontal = pad?.getAxis(0) ?? 0;
player.acceleration.x = horizontal * 600;
```

`getAxis()` applies the controller's `deadZone` (default `0.15`) and rescales
the remaining range. Pass an explicit dead zone for one query or set
`pad.deadZone` for that logical device. `getButtonValue()` exposes analog
trigger pressure, while `pressed()`, `justPressed()`, and `justReleased()` use
fixed-step digital transitions.

Every device has two identifiers:

- `index` is its current browser slot and may change after reconnect;
- `uid` is the engine-owned logical ID used for stable player assignment.

Use `getByID(uid)` for player ownership and `getByIndex(index)` only when
interoperating with browser diagnostics. A same-ID device keeps its UID across
an unambiguous reconnect. Different hardware replacing a browser slot receives
a new UID.

## Headless and custom providers

Pass `gamepadProvider` through `FlxInputManagerOptions` (including the
`inputOptions` argument accepted by `FlxGame`) to provide structural snapshots.
This is useful for native shells, automated tests, and deterministic harnesses.
The provider is called once per simulation step.

Gamepad snapshots are included in replay format 1.1. Older keyboard/mouse-only
replays still load and simply publish no connected gamepads.

The public [`action`](../../examples/games/action/) sample supports the left
stick for movement and the standard A button for its burst action.
