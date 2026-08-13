# External compatibility validation

Checkpoint 15 validates `flixel-pixi` against a real, separately maintained
Flixel game. The existing Mode Lite demo remains useful regression coverage,
but it was authored inside this repository and is not source-port evidence.

## Acceptance criteria

1. Record the upstream repository, immutable commit, license, and exact source
   files being ported.
2. Preserve the selected game's mechanics closely enough to compare behavior;
   visual assets may be replaced only when redistribution is not permitted.
3. Build the port using package-root exports and documented browser boot APIs.
   The game must not import `src/**` internals or rely on the examples kit for
   missing engine behavior.
4. Record every encountered API difference as Exact, Adapted, Emulated,
   Deprecated, or Unsupported, including the chosen resolution.
5. Cover boot, primary input, core gameplay, state transitions, and teardown in
   Chromium, Firefox, and WebKit.
6. Confirm that no encountered gap is left unclassified and obtain a clean-room
   review from someone who can run the port using only its README and public
   guides.

## Target selection gate

The target must have an OSI-approved license, an immutable public source
revision, a small enough gameplay slice to review source-to-source, and no
required proprietary service. Prefer a game that exercises state transitions,
tile or object collision, animation, pooled entities, input, audio, and HUD
text without depending on Flash display-list internals.

Target selection is deliberately separate from implementation. A repository
that merely contains Flixel examples, or a new game inspired by an external
title, does not satisfy this gate.

## Evidence already available

- `examples/games/external/` proves the current public API can support a
  Mode-like menu/combat loop.
- Its browser test covers boot, state entry, pooled enemy registration, and
  teardown.
- The historical Mode Lite gap report explicitly records that a separately
  licensed source port is still required.

## Next checkpoint

Select and pin the upstream target, then create a source-file inventory and
initial gap table before writing the port. This prevents implementation choices
from silently redefining what is being validated.
