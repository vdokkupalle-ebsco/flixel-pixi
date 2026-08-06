# flixel-pixi

`flixel-pixi` is a TypeScript port of Adam Saltsman's original ActionScript 3
Flixel engine, using PixiJS v8 as its browser rendering foundation.

The repository has completed **Phase 8: particles, timers, and plugins**. It now
includes seeded burst and stream emitters, bounded particle recycling,
deterministic catch-up timers, mutation-safe plugin update/draw passes, Pixi
path-debug geometry, and an opt-in `ParticleContainer` projection that leaves
Flixel lifecycle state authoritative. Phase 9 adds audio and save data in
[PORTING_PLAN.md](PORTING_PLAN.md).

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
- [Phase 1 evidence and C1 verdict](docs/phase1-evidence.md)
- [Phase 2 evidence and C2 verdict](docs/phase2-evidence.md)
- [Phase 3 evidence and C3 verdict](docs/phase3-evidence.md)
- [Phase 4 evidence and C4 verdict](docs/phase4-evidence.md)
- [Phase 5 evidence and C5 verdict](docs/phase5-evidence.md)
- [Phase 6 evidence and C6 verdict](docs/phase6-evidence.md)
- [Phase 7 evidence and C7 verdict](docs/phase7-evidence.md)
- [Phase 8 evidence and C8 verdict](docs/phase8-evidence.md)
- [Browser support policy](docs/browser-support.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Detailed port plan](PORTING_PLAN.md)

## License

The port is MIT licensed. The original Flixel copyright and license are
preserved in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
