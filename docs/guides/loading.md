# Loading and preloaders

`flixel-pixi` uses one renderer-independent loading model with two presentation
contexts:

- a DOM bootstrap preloader while Pixi initializes and renders its first frame;
- an optional Pixi/Flixel state or overlay for later level transitions.

Both consume `FlxLoadingSnapshot`, so progress, cancellation, and errors do not
need separate implementations.

## Bootstrap assets

Declare critical bundles directly on `createBrowserGame`:

```ts
const app = await createBrowserGame({
  host,
  initialState: PlayState,
  assets: {
    bundles: [
      {
        name: 'boot',
        assets: [
          { alias: 'player', src: playerUrl },
          { alias: 'tiles', src: tilesUrl },
        ],
      },
    ],
    initialBundles: 'boot',
    backgroundBundles: 'level-2',
  },
});
```

Initial bundles block game creation and report real Pixi bundle progress.
Background bundles begin after the first rendered frame without blocking boot.

Use `preload` for atlas processing or other game-specific preparation:

```ts
const app = await createBrowserGame({
  host,
  initialState: PlayState,
  async preload({ assets, loadBundle, report, signal }) {
    await loadBundle('boot', 'Loading startup artwork…');
    report(null, 'Building collision data…');
    await buildCollisionData(signal);
    report(1, 'World ready.');
  },
});
```

`null` progress means that the current operation is indeterminate. Custom
preparation should observe the supplied `AbortSignal` when possible and remain
safe to run again after a retry.

## Customizing the DOM preloader

```ts
const app = await createBrowserGame({
  host,
  initialState: PlayState,
  preloader: {
    title: 'Dungeon Runner',
    subtitle: 'Entering the dungeon…',
    className: 'dungeon-loader',
    placement: 'host',
    progress: 'bar',
    showDelayMs: 150,
    minimumVisibleMs: 300,
    transitionMs: 250,
    theme: {
      background: '#09090b',
      accent: '#f59e0b',
      text: '#fafafa',
      mutedText: '#a1a1aa',
      error: '#ef4444',
    },
  },
});
```

Stable selectors include:

- `.flx-preloader`
- `.flx-preloader__brand`
- `.flx-preloader__title`
- `.flx-preloader__subtitle`
- `.flx-preloader__progress`
- `.flx-preloader__spinner`
- `.flx-preloader__status`
- `.flx-preloader__actions`
- `.flx-preloader__retry`
- `.flx-preloader__footer`

Theme CSS variables are `--flx-preloader-background`,
`--flx-preloader-accent`, `--flx-preloader-text`,
`--flx-preloader-muted`, and `--flx-preloader-error`.

Set `preloader: false` to disable the bootstrap view. The former
`showPreloader` and top-level `title` options remain temporarily available but
are deprecated.

## Custom bootstrap view

Replace the DOM presentation without replacing loading orchestration:

```ts
const app = await createBrowserGame({
  host,
  initialState: PlayState,
  preloader: {
    createView({ container, options }) {
      return new BrandedDomPreloader(container, options);
    },
  },
});
```

A custom view implements `FlxPreloaderView`: `update(snapshot)`,
`complete()`, and `destroy()`. Initial views should remain DOM-first because
Pixi's renderer and canvas do not exist until `Application.init()` resolves.

## In-game loading screen

The returned application exposes the same session and asset service:

```ts
const unsubscribe = app.loading.subscribe((snapshot) => {
  loadingState.applySnapshot(snapshot);
});

app.loading.start('assets', 'Loading level 2…', 0);
await app.loading.loadBundle(app.assets, 'level-2', {
  message: 'Loading level 2…',
  startProgress: 0,
  endProgress: 1,
});
app.loading.complete('Level ready.');
unsubscribe();
```

`loadingState` can be a normal `FlxState`, overlay, or other Pixi-backed view.
The engine supplies state and progress; the game owns its artwork and
transition behavior.

## Failure and cancellation

The default bootstrap view keeps a failed boot pending and exposes a retry
button. Set `preloader.retry` to `false` when the caller should receive the
failure immediately.

Pass an `AbortSignal` to cancel a pending boot or retry wait:

```ts
const controller = new AbortController();
const boot = createBrowserGame({
  host,
  initialState: PlayState,
  signal: controller.signal,
});

controller.abort();
await boot; // rejects with AbortError
```

The bootstrap path removes partial canvases and destroys initialized renderer
and game resources before retrying or rejecting.
