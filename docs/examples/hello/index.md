# Hello World Example

A minimal game boot demonstration showing how to create a basic state, add a sprite with procedural graphics, and mount the game onto a DOM container.

<DemoEmbed
  src="/games/hello/index.html"
  title="Hello World Demo"
  controlsHint="Click to focus. Use Arrow keys or WASD to move the sprite."
  height="400px"
/>

---

## Source Code

```ts
import { createBrowserGame, FlxG, FlxSprite, FlxState } from 'flixel-pixi';

class PlayState extends FlxState {
  private player!: FlxSprite;

  override create(): void {
    super.create();

    this.player = new FlxSprite(304, 224);
    this.player.makeGraphic(32, 32, 0x10b981);
    this.add(this.player);
  }

  override update(): void {
    super.update();

    const speed = 200;
    this.player.velocity.set(0, 0);

    const kb = FlxG.keys;
    if (kb.pressed('LEFT', 'A')) this.player.velocity.x = -speed;
    if (kb.pressed('RIGHT', 'D')) this.player.velocity.x = speed;
    if (kb.pressed('UP', 'W')) this.player.velocity.y = -speed;
    if (kb.pressed('DOWN', 'S')) this.player.velocity.y = speed;
  }
}

async function init(): Promise<void> {
  const host = document.getElementById('game');
  if (!host) throw new Error('Host element #game not found.');

  const app = await createBrowserGame({
    host,
    initialState: PlayState,
    width: 640,
    height: 480,
  });

  const destroy = (): void => {
    window.removeEventListener('pagehide', destroy);
    app.destroy();
  };
  window.addEventListener('pagehide', destroy, { once: true });
  import.meta.hot?.dispose(destroy);
}

void init();
```

[View Source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/hello)
