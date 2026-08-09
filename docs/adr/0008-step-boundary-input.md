# ADR-0008: Queue browser input at simulation-step boundaries

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (input oracle)

## Context

DOM keyboard and pointer events arrive on the browser event loop, independently
of both `requestAnimationFrame` and the fixed simulation clock. Reading DOM
state directly in gameplay can lose a press/release pair during a slow display
frame, repeat a transition across catch-up updates, or make replay depend on
display cadence.

## Decision

DOM listeners append normalized keyboard, pointer-button, movement, and wheel
events to an input-service queue. `FlxGame.step()` publishes the queue before
the state update, including while gameplay is paused. Each logical control may
publish at most one transition per simulation step, so a press and release
received between display frames become two authoritative steps. Pointer IDs
retain their originating button through capture loss and cancellation.

Gameplay and `FlxButton` read only the published `Keyboard` and `Mouse` state.
They never subscribe directly to Pixi or DOM events. Record/playback uses the
same public state machines.

## Consequences

`justPressed` and `justReleased` last exactly one simulation step under low
display FPS and catch-up updates. Blur, hidden-document, context-menu, pointer
cancel, and lost-capture paths can publish releases without leaving controls
stuck. Same-frame taps add at most one step of input latency, which is the
intentional cost of retaining both edges deterministically.
