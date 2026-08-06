# Phase 12 evidence: samples, API closure, and guides

- Checkpoint: C12 release-candidate feature gate
- Status: Passed
- Date: 2026-08-06
- Upstream oracle: Flixel commit `8989e5044be072c4abbbaa1317c9854786f6447f`
- PixiJS baseline: 8.19

Phase 12 delivers three hybrid public-API sample games, closes the compatibility inventory with no unknown rows, publishes TypeScript guides (no AS3 migration recipes), and completes an external Mode-inspired port with a written gap report.

## Deliverables

### Sample kit & games

- [`examples/games/_kit/`](../examples/games/_kit/) — shared `bootGame` / renderer sync / shell CSS
- [`examples/games/hello/`](../examples/games/hello/) — title → play, movement, state switch
- [`examples/games/platformer/`](../examples/games/platformer/) — tilemap collide, gravity/jump, platformer camera follow, collectible
- [`examples/games/action/`](../examples/games/action/) — particles, audio, save, dual cameras, VCR hooks
- [`examples/games/external/`](../examples/games/external/) — Mode Lite external port
- Public-import guard: `npm run check:games-imports`

### Guides

- [`docs/guides/lifecycle.md`](guides/lifecycle.md)
- [`docs/guides/performance.md`](guides/performance.md)
- [`docs/guides/browser.md`](guides/browser.md)
- [`docs/guides/debugging.md`](guides/debugging.md)
- [`docs/guides/extensions.md`](guides/extensions.md)

### Ledger & external

- [`docs/compatibility.md`](compatibility.md) — inventory has no Phase-0 / unknown rows
- [`docs/phase12-external-gap.md`](phase12-external-gap.md) — selection checklist + classified gaps

## Verification results

- **Public-import guard**: passed for `examples/games/**`
- **TypeScript**: `npx tsc -p tsconfig.json --noEmit` clean
- **ESLint**: `npm run lint` clean
- **Playwright** (`tests/browser/phase12.spec.ts`): **12/12 passed** (4 scenarios × Chromium, Firefox, WebKit)
- **Clean-room checklist**: Hello sample + lifecycle/debugging guides usable without reading `src/**` internals

## Checkpoint verdict

C12 passes. All three samples are playable using only documented public APIs; the external port has a complete gap report; the compatibility ledger has no unknown entries; games do not import private engine modules; documentation supports clean-room review.
