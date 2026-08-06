# Debugging guide

## Debugger overlay

`FlxDebugger` is an optional DOM UI (Phase 11):

- **Log** — `FlxG.log.add(message, color?)`
- **Watch** — `FlxG.watch.add(object, field, label?)`
- **Perf** — FPS / step timing from `DebugChannel`
- **VCR** — record / stop / rewind / step / play via callbacks into `FlxG` replay APIs
- **Vis** — toggle visual debug; wire `flxdbg:vis-debug` to `FlxG.visualDebug` and `FlxCameraRenderer.debugBounds`

Mount with `new FlxDebugger({ container })` and `subscribeToChannel(game.debugChannel, game.log, game.watch)`.

Keyboard: arrow keys move between tabs; controls expose `aria-*` labels for assistive tech.

## Preloader

`FlxPreloader` shows an accessible loading screen (`role="status"`). Call `setProgress` while loading, then `complete()` to fade out and remove it. Error + retry hooks are available for failed asset loads.

## Smoke labs

Phase labs under `examples/smoke/phase11.html` remain the debugger workbench. Production games should omit debugger imports so the overlay tree-shakes away.
