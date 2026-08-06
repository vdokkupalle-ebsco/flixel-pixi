# Phase 2 evidence: headless lifecycle core

- Checkpoint: C2 headless core
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`

Phase 2 establishes the simulation-side contracts that later rendering,
collision, input, and replay systems will use. The implementation has no DOM,
Canvas, or PixiJS runtime dependency.

## Delivered surface

The public package now exports `FlxPoint`, `FlxRect`, `FlxRandom`, `FlxU`,
`FlxBasic`, `FlxGroup`, `FlxState`, `FlxContext`, the Phase 2 `FlxG` facade, and
the headless `FlxGame` controller. `FlxGame` uses the Phase 1 fixed-step
accumulator, while mutable global-looking state is owned by one explicit
`FlxContext`.

## Lifecycle and group contracts

Contract tests establish the following order and mutation policy:

1. An eligible member receives `preUpdate`, `update`, then `postUpdate`.
2. Each traversal reads a stable snapshot. A member added during an update is
   first eligible on the next traversal.
3. A member removed before its turn is skipped.
4. Inactive/nonexistent members are not updated, and invisible/nonexistent
   members are not drawn.

Tests cover add, duplicate add, remove with and without splicing, replace,
sorting in both directions, recursive `setAll` and `callAll`, lifecycle queries,
counts, kill/revive, clear, capacity shrink, and idempotent destruction.

The bounded-pool contract recycles an eight-object group for 10,000 iterations.
The group remains exactly eight slots and exposes only the same eight object
identities; no storage growth occurs.

## Atomic state boundary

State changes are requests, not immediate mutations. `FlxGame.step` commits a
pending state before authoritative update work. The old state is destroyed once,
the new state is created once, and only then may it update.

A committed failure vector makes the incoming state's `create` hook throw. The
old state is already destroyed, the failed state is destroyed for cleanup, the
game exposes no current state, and the failed state's `update` hook is never
called. Resetting a state also creates a fresh instance at the next safe step.

## Deterministic random vector

The AS3 linear congruential step is preserved:

```text
((69621 * int(seed * 0x7fffffff)) % 0x7fffffff) / 0x7fffffff
```

Starting at seed `0.5`, the committed first eight outputs are:

```text
0.4999837900977506
0.3714503954963062
0.7479848483335156
0.4531258276911107
0.07324968281819005
0.7161674852092599
0.29648775388323134
0.7739131044474957
```

`FlxRandom`, `FlxU.srand`, and the context-backed `FlxG.random` share this
contract. Deterministic selection and shuffling consume the same context-owned
source.

## Verification results

The C2 unit suite contains 34 passing tests across seven files. Coverage at the
checkpoint is 95.38% statements, 90.95% branches, 97.38% functions, and 97.29%
lines. Static formatting, ESLint, strict TypeScript, declaration generation, and
the API report also pass.

The headless contract test verifies that `document` and `HTMLCanvasElement` are
absent while state/group lifecycle work executes. Browser rendering remains the
independent Phase 1 adapter and is not imported by the Phase 2 core.

## Checkpoint verdict

All C2 criteria pass: lifecycle mutation behavior is committed, bounded pools do
not grow, state changes are atomic and clean up failure safely, seeded output has
a golden vector, and the core runs without browser or PixiJS globals. Phase 3 may
build authoritative motion and collision on these contracts.
