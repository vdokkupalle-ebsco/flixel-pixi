# Debugger, Console & Profiling

Flixel-Pixi includes an in-game developer overlay with interactive CLI console (`FlxConsole`), variable inspector (`FlxWatch`), diagnostic sampler (`FlxDiagnostics`), and FPS display (`FlxFpsDisplay`).

---

## 1. Enabling the In-Game Debugger

```ts
import { FlxDebugger } from 'flixel-pixi';

const debuggerUi = new FlxDebugger(this.context);
this.add(debuggerUi);

// Toggle debugger overlay with backquote (`)
```

---

## 2. Watching Variables in Real Time

```ts
// Watch player variables live on screen
this.context.watch.add(this.player, 'velocity', 'Player Velocity');
this.context.watch.add(this.player, 'health', 'Player Health');
```

---

## 3. Registering Custom Console Commands

```ts
this.context.console.registerCommand({
  name: 'godmode',
  description: 'Toggle player invulnerability',
  execute: () => {
    this.player.invulnerable = !this.player.invulnerable;
    return `God mode is now ${this.player.invulnerable ? 'ON' : 'OFF'}`;
  },
});
```
