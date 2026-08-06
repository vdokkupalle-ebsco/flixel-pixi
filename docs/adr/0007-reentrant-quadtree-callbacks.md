# ADR-0007: Make quadtree callbacks reentrant and pair-unique

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 3 collision oracle)

## Context

The AS3 quadtree stores its current objects, lists, and callbacks in static
scratch fields. A callback that starts another overlap query can overwrite the
outer query's state. Objects spanning leaf boundaries may also expose the same
pair more than once during one execution.

## Decision

Preserve Flixel's world subdivision, inherited A/B lists, strict intersections,
and swept hulls. Store callback/process state per quadtree run and maintain a
run-local weak pair set so each object pair is processed at most once. Keep
`FlxList` internal and expose the quadtree and typed callbacks publicly.

## Consequences

Overlap callbacks may safely perform nested overlap queries, and game code sees
one notification per pair. A boundary-spanning scene can therefore produce
fewer callback invocations than the AS3 implementation while preserving the
accepted collision result. Pair tracking adds short-lived weak collections to
each broad-phase execution; the principal X/Y separation functions remain
allocation-free.
