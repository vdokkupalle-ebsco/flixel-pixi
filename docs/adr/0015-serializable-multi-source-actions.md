# ADR-0015: Serializable multi-source actions

- Status: Accepted
- Date: 2026-08-09

## Context

The original thin `FlxActions` helper mapped one action name to keyboard key
names. Gamepad support otherwise forced each state to repeat device selection,
dead-zone, pointer, and fallback logic. Runtime rebinding also needs a stable,
validated representation that applications can store without serializing live
browser or engine objects.

## Decision

1. Action sources are structural, JSON-safe values discriminated by `device`.
   Digital sources cover keyboard keys, mouse buttons, wheel directions, and
   gamepad buttons. Scalar analog sources cover keyboard pairs, gamepad axes,
   and gamepad button pairs such as a D-pad.
2. `bind(action, ...keys)` remains the keyboard-only compatibility shorthand.
   `bindSources()` replaces a mixed binding, while `addSource()` appends one.
3. `rebind()` is exclusive by default: the exact normalized source is removed
   from every other action before assignment. Applications may opt out for
   intentionally shared controls.
4. Gamepad sources target the first active pad by default, all connected pads,
   or one stable engine UID. Analog data from multiple sources resolves to the
   greatest absolute magnitude; an equal-magnitude tie keeps source order.
5. `save()` and `load()` use validated schema version 1. Loading is atomic, so
   malformed data never partially replaces working bindings. Applications may
   persist this object with `FlxSave` or another storage backend.
6. Actions query the already-published fixed-step keyboard, pointer, and
   gamepad state. They do not poll browser APIs or create a second input clock.

## Consequences

- Gameplay can use one action name across keyboard, pointer, and gamepad input,
  and settings screens can rebind without device-specific state code.
- Analog actions are scalar in this checkpoint. Two-dimensional movement uses
  two named actions, which keeps per-axis inversion and rebinding explicit.
- Replay continues to record authoritative raw input. A game must load the same
  saved binding profile before recording and playback; binding-profile changes
  made by external DOM settings are configuration, not replay events.
