import {
  FlxButton,
  FlxG,
  FlxPoint,
  FlxSprite,
  FlxState,
  FlxText,
  type FlxBrowserViewportSnapshot,
  type FlxBrowserViewportRect,
} from '../../../src';

const LOGICAL_WIDTH = 640;
const LOGICAL_HEIGHT = 360;

class RectOutline {
  readonly sprites: readonly FlxSprite[];
  readonly #bottom: FlxSprite;
  readonly #left: FlxSprite;
  readonly #right: FlxSprite;
  readonly #thickness: number;
  readonly #top: FlxSprite;

  constructor(color: number, thickness = 2) {
    this.#thickness = thickness;
    this.#top = this.#line(color);
    this.#right = this.#line(color);
    this.#bottom = this.#line(color);
    this.#left = this.#line(color);
    this.sprites = [this.#top, this.#right, this.#bottom, this.#left];
  }

  set(rect: FlxBrowserViewportRect): void {
    const visible = rect.width > 0 && rect.height > 0;
    for (const sprite of this.sprites) sprite.visible = visible;
    if (!visible) return;
    const thickness = Math.min(this.#thickness, rect.width, rect.height);
    this.#place(this.#top, rect.left, rect.top, rect.width, thickness);
    this.#place(
      this.#right,
      rect.right - thickness,
      rect.top,
      thickness,
      rect.height,
    );
    this.#place(
      this.#bottom,
      rect.left,
      rect.bottom - thickness,
      rect.width,
      thickness,
    );
    this.#place(this.#left, rect.left, rect.top, thickness, rect.height);
  }

  #line(color: number): FlxSprite {
    const sprite = new FlxSprite().makeGraphic(1, 1, color);
    sprite.origin.make(0, 0);
    sprite.scrollFactor.make(0, 0);
    return sprite;
  }

  #place(
    sprite: FlxSprite,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    sprite.x = x;
    sprite.y = y;
    sprite.scale.make(width, height);
  }
}

export interface ViewportDemoSnapshot {
  readonly pointerLocalX: number;
  readonly pointerLocalY: number;
  readonly pointerX: number;
  readonly pointerY: number;
  readonly safeRect: FlxBrowserViewportRect | null;
  readonly targetX: number;
  readonly targetY: number;
  readonly visibleRect: FlxBrowserViewportRect | null;
}

