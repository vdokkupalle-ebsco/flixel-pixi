# Debugging guide

## Debugger overlay

`FlxDebugger` is an optional DOM UI:

- **Log** — `FlxG.log.add(message, color?)`
- **Console** — execute only commands explicitly registered by the game, with
  quoted arguments, bounded history, arrow-key recall, and tab completion
- **Watch** — `FlxG.watch.add(object, field, label?)`
- **Perf** — FPS / step timing from `DebugChannel`
- **VCR** — record / stop / rewind / step / play via callbacks into `FlxG` replay APIs
- **Vis** — toggle visual debug; wire `flxdbg:vis-debug` to `FlxG.visualDebug` and `FlxCameraRenderer.debugBounds`

Mount with `new FlxDebugger({ container })` and `subscribeToChannel(game.debugChannel, game.log, game.watch)`.

Register console commands through the debugger's headless `FlxConsole`:

```ts
debugger_.console.register({
  name: 'player.position',
  aliases: ['pos'],
  description: 'Read the current player position.',
  execute: () => ({ x: player.x, y: player.y }),
});
```

The console does not use `eval` and cannot access game state unless a consumer
explicitly closes over that state in a registered handler. Command failures are
returned as structured results instead of escaping into the render loop.

### Tracked and editable values

`FlxG.watch.add()` remains a read-only compatibility helper. Use `track()` for
getter-backed inspection. A tracked value is read-only unless the game
explicitly supplies its parser, validator, and setter:

```ts
const stopInspecting = FlxG.watch.trackObject('player', player, [
  'x',
  'y',
  'health',
]);
```

`trackObject()` only reads the explicitly listed shallow fields; it does not
walk prototypes or discover properties. The returned disposer removes the
whole tracked field set.

```ts
FlxG.watch.track({
  name: 'player.health',
  read: () => player.health,
  editor: {
    parse: (input) => Number(input),
    validate: (value) =>
      Number.isFinite(value) && value >= 0 && value <= 100
        ? null
        : 'Health must be between 0 and 100.',
    set: (value) => {
      player.health = value;
    },
  },
});
```

Install a global guard for states where external mutation would be unsafe:

```ts
FlxG.watch.setMutationGuard(() =>
  FlxG.vcr.recording || FlxG.vcr.replaying
    ? 'Watch editing is locked during record/replay.'
    : true,
);
```

The Watch panel keeps keyed rows instead of rebuilding its table each frame, so
focused drafts survive live updates. Enter or **Apply** submits an edit; Escape
restores the current value. Parser, validation, guard, getter, and setter errors
are reported inline without escaping into the game loop.

### Pointer object inspection

`FlxObjectInspector` attaches optional Alt+click selection to a canvas while
normal pointer input passes through unchanged:

```ts
const inspector = new FlxObjectInspector(renderer, {
  logicalWidth: 640,
  logicalHeight: 480,
  watch: game.watch,
});

inspector.attach(app.canvas);
```

Picking walks cameras and registered objects in reverse render order, uses the
camera's inverse zoom/rotation/scale transform, and tests authoritative CPU
bounds rather than Pixi hit areas. The selected object receives a yellow camera-
local outline and read-only `selection.x/y/width/height` Watch entries. Emitters
are intentionally excluded because their aggregate bounds are not authoritative
game-object collision bounds. `destroy()` detaches pointer listeners, clears the
outline, and removes selection watches.

The modifier is configurable (`alt`, `control`, `meta`, `shift`, or `false`). A
matching debug click is intercepted before game input; non-matching clicks are
never cancelled.

Keyboard: arrow keys move between tabs. In the Console input, Up/Down recalls
history and Tab completes an unambiguous command. Controls expose `aria-*`
labels for assistive tech.

Backquote toggles the debugger unless focus is in an input, textarea, select,
or editable element. Minimizing with the ✕ control reveals a small **Debug**
launcher, so the overlay is always recoverable without game-specific UI.
Escape minimizes the debugger while focus is inside it.

Visibility controls can be customized when embedding the debugger:

```ts
new FlxDebugger({
  initiallyVisible: true,
  showLauncherWhenHidden: true,
  toggleKey: 'Backquote', // KeyboardEvent.code; false disables the shortcut
});
```

`show()`, `hide()`, and `toggle()` remain available for custom game controls.
The launcher and global shortcut listener are removed by `destroy()`.

## Preloader

`FlxPreloader` shows an accessible loading screen (`role="status"`). Call `setProgress` while loading, then `complete()` to fade out and remove it. Error + retry hooks are available for failed asset loads.

## Interactive demo

`examples/smoke/debugger.html` is the debugger workbench. Production games
should omit debugger imports so the overlay tree-shakes away.
