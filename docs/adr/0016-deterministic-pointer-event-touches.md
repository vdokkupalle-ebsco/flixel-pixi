# ADR 0016: Deterministic Pointer Event touches

**Status:** Accepted

## Context

Games need concurrent touch state and swipe gestures without making results
depend on browser event cadence. Existing controls also expect a single mouse
pointer, while browsers synthesize mouse-like behavior from primary touches.

## Decision

- DOM Pointer Events are converted to logical canvas coordinates and queued.
- Every `pointerType: "touch"` pointer has independent `pointerId` state,
  published only at fixed simulation-step boundaries.
- A press and release received between steps are split across two steps.
- Only the primary touch mirrors the legacy `Mouse`; secondary touches never
  change mouse buttons or position.
- Swipes use logical-pixel distance and simulation-step duration thresholds.
- Replay format 1.2 records complete per-frame touch state.
- Cancellation, lost capture, blur, and visibility loss never produce swipes.

## Consequences

Touch gameplay remains headless-testable and deterministic across display
rates. Existing mouse-driven UI continues to work with one finger. More complex
gestures can build on the public touch snapshots.
