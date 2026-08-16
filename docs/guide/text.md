# Bitmap & Canvas Text

Text rendering in Flixel-Pixi supports standard high-resolution canvas text (`FlxText`) and high-performance bitmap fonts (`FlxBitmapText` and `FlxBitmapFont`).

---

## 1. High-Resolution Text (`FlxText`)

```ts
import { FlxText } from 'flixel-pixi';

const scoreText = new FlxText(16, 16, 300, 'SCORE: 0000', 20);
scoreText.color = 0xf8fafc;
scoreText.alignment = 'left';
scoreText.setShadow(2, 2, 0x0f172a, 1);
this.add(scoreText);
```

---

## 2. High-Performance Bitmap Fonts (`FlxBitmapText`)

For rapidly changing values (FPS meters, damage numbers, retro arcade fonts), `FlxBitmapText` uses a pre-rendered texture atlas with zero per-frame canvas allocations:

```ts
import { FlxBitmapFont, FlxBitmapText, parseBmFontXml } from 'flixel-pixi';

// Parse AngelCode XML BMFont descriptor
const fontData = parseBmFontXml(xmlText);
const font = new FlxBitmapFont('assets/retro_font.png', fontData);

const arcadeText = new FlxBitmapText(100, 50, font, '1UP 00240');
this.add(arcadeText);
```
