# flixel-pixi

`flixel-pixi` is a TypeScript port of Adam Saltsman's original ActionScript 3
Flixel engine, using PixiJS v8 as its browser rendering foundation.

The repository includes the Phase 12 samples, API ledger, and guides, and is in
the **Phase 13 stabilization pass**. Checkpoint C12 is reopened only for a true
external source-port exercise; the existing Mode Lite example is an original
compatibility sample, not evidence of a source port. Playable public-API games
live under `examples/games/`; phase smoke labs remain under `examples/smoke/`.
See [PORTING_PLAN.md](PORTING_PLAN.md).

## Prerequisites

- Node.js 22.12 or newer.
- npm 10 or newer.

## Verify a fresh clone

The complete verification flow is one shell command:

```bash
npm ci && npx playwright install chromium firefox webkit && npm run verify
```

On Linux CI, use `npx playwright install --with-deps chromium firefox webkit` so
browser system dependencies are installed too.

`npm run verify` checks formatting, linting, types, unit coverage, production
builds, the public API report, benchmark/bundle reports, and the Playwright
browser smoke test.

## Development

```bash
npm install
npm run dev
```

The smoke example starts on Vite's displayed local URL. Open `/phase8.html` for
the live deterministic particle/timer/plugin lab; `/phase7.html` retains the
keyboard/pointer/button lab, `/phase6.html` retains the animated two-camera
tilemap, and `/` retains the minimal Pixi lifecycle smoke test.

Useful commands:

| Command                 | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `npm run build`         | Build declarations, ESM library, smoke example, and bundle report. |
| `npm run test`          | Run headless unit tests.                                           |
| `npm run test:e2e`      | Run lifecycle, GPU isolation, and high-DPI camera checks.          |
| `npm run test:perf`     | Run serial Chromium render-FPS floors and the teardown soak.       |
| `npm run test:coverage` | Run unit tests with initial coverage gates.                        |
| `npm run bench`         | Write fixed-loop and pixel-operation benchmark JSON.               |
| `npm run api:check`     | Verify the committed public API report.                            |
| `npm run api:update`    | Intentionally update the API report after review.                  |
| `npm run format`        | Format supported project files.                                    |

## Source baseline

Compatibility is pinned to Flixel commit
`8989e5044be072c4abbbaa1317c9854786f6447f`. The baseline contains 43 AS3 classes,
766 public members, and 14,928 source lines under `org/flixel`.

- [Compatibility ledger](docs/compatibility.md)
- [Architecture decisions](docs/adr/README.md)
- [Lifecycle guide](docs/guides/lifecycle.md)
- [Making games (pools, actions, sync)](docs/guides/making-games.md)
- [Performance guide](docs/guides/performance.md)
- [Browser guide](docs/guides/browser.md)
- [Debugging guide](docs/guides/debugging.md)
- [Extension points](docs/guides/extensions.md)
- [Game-maker DX evidence](docs/dx-evidence.md)
- [Phase 1 evidence and C1 verdict](docs/phase1-evidence.md)
- [Phase 2 evidence and C2 verdict](docs/phase2-evidence.md)
- [Phase 3 evidence and C3 verdict](docs/phase3-evidence.md)
- [Phase 4 evidence and C4 verdict](docs/phase4-evidence.md)
- [Phase 5 evidence and C5 verdict](docs/phase5-evidence.md)
- [Phase 6 evidence and C6 verdict](docs/phase6-evidence.md)
- [Phase 7 evidence and C7 verdict](docs/phase7-evidence.md)
- [Phase 8 evidence and C8 verdict](docs/phase8-evidence.md)
- [Phase 9 evidence and C9 verdict](docs/phase9-evidence.md)
- [Phase 10 evidence and C10 verdict](docs/phase10-evidence.md)
- [Phase 11 evidence and C11 verdict](docs/phase11-evidence.md)
- [Phase 12 evidence and current C12 verdict](docs/phase12-evidence.md)
- [Phase 13 hardening evidence](docs/phase13-evidence.md)
- [Browser support policy](docs/browser-support.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Detailed port plan](PORTING_PLAN.md)

## License

The port is MIT licensed. The original Flixel copyright and license are
preserved in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
