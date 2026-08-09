# Phase 12 Mode Lite compatibility exercise — gap report

> Audit correction (2026-08-09): this example was authored for this repository
> from mechanics inspired by Mode. It is not a source-level port of an external
> open-source game and therefore does not, by itself, close checkpoint C12.

## Selection

| Criterion                  | Result                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Target                     | **Mode Lite** — original exercise using combat/menu mechanics inspired by Adam Saltsman’s **Mode**                  |
| License                    | Upstream Flixel / Mode lineage is **MIT**; **no original Mode art or audio copied** — procedural `makeGraphic` only |
| Size                       | Intentionally small (~200 LOC game code)                                                                            |
| Extra APIs beyond Sample 3 | `FlxButton` menu, enemy spawn loop, bullet pool, overlap combat, multi-state flow                                   |

Location: [`examples/games/external/`](../examples/games/external/).

## Gaps encountered

| Gap                                                      | Classification           | Resolution                                                                                    |
| -------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| Flash embedded graphics / Mode spritesheets              | Unsupported (asset path) | Regenerated with `makeGraphic`; documented in sample header                                   |
| `FlxButton` as Flash Sprite chrome                       | Adapted                  | Uses DOM/Pixi button render handle; works via public API                                      |
| Dynamically `add()`ed enemies invisible after play start | Adapted (kit)            | `_kit/boot-game` now re-syncs renderables when member count changes, not only on state switch |
| `FlxWindow` debugger chrome from AS3                     | Unsupported              | N/A to this sample; debugger is DOM (Phase 11)                                                |
| Private engine imports for button wiring                 | None                     | Sample imports only package barrel + `_kit`                                                   |

## Outstanding checkpoint evidence

The compatibility exercise itself has no open blockers. C12 still requires a
separately licensed external Flixel game, a source-to-source port attempt, and a
gap report tied to concrete upstream files and revisions.

## Clean-room note

A developer can open `/external/`, click START (or use the test hook), move with arrows, and shoot with Z without reading engine internals.
