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
