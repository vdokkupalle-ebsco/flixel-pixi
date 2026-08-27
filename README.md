<p align="center">
  <img src="./assets/logo.png" width="160" alt="Flixel-Pixi Logo" />
</p>

# flixel-pixi

[![npm prerelease](https://img.shields.io/npm/v/flixel-pixi/next?style=flat-square&logo=npm&label=npm)](https://www.npmjs.com/package/flixel-pixi)
[![monthly downloads](https://img.shields.io/npm/dm/flixel-pixi?style=flat-square&logo=npm&label=downloads)](https://www.npmjs.com/package/flixel-pixi)
[![PR checks](https://img.shields.io/github/actions/workflow/status/vdokkupalle-ebsco/flixel-pixi/pr-checks.yml?branch=main&style=flat-square&label=checks)](https://github.com/vdokkupalle-ebsco/flixel-pixi/actions/workflows/pr-checks.yml)
[![documentation](https://img.shields.io/badge/docs-live-12c7d2?style=flat-square)](https://vdokkupalle-ebsco.github.io/flixel-pixi/)
[![PixiJS](https://img.shields.io/badge/PixiJS-%5E8.19.0-e91e63?style=flat-square)](https://www.npmjs.com/package/pixi.js)
[![MIT license](https://img.shields.io/npm/l/flixel-pixi?style=flat-square)](./LICENSE)

`flixel-pixi` is a browser-native TypeScript game engine that ports the original
ActionScript 3 Flixel API onto PixiJS v8. It combines a deterministic fixed-step
game loop with modern rendering, input, audio, assets, accessibility, and
responsive browser integration.

The project is currently on the `0.1.0-rc.*` prerelease line. APIs may change
between release candidates when real-game validation exposes a concrete issue.

## Install

Install the published prerelease and its PixiJS peer from the `next` channel:

```bash
npm install flixel-pixi@next pixi.js@^8.19.0
```

Supported production browsers follow the Vite 8 Baseline Widely Available
target: Chrome 111+, Edge 111+, Firefox 114+, Safari 16.4+, and iOS Safari
16.4+. WebGL is required; WebGPU is optional and falls back to WebGL. Internet
Explorer and legacy embedded WebViews are not supported. The documented
development workflow requires Node.js 22.12 or newer.

## Quick start

Add a host element to the page:

```html
<div id="game"></div>
```

Create a state, read deterministic input through `FlxG`, and boot the browser
application:

```ts
import { createBrowserGame, FlxG, FlxSprite, FlxState } from 'flixel-pixi';

class PlayState extends FlxState {
  private player!: FlxSprite;

  override create(): void {
    super.create();

    this.player = new FlxSprite(304, 224);
    this.player.makeGraphic(32, 32, 0x22c55e);
    this.add(this.player);
  }

  override update(): void {
    const speed = 200;
    this.player.velocity.set(0, 0);
    if (FlxG.keys.pressed('LEFT', 'A')) this.player.velocity.x = -speed;
    if (FlxG.keys.pressed('RIGHT', 'D')) this.player.velocity.x = speed;
    if (FlxG.keys.pressed('UP', 'W')) this.player.velocity.y = -speed;
    if (FlxG.keys.pressed('DOWN', 'S')) this.player.velocity.y = speed;

    super.update();
  }
}

async function init(): Promise<void> {
  const host = document.querySelector<HTMLElement>('#game');
  if (!host) throw new Error('Missing #game host.');

  const application = await createBrowserGame({
    host,
    initialState: PlayState,
    width: 640,
    height: 480,
    scaling: 'fit',
  });

  const destroy = (): void => {
    window.removeEventListener('pagehide', destroy);
    application.destroy();
  };
  window.addEventListener('pagehide', destroy, { once: true });
  import.meta.hot?.dispose(destroy);
}

void init();
```

`createBrowserGame` owns Pixi initialization, fixed simulation updates,
rendering, browser input, loading, viewport scaling, and teardown. In a real
application, retain the returned object and call `destroy()` only when the game
is unmounted.

## Highlights

- Deterministic states, groups, motion, collision, timers, tweens, paths, and
  replay.
- Portable physics contracts with an optional Planck adapter for rigid bodies,
  collision events, queries, and joints.
- PixiJS sprites, animation, text, tilemaps, cameras, filters, meshes, particles,
  and responsive viewports.
- A hosted Particle Editor for layered effects, generated or uploaded textures,
  versioned JSON exports, and ready-to-integrate bundles.
- Keyboard, pointer, touch, swipe, gamepad, virtual controls, remappable actions,
  and accessible native UI overlays.
- Asset bundles, customizable preloaders, Web Audio, spatial sound, storage,
  debugger tools, performance budgets, and explicit resource teardown.
- Playable examples, including platform, swipe, UI, rendering, and the pinned
  Flx-Invaders compatibility port.

## Documentation

- [Documentation index](docs/README.md)
- [Installation and first game](docs/guide/getting-started.md)
- [Keyboard and mouse input](docs/guide/input.md)
- [Touch and gestures](docs/guide/touch.md)
- [Gamepads and virtual controls](docs/guide/gamepads.md)
- [Lifecycle and browser boot](docs/guides/lifecycle.md)
- [Making games](docs/guides/making-games.md)
- [Browser support](docs/browser-support.md)
- [Particle Editor and layered effects](docs/guide/particle-editor.md)
- [Compatibility with the AS3 baseline](docs/compatibility.md)
- [Versioning and API stability](docs/versioning.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

Import public APIs only from `flixel-pixi`; internal `src/**` paths and deep
`dist/**` imports are unsupported.

## Development

```bash
npm install
npm run typecheck
npm test
npm run dev:games
```

Before opening a pull request, run `npm run verify:quality`. Browser and device
coverage is available through `npm run test:e2e` and `npm run test:matrix`.

## License

`flixel-pixi` is MIT licensed. The original Flixel copyright and license are
preserved in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
