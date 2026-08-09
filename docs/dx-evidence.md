# Game Maker DX Evidence Report

- Status: Implemented (working tree → commit with this note)
- Spec: [`docs/history/implementation-plans/specs/2026-08-07-game-maker-dx-design.md`](history/implementation-plans/specs/2026-08-07-game-maker-dx-design.md)
- Plan: [`docs/history/implementation-plans/plans/2026-08-07-game-maker-dx.md`](history/implementation-plans/plans/2026-08-07-game-maker-dx.md)
- Scope: developer experience only; not a 1.0 release claim

## Deliverables

### 1. Incremental world sync

- `src/rendering/flx-world-sync.ts` — `collectRenderables` / `syncWorldToRenderer`
- `FlxCameraRenderer.registeredObjects` for diffing
- Unit tests: `tests/unit/flx-world-sync.test.ts`

### 2. Public `createBrowserGame`

- `src/browser/create-browser-game.ts` exported from package root
- Preserves prior kit defaults: `flashFramerate` 30, `useSystemCursor` false,
  `{ pointerTarget: canvas, keyboardTarget: window }`
- `examples/games/_kit/boot-game.ts` re-exports as `bootGame`
- Guide: [`docs/guides/lifecycle.md`](guides/lifecycle.md)

### 3. Pooling + Mode Lite

- `examples/games/external/` uses `FlxGroup<Enemy>` + `recycle`
- Guide: [`docs/guides/making-games.md`](guides/making-games.md)

### 4. `FlxActions`

- `src/input/flx-actions.ts` via `FlxG.actions`
- Mode Lite: `bind('shoot', 'Z')`
- Unit tests: `tests/unit/flx-actions.test.ts`

### 5. Docs rollup

- Lifecycle, making-games, extensions, README, and roadmap integration

## Verification

- `npx vitest run` (unit)
- `npm run check:games-imports`
- `npx playwright test tests/browser/sample-games.spec.ts --project=chromium`
