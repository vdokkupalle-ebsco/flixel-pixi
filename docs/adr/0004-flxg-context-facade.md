# ADR-0004: Keep `FlxG` as a facade over an engine context

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Foundation architecture review)

## Context

Legacy games expect static `FlxG` access. Direct global state makes tests,
cleanup, platform replacement, and multiple engine instances difficult.

## Decision

Preserve the public `FlxG` facade while storing runtime state and services in an
explicit `FlxContext`. The active game installs and removes its context at
well-defined lifecycle boundaries. Version 1 supports one active context per
JavaScript realm.

## Consequences

Legacy-style code remains recognizable and services can be replaced in tests.
Simultaneous games require separate realms or a future explicit-context API.
