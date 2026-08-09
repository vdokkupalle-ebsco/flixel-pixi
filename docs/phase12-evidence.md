# Phase 12 evidence: samples, API closure, and guides

- Checkpoint: C12 release-candidate feature gate
- Status: Reopened — external source-port evidence outstanding
- Date: 2026-08-09 audit update
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 12 delivers three hybrid public-API sample games, closes the compatibility
inventory with no unknown rows, and publishes TypeScript guides. The earlier
Mode Lite deliverable is an original compatibility exercise inspired by Mode;
it does not satisfy the planned external open-source game source-port criterion.

## Deliverables

### Sample kit & games

- [`examples/games/_kit/`](../examples/games/_kit/) — shared `bootGame` / renderer sync / shell CSS
- [`examples/games/hello/`](../examples/games/hello/) — title → play, movement, state switch
- [`examples/games/platformer/`](../examples/games/platformer/) — tilemap collide, gravity/jump, platformer camera follow, collectible
- [`examples/games/action/`](../examples/games/action/) — particles, audio, save, dual cameras, VCR hooks
- [`examples/games/external/`](../examples/games/external/) — Mode Lite compatibility exercise
- Public-import guard: `npm run check:games-imports`

### Guides

- [`docs/guides/lifecycle.md`](guides/lifecycle.md)
- [`docs/guides/performance.md`](guides/performance.md)
- [`docs/guides/browser.md`](guides/browser.md)
- [`docs/guides/debugging.md`](guides/debugging.md)
- [`docs/guides/extensions.md`](guides/extensions.md)

### Ledger & external

- [`docs/compatibility.md`](compatibility.md) — all 43 classes and 766 public members are checked against the pinned manifest; every class/surface has a final classification
- [`docs/phase12-external-gap.md`](phase12-external-gap.md) — compatibility-exercise gaps and the outstanding external-port requirement

## Verification results

- **Public-import guard**: passed for `examples/games/**`
- **TypeScript**: `npx tsc -p tsconfig.json --noEmit` clean
- **ESLint**: `npm run lint` clean
- **Playwright** (`tests/browser/phase12.spec.ts`): **12/12 passed** (4 scenarios × Chromium, Firefox, WebKit)
- **Clean-room checklist**: Hello sample + lifecycle/debugging guides usable without reading `src/**` internals

## Checkpoint verdict

C12 is partially satisfied. The three samples use documented public APIs, the
ledger test verifies all 766 pinned member names and class/surface
classifications, games do not import private engine modules, and the guides are
usable without reading engine internals. C12 remains open until a licensed
external Flixel game is ported from its source and its blockers are classified.
Independent clean-room reviewer sign-off is also not yet recorded.
