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

## Selected target

- Repository: [`AdamAtomic/Flx-Invaders`](https://github.com/AdamAtomic/Flx-Invaders)
- Revision: `a941a9dfad7663a20e9f7f4bf2a90603d7effe89` (2011-04-27)
- License: MIT; the upstream notice is retained beside the port.
- Port: `examples/games/flx-invaders/`
- Reviewer instructions: `examples/games/flx-invaders/README.md`

The complete gameplay source inventory is four files: `FlxInvaders.as`,
`PlayState.as`, `PlayerShip.as`, and `Alien.as`. The two upstream PNG sprites
are redistributed unchanged under the recorded MIT license.

## Final compatibility table

| Upstream behavior                     | Classification         | Port decision                                                                                                                            |
| ------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `FlxGame(320, 240, PlayState, 2)`     | Adapted                | `createBrowserGame` owns Pixi/browser boot with the same logical size and zoom.                                                          |
| Flash `[Embed]` PNG assets            | Adapted                | Browser asset bundle preloads the unchanged MIT PNGs as `FlxGraphic` values.                                                             |
| Default Flash preloader               | Deprecated             | The configurable browser preloader replaces the Flash frame factory.                                                                     |
| `FlxGroup` pools and `recycle()`      | Exact                  | Player and alien bullet pools retain the upstream capacities and reset behavior.                                                         |
| Nested meta-groups for overlap        | Adapted                | Equivalent explicit group-pair overlap calls avoid double lifecycle ownership.                                                           |
| Keyboard properties and `justPressed` | Exact                  | Left/right movement and Space firing use the compatibility keyboard facade.                                                              |
| Sprite-sheet animation and tint       | Exact                  | The three-frame alien PNG uses the upstream sequence, randomized rate, and row tint.                                                     |
| `FlxG.scores` and `resetState()`      | Exact after correction | The port exposed an incorrect `number[]` narrowing; the cross-state array now accepts game-defined values and preserves win/loss status. |
| Mouse show/hide focus hint            | Adapted                | Browser focus and cursor policy are handled by the host rather than Flash APIs.                                                          |

No encountered behavior is unclassified. Automated Chromium, Firefox, and
WebKit coverage exercises boot, movement, pooled firing, a real bullet/alien
overlap, both terminal-state resets, integer pixel-art presentation, and
teardown.

## Clean-room review

An independent reviewer used only this port's README, public guides, visible
control labels, and rendered output. The first bounded review passed boot,
movement and bounds, firing, animation, descent, enemy fire, shield damage,
alien collisions, loss/reset, and teardown, but could not reach a normal-play
win quickly enough. That finding produced an opt-in `?review=1` mode with
documented **Validate Win** and **Validate Loss** controls; normal gameplay does
not expose them.

The final re-review passed in Playwright Chromium `151.0.7922.34`:

- normal mode booted with one 640×480 canvas, hid both review controls, and
  removed the canvas on destroy;
- review mode reproduced `YOU WON` and `YOU LOST`, rebuilding the complete
  5×10 formation after each outcome;
- there were no page errors, failed requests, application-console errors, or
  terminal warnings.

The automated suite supplies the required Firefox and WebKit coverage; the
clean-room interaction itself used Chromium. Checkpoint 15 is complete.

## Next checkpoint

Proceed to release hardening and the 1.0 candidate. The global coverage gate is
restored at 88.02% branches with 429 passing unit tests and its configured 88%
minimum unchanged. The concurrent Chromium swipe flake is also eliminated: its
contract now records cumulative trail, slice-piece, and particle milestones,
and passes 10 repeated isolated runs plus the complete 57-test Chromium suite
with six concurrent workers. The 30-cycle boot/destroy probe now covers
generated texture sources, Web Audio contexts and handles, event listeners,
camera render targets and bytes, registered render handles, and DOM canvases;
all owned resources return to zero and the process-wide listener baseline is
flat.

On August 13, 2026, `npm run test:soak:30m` passed in Playwright 1.62.1 using
Chromium `151.0.7922.34` on macOS arm64. The uninterrupted 30.2-minute run
completed 2,359 full boot/render/audio/destroy cycles. Registered handles were
exactly 2 in every active sample, the retained process-wide listener baseline
was exactly 13 after every teardown, and every tracked engine-owned resource
returned to zero.

WebGPU initialization fallback is also complete. Deterministic Chromium,
Firefox, and WebKit coverage makes capability detection succeed, forces the
selected WebGPU renderer to fail during initialization, and verifies fresh
WebGL recovery before game creation plus the same state transition, movement,
and teardown contract. The complete Chromium suite passes all 58 tests with six
workers. The next open gate is freezing named performance, memory, and bundle
budgets on representative hardware. That gate is now complete: the documented
Apple M4 Pro reference profile passes nine static bundle/CPU limits, median
sprite-stress floors of 48/28/14 FPS at 2k/5k/10k active sprites, and the named
renderer/audio/listener/teardown resource ceilings. The next open gate is the
supported-browser/device matrix for resize, fullscreen, focus, visibility,
accessibility, and memory pressure.
