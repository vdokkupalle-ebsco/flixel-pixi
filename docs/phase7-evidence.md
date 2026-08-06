# Phase 7 evidence: keyboard, pointer, and buttons

- Checkpoint: C7 input gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 7 ports `Input`, `Keyboard`, `Mouse`, and `FlxButton`. DOM events enter a
context-owned `FlxInputManager`; gameplay sees only state published at fixed
simulation-step boundaries. This keeps input deterministic without making the
headless engine depend on a DOM or Pixi event object.

## Step-boundary state

Digital states retain the pinned numeric transitions: `2` is just pressed, `1`
is held, `-1` is just released, and `0` is idle. A transition normalizes on the
next authoritative step. Only one queued edge per logical key or pointer button
may publish in a step, so a complete tap received during one slow display frame
becomes a press step followed by a release step instead of disappearing.

`FlxGame.step()` updates input before the state, including while paused. Distinct
controls can still transition together. Reset clears queued and published
state; blur and cancellation discard unpublished input and queue releases only
for controls that gameplay has already observed.

`record()` and `playback()` expose the same state representation used by
`pressed`, `justPressed`, and `justReleased`. This is the Phase 7 input snapshot
contract; the versioned multi-frame replay container remains scheduled for
Phase 10.

## Keyboard mappings

Named properties preserve the pinned A–Z, number row, numpad, F1–F12,
navigation, modifier, and punctuation surface. Browser capture prefers physical
`KeyboardEvent.code` values, then falls back to legacy `keyCode` and normalized
`key` names. This makes movement bindings layout-stable while retaining test and
migration compatibility.

Two source-friendly aliases are explicit: `CTRL` maps to `CONTROL`, and
`RETURN` maps to `ENTER`. The AS3 source accidentally assigns `NUMPADSLASH` the
same legacy value as `/`; this port uses modern `NumpadDivide` and legacy code
`111`, while `/` remains `191`.

## Pointer, camera, and cancellation behavior

Canvas client coordinates are normalized through the element's current CSS
bounds into logical game coordinates. `Mouse.getWorldPosition()` delegates to
`FlxCamera.screenToWorld()`, covering viewport translation, scroll, zoom,
independent scale, center rotation, and shake. `getScreenPosition()` returns the
camera-local, pre-transform position familiar to Flixel code.

Pointer IDs remember the button that began capture because touch cancellation
commonly reports `button === -1`. Pointer up, pointer cancel, lost capture,
window blur, document hiding, and context menus all converge on deterministic
release/cancel state. Wheel input is accumulated for one step. Cursor show,
hide, URL loading, hotspots, and unload map to the canvas CSS cursor.

## `FlxButton`

The button preserves NORMAL, HIGHLIGHT, and PRESSED frames; label offset and
pressed-label movement; `onOver`, `onOut`, `onDown`, and `onUp`; and the four
public sound hooks. The `on` property retains the pinned checkbox convention:
when externally enabled, hover uses the normal frame. It does not silently
change application state—an `onUp` callback toggles it when that behavior is
wanted.

Hit testing reads authoritative `Mouse` state and adjusts the world point for
the button's scroll factor in every routed camera. A captured press activates
only after an uncancelled release over the same button. Rendering uses one
`FlxButtonRenderHandle` that composes the state sprite and Pixi text label; no
gameplay callback runs from a Pixi event handler.

## C7 browser scene

Open `/phase7.html` for the deterministic input lab. WASD or arrow keys move the
player on fixed steps, the gold probe shows camera-aware pointer position, and
the Pixi buttons demonstrate hover, capture, release, cancellation, callback,
and externally controlled toggle state. The scene runs continuously but exposes
pause, reset, and exact-step controls to the browser harness.

Committed visual baselines cover Chromium, Firefox, and WebKit. The interaction
matrix sends real browser keyboard and pointer events, releases a held key on
blur, verifies a same-display-frame click across two steps, and dispatches a
touch-style `pointercancel` with button `-1`.

## Verification and performance

The headless suite contains 108 passing tests across 16 files. Coverage is
96.30% statements, 90.17% branches, 97.22% functions, and 97.86% lines. The C7
browser file adds six engine/test combinations, bringing the complete browser
matrix to 36 combinations.

Representative means on the development machine were 4.061 ms for 10,000
queued keyboard press/release step pairs and 0.911 ms for 10,000 pointer updates
including primary-camera conversion. The production ESM bundle is 159,288 bytes
raw and 37,318 bytes gzip. These are regression baselines, not cross-device
latency budgets.

## Checkpoint verdict

C7 passes. Transitions occupy exactly one simulation step; same-frame edges are
retained in order; physical mappings and aliases are documented; pointer
coordinates reuse all C5 transforms; blur/cancel paths do not leave controls
stuck; and recorded snapshots replay through the same public APIs. Phase 8 may
add particles, timers, and plugins without introducing direct DOM reads into
gameplay objects.
