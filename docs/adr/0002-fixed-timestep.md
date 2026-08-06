# ADR-0002: Use a fixed-timestep simulation

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 0 architecture review)

## Context

Browser display cadence varies with hardware, visibility, and load. Original
Flixel separates game update frequency from Flash rendering frequency. Physics
and replay must not change when a display runs at 30, 60, or 120 Hz.

## Decision

Use `requestAnimationFrame` or a private Pixi ticker only as a clock. Feed
elapsed time into a capped accumulator and execute zero or more fixed simulation
steps, then render once. Input is snapshotted at simulation-step boundaries.

## Consequences

Replay and collision can be deterministic. Slow frames may require multiple
updates, so catch-up work is capped to prevent a spiral of death. Interpolation
is a rendering concern and never feeds back into authoritative coordinates.