export class ViewportDemoState extends FlxState {
  readonly #visibleOutline = new RectOutline(0x38bdf8ff);
  readonly #safeOutline = new RectOutline(0x4ade80ff, 3);
  readonly #topLeft = this.#label('SAFE TOP LEFT', 'left');
  readonly #topRight = this.#label('SAFE TOP RIGHT', 'right');
  readonly #bottomLeft = this.#label('SAFE BOTTOM LEFT', 'left');
  readonly #bottomRight = this.#label('SAFE BOTTOM RIGHT', 'right');
  readonly #diagnostics = this.#label('', 'center', 360);
  readonly #pointerHorizontal = this.#marker(0xffc857ff);
  readonly #pointerVertical = this.#marker(0xffc857ff);
  readonly #pointer = new FlxPoint();
  readonly #target = new FlxSprite().makeGraphic(24, 24, 0xff5d8fff);
  readonly #safeButton = new FlxButton(0, 0, 'SAFE UI', () => {
    this.#activations += 1;
  });
  #activations = 0;
  #elapsed = 0;
  #pendingViewport: FlxBrowserViewportSnapshot | null = null;
  #viewport: FlxBrowserViewportSnapshot | null = null;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    this.add(
      new FlxSprite().makeGraphic(LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x0b1728ff),
    );

    for (let x = 0; x <= LOGICAL_WIDTH; x += 40) {
      const line = new FlxSprite(x, 0).makeGraphic(
        1,
        LOGICAL_HEIGHT,
        0x172a42ff,
      );
      this.add(line);
    }
    for (let y = 0; y <= LOGICAL_HEIGHT; y += 40) {
      const line = new FlxSprite(0, y).makeGraphic(
        LOGICAL_WIDTH,
        1,
        0x172a42ff,
      );
      this.add(line);
    }

    this.#target.origin.make(12, 12);
    this.add(this.#target);
    for (const sprite of this.#visibleOutline.sprites) this.add(sprite);
    for (const sprite of this.#safeOutline.sprites) this.add(sprite);
    for (const label of [
      this.#topLeft,
      this.#topRight,
      this.#bottomLeft,
      this.#bottomRight,
      this.#diagnostics,
    ]) {
      this.add(label);
    }
    this.#safeButton.accessibleLabel = 'Safe area test button';
    this.#safeButton.tabIndex = 0;
    this.add(this.#safeButton);
    this.#pointerVertical.scale.make(1, 17);
    this.add(this.#pointerHorizontal);
    this.add(this.#pointerVertical);
  }

  override update(): void {
    if (this.#pendingViewport !== null) {
      this.#viewport = this.#pendingViewport;
      this.#pendingViewport = null;
      this.#layoutHud(this.#viewport);
    }

    this.#elapsed += FlxG.elapsed;
    const visibleRect = this.#viewport?.visibleRect ?? {
      bottom: LOGICAL_HEIGHT,
      height: LOGICAL_HEIGHT,
      left: 0,
      right: LOGICAL_WIDTH,
      top: 0,
      width: LOGICAL_WIDTH,
      x: 0,
      y: 0,
    };
    const targetRangeX = Math.max(0, visibleRect.width - this.#target.width);
    const targetRangeY = Math.max(0, visibleRect.height - this.#target.height);
    this.#target.x =
      visibleRect.left +
      (0.5 + Math.cos(this.#elapsed * 0.9) * 0.5) * targetRangeX;
    this.#target.y =
      visibleRect.top +
      (0.5 + Math.sin(this.#elapsed * 1.4) * 0.5) * targetRangeY;

    FlxG.mouse.getGlobalPosition(this.#pointer);
    this.#pointerHorizontal.x = this.#pointer.x - 8;
    this.#pointerHorizontal.y = this.#pointer.y;
    this.#pointerVertical.x = this.#pointer.x;
    this.#pointerVertical.y = this.#pointer.y - 8;
    if (this.#viewport !== null) {
      const localX = this.#pointer.x - visibleRect.left;
      const localY = this.#pointer.y - visibleRect.top;
      const compact = this.#viewport.safeRect.width < 360;
      this.#diagnostics.text = compact
        ? `${this.#viewport.mode.toUpperCase()} · G ${this.#pointer.x.toFixed(0)},${this.#pointer.y.toFixed(0)} · L ${localX.toFixed(0)},${localY.toFixed(0)}`
        : `${this.#viewport.mode.toUpperCase()} · global ${this.#pointer.x.toFixed(1)}, ${this.#pointer.y.toFixed(1)} · visible-local ${localX.toFixed(1)}, ${localY.toFixed(1)} · activations ${this.#activations}`;
    }
    super.update();
  }

  queueViewport(snapshot: FlxBrowserViewportSnapshot): void {
    this.#pendingViewport = snapshot;
  }

  snapshot(): ViewportDemoSnapshot {
    const visibleRect = this.#viewport?.visibleRect;
    return {
      pointerLocalX: this.#pointer.x - (visibleRect?.left ?? 0),
      pointerLocalY: this.#pointer.y - (visibleRect?.top ?? 0),
      pointerX: this.#pointer.x,
      pointerY: this.#pointer.y,
      safeRect: this.#viewport?.safeRect ?? null,
      targetX: this.#target.x,
      targetY: this.#target.y,
      visibleRect: visibleRect ?? null,
    };
  }

  #layoutHud(snapshot: FlxBrowserViewportSnapshot): void {
    const { safeRect, visibleRect } = snapshot;
    const compact = safeRect.width < 360;
    const cornerWidth = compact ? 32 : 150;
    this.#visibleOutline.set(visibleRect);
    this.#safeOutline.set(safeRect);
    this.#topLeft.text = compact ? 'TL' : 'SAFE TOP LEFT';
    this.#topRight.text = compact ? 'TR' : 'SAFE TOP RIGHT';
    this.#bottomLeft.text = compact ? 'BL' : 'SAFE BOTTOM LEFT';
    this.#bottomRight.text = compact ? 'BR' : 'SAFE BOTTOM RIGHT';
    for (const label of [
      this.#topLeft,
      this.#topRight,
      this.#bottomLeft,
      this.#bottomRight,
    ]) {
      label.width = cornerWidth;
    }
    this.#topLeft.x = safeRect.left + 10;
    this.#topLeft.y = safeRect.top + 9;
    this.#topRight.x = safeRect.right - cornerWidth - 10;
    this.#topRight.y = safeRect.top + 9;
    this.#bottomLeft.x = safeRect.left + 10;
    this.#bottomLeft.y = safeRect.bottom - 28;
    this.#bottomRight.x = safeRect.right - cornerWidth - 10;
    this.#bottomRight.y = safeRect.bottom - 28;
    this.#diagnostics.width = Math.max(1, safeRect.width - 20);
    this.#diagnostics.x = safeRect.left + 10;
    this.#diagnostics.y = safeRect.top + 38;
    this.#safeButton.x = safeRect.left + (safeRect.width - 80) / 2;
    this.#safeButton.y = safeRect.bottom - 34;
  }

  #label(
    text: string,
    alignment: 'center' | 'left' | 'right',
    width = 150,
  ): FlxText {
    const label = new FlxText(0, 0, width, text);
    label.setFormat('Arial', 12, 0xfff8fafc, alignment);
    label.scrollFactor.make(0, 0);
    return label;
  }

  #marker(color: number): FlxSprite {
    const marker = new FlxSprite().makeGraphic(1, 1, color);
    marker.origin.make(0, 0);
    marker.scale.make(17, 1);
    marker.scrollFactor.make(0, 0);
    return marker;
  }
}
