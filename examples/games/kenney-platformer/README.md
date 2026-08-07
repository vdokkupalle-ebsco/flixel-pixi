# Kenney Platformer Sample

A playable side-scrolling platformer built with **Flixel-Pixi** and curated assets from the **Kenney Platformer Pack Remastered**.

## Run

```bash
npm run dev:games
```

Open [http://127.0.0.1:4174/kenney-platformer/](http://127.0.0.1:4174/kenney-platformer/).

## Controls

- **`←` / `→` or `A` / `D`**: Move left / right
- **`SPACE` or `W` / `UP`**: Jump
- **`R`**: Restart after win / game over

## Architecture & Features

- **Atlas loading**: Uses engine `FlxG.atlas` with `addAnimation` from named frames (`frameWidth` / `frameHeight` for scale) and `makeGraphic` for tile/item strips.
- **Paragon jump feel**: coyote time, jump buffer, early fall, anti-gravity apex (same helpers as the procedural platformer sample).
- **Gameplay**: 100×16 tile course, pits, gold coins, slime patrols, flying pests, 3 lives, green victory flag.

## Assets

Curated copies live in `assets/` (ground, players, enemies, items, hud sheets + `blue_grass` background + Kenney `License.txt`). The full pack is not committed.

## Asset Credits

Art: **Kenney Platformer Pack Remastered** (CC0 1.0 Universal) — [https://kenney.nl](https://kenney.nl)
