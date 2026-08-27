# States & SubStates

Games in Flixel-Pixi are organized into scenes called **States** (`FlxState`). Modal menus, pause screens, and inventories are handled through layered **SubStates** (`FlxSubState`).

---

## The `FlxState` Lifecycle

```
                      ┌───────────────┐
                      │  Constructor  │
                      └───────┬───────┘
                              │
                              ▼
                      ┌───────────────┐
                      │   create()    │ ◄── Initialize objects, groups, cameras
                      └───────┬───────┘
                              │
                ┌─────────────▼─────────────┐
                │                           │
                ▼                           ▼
        ┌───────────────┐           ┌───────────────┐
        │   update()    │           │    draw()     │
        └───────┬───────┘           └───────────────┘
                │
                ▼ (On switch state)
        ┌───────────────┐
        │   destroy()   │ ◄── Releases textures, groups, listeners
        └───────────────┘
```

### Creating a State

```ts
import { FlxButton, FlxG, FlxSprite, FlxState, FlxText } from 'flixel-pixi';
import { PlayState } from './PlayState';

export class MenuState extends FlxState {
  override create(): void {
    super.create();

    const title = new FlxText(0, 140, 640, 'MY RETRO ADVENTURE', 28);
    title.alignment = 'center';
    this.add(title);

    const startBtn = new FlxButton(260, 260, 'START GAME', () => {
      FlxG.switchState(new PlayState());
    });
    this.add(startBtn);
  }
}
```

### Switching States

To transition to a new state:

```ts
FlxG.switchState(new NextState());
```

When switching states:

1. The incoming state is instantiated and its `create()` method is invoked.
2. The previous state's `destroy()` is called automatically, tearing down all children and cleaning up GPU render handles.

---

## Modal Pause Screens with `FlxSubState`

A `FlxSubState` runs _on top_ of the current state. When active, it can optionally pause the parent state's simulation (`update`) while still drawing it in the background.

```ts
import { FlxButton, FlxG, FlxSubState, FlxText } from 'flixel-pixi';

export class PauseSubState extends FlxSubState {
  override create(): void {
    super.create();

    // Dark semi-transparent background overlay
    this.bgColor = 0x88000000;

    const pauseLabel = new FlxText(0, 180, 640, 'PAUSED', 24);
    pauseLabel.alignment = 'center';
    this.add(pauseLabel);

    const resumeBtn = new FlxButton(260, 260, 'RESUME', () => {
      this.close(); // Close substate and resume gameplay
    });
    this.add(resumeBtn);
  }
}
```

### Opening & Closing a SubState

From your `PlayState`:

```ts
// Open pause substate
if (FlxG.keys.justPressed('ESCAPE')) {
  this.openSubState(new PauseSubState());
}
```

---

## Best Practices

- Always allocate game objects inside `create()`, not the constructor, so the active runtime is installed.
- Call `super.create()`, `super.update()`, and `super.destroy()` to preserve group processing and cleanup.
