# ADR-0014: Step-polled gamepads and stable logical identity

- Status: Accepted
- Date: 2026-08-09

## Context

The Web Gamepad API exposes mutable snapshots through `navigator.getGamepads()`.
Browser indices can disappear or change after reconnects, devices can report
noisy analog values, and polling at render cadence would make authoritative
input depend on display refresh. Gamepad input must also remain reproducible in
headless tests and replays.

## Decision

1. `FlxGamepadManager` polls an injectable provider exactly once per fixed
   simulation step. Gameplay reads only the resulting immutable step state.
2. Each discovered device receives an engine-owned numeric `uid`. The same
   device ID reuses that UID after reconnect, including an unambiguous browser
   index change. A different device replacing the same browser slot receives a
   new UID; disconnected objects remain queryable so release transitions and
   ownership references stay stable.
3. Buttons use the existing `2 -> 1` pressed and `-1 -> 0` released transition
   model. Standard Web Gamepad button indices are named by
   `FlxGamepadButton`; raw indices remain available for non-standard mappings.
4. Raw axes are clamped and exposed through a scaled dead zone. Values inside
   the dead zone are zero and the remaining range is rescaled to `[-1, 1]`.
5. The provider boundary accepts browser-neutral structural snapshots. The
   default provider wraps `navigator.getGamepads()`, while tests and headless
   hosts inject deterministic snapshots.
6. Replay format 1.1 records connected device identity, authoritative button
   transition states and values, and axes on every simulation frame. Playback
   replaces live polled gamepad state before gameplay updates.

## Consequences

- Rendering cadence, browser events, and Pixi do not participate in gamepad
  simulation.
- Two disconnected identical controllers cannot be matched reliably after both
  reconnect at new indices. The manager only reuses a same-ID candidate when
  the match is unambiguous; otherwise it allocates a new UID.
- Vendor-specific remapping is deferred. The initial API guarantees the W3C
  `standard` layout and explicit raw indices, which is sufficient for the next
  action-binding checkpoint.
