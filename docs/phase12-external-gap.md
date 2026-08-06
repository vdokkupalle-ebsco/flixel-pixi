# Phase 12 external port — gap report

## Selection

| Criterion                  | Result                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Target                     | **Mode Lite** — educational port of combat/menu mechanics inspired by Adam Saltsman’s **Mode** (classic Flixel demo) |
| License                    | Upstream Flixel / Mode lineage is **MIT**; **no original Mode art or audio copied** — procedural `makeGraphic` only  |
| Size                       | Intentionally small (~200 LOC game code)                                                                             |
| Extra APIs beyond Sample 3 | `FlxButton` menu, enemy spawn loop, bullet pool, overlap combat, multi-state flow                                    |

Location: [`examples/games/external/`](../examples/games/external/).

## Gaps encountered

| Gap                                         | Classification           | Resolution                                                          |
| ------------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Flash embedded graphics / Mode spritesheets | Unsupported (asset path) | Regenerated with `makeGraphic`; documented in sample header         |
| `FlxButton` as Flash Sprite chrome          | Adapted                  | Uses DOM/Pixi button render handle; works via public API            |
| Full Mode enemy AI / levels / particles     | Deferred / out of scope  | Explicitly not ported — Mode Lite covers spawn + shoot + score only |
| `FlxWindow` debugger chrome from AS3        | Unsupported              | N/A to this sample; debugger is DOM (Phase 11)                      |
| Private engine imports for button wiring    | None                     | Sample imports only package barrel + `_kit`                         |

## Blockers

None open. Every discovered assumption is fixed or classified above.

## Clean-room note

A developer can open `/external/`, click START (or use the test hook), move with arrows, and shoot with Z without reading engine internals.
