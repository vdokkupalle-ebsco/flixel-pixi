# Game-maker DX — Design

**Date:** 2026-08-07  
**Status:** Draft for planning  
**Track:** B — make writing games less footgunny (sync, pools, input)  
**Relation to Phase 13:** Parallel to C13 hardening; does **not** claim 1.0. Prefer DX that also reduces sample-kit fragility.

## Problem

Authors can write correct Flixel simulation code and still get blank/missing sprites, because:

1. **Render registration is manual and easy to miss.** `FlxCameraRenderer.add` must run for every displayable. The sample kit re-syncs on state switch and member-count changes, but that logic lives only in `examples/games/_kit/`, not in the public package. Mid-state `add()` without a kit (or with a stale count) → invisible objects (see Mode Lite enemies).
2. **Pooling is powerful but awkward.** `FlxGroup.recycle` exists; samples often reinvent ad-hoc arrays (`enemies: Enemy[]`, bullet pools) without a short recommended pattern.
3. **Boot is copy-paste.** Every game reimplements Pixi init + `FlxGame` + renderer + ticker + destroy. The kit is good but not a first-class public API.
4. **Input is keys-only for actions.** Games hard-code `'SPACE'` / `'Z'`; there is no action map or gamepad façade, so ports and accessibility bindings are painful.

## Goals

1. **Invisible-by-default becomes hard.** Dynamic `add`/`remove` of sprites/tilemaps/emitters reliably reach the renderer without authors remembering `syncRenderer()`.
2. **One recommended boot path** for browser games (public helper or documented package export), with destroy that matches lifecycle guide.
3. **Pooling recipe** that is copy-pasteable and typed (`FlxTypedGroup` / spawn helpers), used by Mode Lite as proof.
4. **Action-oriented input** (optional thin layer): named actions → keyboard (and later gamepad), without breaking `FlxG.keys`.

## Non-goals

- Full C13 / npm 1.0 publish.
- Rewriting Flixel to inherit Pixi nodes.
- Spine/skeletal animation, networking, full UI framework.
- Perfect Flash `BitmapData` parity.
- Soft FPS CI gates (Phase 13).

## Approaches considered

| Approach | Pros | Cons |
| --- | --- | --- |
| **1. Docs + kit only** | Fast | npm consumers still hit the footgun |
| **2. Engine auto-sync only** | Fixes root cause | Boot still copy-paste; no pool/input DX |
| **3. Hybrid (recommended)** | Public boot + incremental renderer registration + pool/input helpers | Slightly larger API surface |

**Recommendation:** Approach **3**.

## Architecture

```
Public package
  createBrowserGame()     ← promote/adapt examples/games/_kit/boot-game
  FlxCameraRenderer       ← incremental register + optional WorldSync helper
  FlxTypedGroup / pool    ← thin typed recycle helpers
  FlxActions (optional)   ← name → key bindings

Samples
  external Mode Lite      ← migrate to typed pool + public boot
  docs/guides/*           ← lifecycle, extensions, new “making games” notes
```

### 1. Render sync (highest priority)

**Preferred mechanism:** Keep simulation objects free of Pixi. Introduce a small **world sync** owned by the browser boot helper (or `FlxCameraRenderer`):

- After each `game.advance`, **diff** renderables in the active state vs `#entries`.
- `add` missing objects; `remove` entries whose objects left the tree or were destroyed.
- Avoid full `clearObjects()` + rebuild every frame (handle thrash).

Member-count dirty flag (current kit) is a stopgap; **structural diff** is the durable fix (handles replace/remove without count change edge cases).

Optional later: `FlxGroup` emit “membership changed” hooks — only if diff cost is measurable; YAGNI until proven.

### 2. Public browser boot

Promote kit pattern to something like:

```ts
const app = await createBrowserGame({
  host,
  initialState: PlayState,
  width: 640,
  height: 480,
  audioBackend?,
});
// app.game, app.renderer, app.destroy(), auto world-sync each tick
```

Export from package root (or `flixel-pixi/browser` subpath if Pixi must stay peer-only at top level — decide in implementation: prefer root export if `pixi.js` is already peer).

Samples switch to the public helper; `_kit` becomes a thin re-export or is deleted after migration.

### 3. Pooling DX

- Document `FlxGroup.recycle` / `getFirstAvailable` pattern with a **typed group** helper if TypeScript inference is painful today.
- Migrate `examples/games/external` enemies to a bounded recycled group (like bullets), proving the recipe.
- Optional: `spawnFrom(group, Class, init)` one-liner — only if it stays &lt;30 LOC and tested.

### 4. Input DX (thin)

Phase 1 of actions (enough for samples):

```ts
FlxG.actions.bind('jump', 'SPACE', 'W');
FlxG.actions.bind('shoot', 'Z', 'J');
if (FlxG.actions.justPressed('jump')) { ... }
```

Backed by existing `Keyboard` queries. Gamepad = Phase 2 of this track (separate task), stubbed in docs as follow-up.

## Testing

| Area | Proof |
| --- | --- |
| World sync | Unit/integration: add sprite mid-state → renderer `registeredObjectCount` increases without manual sync; remove/kill+remove → count drops when appropriate |
| Boot | Playwright: hello or external boots via public helper |
| Pool | External: enemies visible + recycle does not leak registered handles unbounded |
| Actions | Unit: bind + justPressed mirrors keys |

## Docs

- Update `docs/guides/lifecycle.md`: dynamic members + world sync; public boot.
- Update `docs/guides/extensions.md`: world sync ownership.
- Short `docs/guides/making-games.md` (optional): pools, actions, “why is my sprite invisible?”
- Note in `PORTING_PLAN` or README under a “DX track” / post-C12 polish — not a new phase number unless desired.

## Done criteria

- [ ] Dynamic `state.add(sprite)` without manual `syncRenderer()` still renders in the public boot path
- [ ] `createBrowserGame` (final name TBD) is the documented boot path; samples use it
- [ ] Mode Lite uses recycled enemy group; Playwright still asserts enemies register
- [ ] Action bindings work for at least jump/shoot style games
- [ ] Guides updated; no claim of full C13

## Follow-ups (later)

- Gamepad / touch virtual pad
- Membership events on `FlxGroup` if diffing is hot
- Soft FPS floors (Phase 13)
- Package subpath split if bundle size requires it
