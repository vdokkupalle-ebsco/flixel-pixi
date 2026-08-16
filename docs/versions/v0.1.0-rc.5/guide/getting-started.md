# Installation & Quick Start

Get up and running with **flixel-pixi** in minutes using Vite and TypeScript.

---

## Requirements

- **Node.js**: `v22.12.0` or newer
- **TypeScript**: `v5.0` or newer
- **Browser Target**: Chrome 111+, Firefox 114+, Safari 16.4+, Edge 111+ (WebGL support required)

---

## Installation

Install `flixel-pixi` and its peer dependency `pixi.js` via npm:

```bash
# Using npm
npm install flixel-pixi@next pixi.js@^8.19.0

# Using pnpm
pnpm add flixel-pixi@next pixi.js@^8.19.0

# Using yarn
yarn add flixel-pixi@next pixi.js@^8.19.0
```

> [!NOTE]
> `flixel-pixi` is currently published on npm under the `next` tag during release stabilization.

---

## Setting Up a New Project with Vite

The recommended bundler is [Vite](https://vite.dev).

### 1. Scaffold a Vite TypeScript project

```bash
npm create vite@latest my-flixel-game -- --template vanilla-ts
cd my-flixel-game
npm install
npm install flixel-pixi@next pixi.js@^8.19.0
```

### 2. Configure HTML host

In `index.html`, ensure there is a container element for the canvas:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Flixel Game</title>
    <style>
      body {
        margin: 0;
        background: #0b0f19;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      #game-container {
        width: 640px;
        height: 480px;
      }
    </style>
  </head>
  <body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 3. Initialize your game in `src/main.ts`

```ts
import { createBrowserGame, FlxSprite, FlxState } from 'flixel-pixi';

class PlayState extends FlxState {
  private player!: FlxSprite;

  override create(): void {
    super.create();

    // Create a 32x32 player box
    this.player = new FlxSprite(304, 224);
    this.player.makeGraphic(32, 32, 0x10b981);
    this.add(this.player);
  }

  override update(elapsed: number): void {
    super.update(elapsed);

    // Simple keyboard movement
    const speed = 200;
    this.player.velocity.x = 0;
    this.player.velocity.y = 0;

    if (this.context.input.keyboard.pressed('LEFT', 'A')) {
      this.player.velocity.x = -speed;
    }
    if (this.context.input.keyboard.pressed('RIGHT', 'D')) {
      this.player.velocity.x = speed;
    }
    if (this.context.input.keyboard.pressed('UP', 'W')) {
      this.player.velocity.y = -speed;
    }
    if (this.context.input.keyboard.pressed('DOWN', 'S')) {
      this.player.velocity.y = speed;
    }
  }
}

const host = document.querySelector<HTMLElement>('#game-container');
if (!host) {
  throw new Error('Host element #game-container not found.');
}

const app = await createBrowserGame({
  host,
  initialState: PlayState,
  width: 640,
  height: 480,
  scaleMode: 'letterbox',
});

// Teardown cleanly on page unload
window.addEventListener('pagehide', () => app.destroy(), { once: true });
```

### 4. Start Development Server

```bash
npm run dev
```

Visit the local URL printed in your terminal (typically `http://localhost:5173/`) and test your player movement!

---

## Next Step

Proceed to [Creating Your First Game](/guide/first-game) to add platforms, coins, sound, and a scoring system.
