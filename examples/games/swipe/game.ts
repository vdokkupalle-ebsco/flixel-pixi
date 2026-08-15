import {
  FlxG,
  FlxGraphic,
  FlxPoint,
  FlxSprite,
  FlxState,
  FlxText,
  makeGraphicPixels,
  type PixelBuffer,
} from '../../../src';

const FRUIT_SIZE = 48;
const TRAIL_SEGMENTS = 24;
const TRAIL_LIFETIME = 0.16;
const PARTICLE_POOL_SIZE = 48;
const FRUIT_COLORS = [0xff4d6dff, 0xffca3aff, 0x8ac926ff, 0x6a4c93ff];
const EXPLOSION_COLORS = [0xfff3b0ff, 0xff9f1cff, 0xff3d00ff, 0xff5a36ff];
const LAUNCHES = [
  { x: 92, vx: 105, vy: -470 },
  { x: 520, vx: -90, vy: -505 },
  { x: 250, vx: 45, vy: -540 },
  { x: 410, vx: -35, vy: -490 },
] as const;

export interface SwipeDemoSnapshot {
  activeBombs: number;
  activeFruit: number;
  bombsHit: number;
  juiceParticles: number;
  juiceParticlesEmitted: number;
  lastJuiceColor: number;
  lastDirection: string;
  misses: number;
  score: number;
  slicePieces: number;
  slicePiecesCreated: number;
  slices: number;
  testBombActive: boolean;
  trailSegments: number;
  trailSegmentsCreated: number;
}

function makeBombPixels(): PixelBuffer {
  const data = new Uint32Array(FRUIT_SIZE * FRUIT_SIZE);
  const center = FRUIT_SIZE / 2;
  for (let y = 0; y < FRUIT_SIZE; y += 1) {
    for (let x = 0; x < FRUIT_SIZE; x += 1) {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      let pixel = dx * dx + dy * dy <= 20 * 20 ? 0x1f2937ff : 0;
      if ((x - 17) ** 2 + (y - 16) ** 2 < 4 ** 2) pixel = 0x64748bff;
      if (x >= 25 && x <= 29 && y >= 1 && y <= 9) pixel = 0x8b5e34ff;
      if ((x - 30) ** 2 + (y - 2) ** 2 <= 4 ** 2) pixel = 0xff9f1cff;
      if ((x - 30) ** 2 + (y - 2) ** 2 <= 1) pixel = 0xffffffff;
      data[y * FRUIT_SIZE + x] = pixel;
    }
  }
  return { data, height: FRUIT_SIZE, width: FRUIT_SIZE };
}

function makeFruitPixels(color: number): PixelBuffer {
  const data = new Uint32Array(FRUIT_SIZE * FRUIT_SIZE);
  const center = FRUIT_SIZE / 2;
  for (let y = 0; y < FRUIT_SIZE; y += 1) {
    for (let x = 0; x < FRUIT_SIZE; x += 1) {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      const radius = dx * dx + dy * dy;
      let pixel = radius <= 21 * 21 ? color : 0;
      if ((x - 16) ** 2 + (y - 14) ** 2 < 4 ** 2) pixel = 0xffffffbb;
      if (x >= 22 && x <= 26 && y <= 6) pixel = 0x6b3f22ff;
      if (x >= 26 && x <= 36 && y >= 3 && y <= 8) pixel = 0x4ade80ff;
      data[y * FRUIT_SIZE + x] = pixel;
    }
  }
  return { data, height: FRUIT_SIZE, width: FRUIT_SIZE };
}

function makeFruitHalfPixels(
  color: number,
  half: 'bottom' | 'top',
): PixelBuffer {
  const pixels = makeFruitPixels(color);
  const splitY = FRUIT_SIZE / 2;
  for (let y = 0; y < FRUIT_SIZE; y += 1) {
    for (let x = 0; x < FRUIT_SIZE; x += 1) {
      const keep = half === 'top' ? y < splitY : y >= splitY;
      const index = y * FRUIT_SIZE + x;
      if (!keep) pixels.data[index] = 0;
      else if (Math.abs(y - splitY) <= 1 && (x + 0.5 - splitY) ** 2 < 20 ** 2) {
        pixels.data[index] = 0xffffd6aa;
      }
    }
  }
  return pixels;
}

function distanceToSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const amount =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((pointX - startX) * dx + (pointY - startY) * dy) / lengthSquared,
          ),
        );
  return Math.hypot(
    pointX - (startX + dx * amount),
    pointY - (startY + dy * amount),
  );
}

class Fruit extends FlxSprite {
  readonly graphicIndex: number;

  constructor(x: number, y: number, graphic: FlxGraphic, graphicIndex: number) {
    super(x, y, graphic);
    this.graphicIndex = graphicIndex;
    this.acceleration.y = 580;
    this.angularVelocity = 110;
  }
}

class Bomb extends FlxSprite {
  constructor(x: number, y: number, graphic: FlxGraphic) {
    super(x, y, graphic);
    this.acceleration.y = 580;
    this.angularVelocity = -150;
  }
}

interface JuiceParticle {
  life: number;
  sprite: FlxSprite;
}

interface TrailSegment {
  life: number;
  sprite: FlxSprite;
}

interface SlicePiece {
  life: number;
  sprite: FlxSprite;
}

/** Touch-first fruit slicing demo with deterministic launches. */
export class SwipeDemoState extends FlxState {
  score = 0;
  slices = 0;
  misses = 0;
  bombsHit = 0;
  lastJuiceColor = 0;
  lastDirection = 'none';

  readonly #fruitGraphics = FRUIT_COLORS.map((color, index) =>
    FlxGraphic.fromPixels(makeFruitPixels(color), `swipe-fruit-${index}`),
  );
  readonly #fruitHalfGraphics = FRUIT_COLORS.map(
    (color, index) =>
      [
        FlxGraphic.fromPixels(
          makeFruitHalfPixels(color, 'top'),
          `swipe-fruit-${index}-top`,
        ),
        FlxGraphic.fromPixels(
          makeFruitHalfPixels(color, 'bottom'),
          `swipe-fruit-${index}-bottom`,
        ),
      ] as const,
  );
  readonly #bombGraphic = FlxGraphic.fromPixels(makeBombPixels(), 'swipe-bomb');
  readonly #fruitParticleGraphics = FRUIT_COLORS.map((color, index) =>
    FlxGraphic.fromPixels(
      makeGraphicPixels(6, 6, color),
      `swipe-fruit-particle-${index}`,
    ),
  );
  readonly #explosionGraphics = EXPLOSION_COLORS.map(
    (color, index) =>
      [
        FlxGraphic.fromPixels(
          makeGraphicPixels(7, 7, color),
          `swipe-explosion-${index}-small`,
        ),
        FlxGraphic.fromPixels(
          makeGraphicPixels(10, 10, color),
          `swipe-explosion-${index}-large`,
        ),
      ] as const,
  );
  #fruits: Fruit[] = [];
  #bombs: Bomb[] = [];
  #particles: JuiceParticle[] = [];
  #slicePieces: SlicePiece[] = [];
  #spawnElapsed = 0;
  #testBomb: Bomb | null = null;
  #launchIndex = 0;
  #mouseStart: FlxPoint | null = null;
  #hud!: FlxText;
  #trailKey: string | null = null;
  #trailLast: FlxPoint | null = null;
  #trailSegments: TrailSegment[] = [];
  #juiceParticlesEmitted = 0;
  #slicePiecesCreated = 0;
  #trailSegmentsCreated = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff071827;

    const horizon = new FlxSprite(0, 390).makeGraphic(640, 90, 0x102a43ff);
    const title = new FlxText(20, 16, 420, 'FRUIT PUNCH').setFormat(
      undefined,
      24,
      0xfffff3c4,
    );
    const help = new FlxText(
      22,
      48,
      590,
      'Swipe fruit · avoid bombs · touch or drag · fixed-step gestures',
    ).setFormat(undefined, 12, 0xffa7c7e7);
    this.#hud = new FlxText(430, 18, 190, '').setFormat(
      undefined,
      13,
      0xffffffff,
      'right',
    );
    this.add(horizon);
    this.add(title);
    this.add(help);
    this.add(this.#hud);
    const initialParticleGraphic = this.#fruitParticleGraphics[0];
    if (initialParticleGraphic === undefined) {
      throw new Error('Particle graphics are unavailable.');
    }
    for (let index = 0; index < PARTICLE_POOL_SIZE; index += 1) {
      const sprite = new FlxSprite(0, 0, initialParticleGraphic);
      sprite.visible = false;
      this.#particles.push({ life: 0, sprite });
      this.add(sprite);
    }
    for (let index = 0; index < TRAIL_SEGMENTS; index += 1) {
      const sprite = new FlxSprite().makeGraphic(
        1,
        1,
        index % 3 === 0 ? 0xffffd166 : 0xffffffff,
      );
      sprite.origin.make(0, 0.5);
      sprite.scrollFactor.make(0, 0);
      sprite.visible = false;
      this.#trailSegments.push({ life: 0, sprite });
      this.add(sprite);
    }
    this.#updateHud();
  }

  override update(): void {
    this.#handleSwipes();
    this.#updateTrail();
    this.#spawnElapsed += FlxG.elapsed;
    if (this.#spawnElapsed >= 0.78) {
      this.#spawnElapsed -= 0.78;
      this.#launchFruit();
    }

    super.update();

    for (const fruit of [...this.#fruits]) {
      if (fruit.y > FlxG.height + FRUIT_SIZE && fruit.velocity.y > 0) {
        this.misses += 1;
        this.#removeFruit(fruit);
        this.#updateHud();
      }
    }
    for (const bomb of [...this.#bombs]) {
      if (bomb.y > FlxG.height + FRUIT_SIZE && bomb.velocity.y > 0) {
        this.#removeBomb(bomb);
      }
    }
    for (const particle of this.#particles) {
      if (particle.life <= 0) continue;
      particle.life -= FlxG.elapsed;
      if (particle.life <= 0) {
        particle.life = 0;
        particle.sprite.visible = false;
      }
    }
    for (const piece of [...this.#slicePieces]) {
      piece.life -= FlxG.elapsed;
      piece.sprite.alpha = Math.min(1, piece.life / 0.24);
      if (piece.life <= 0) {
        this.remove(piece.sprite, true);
        piece.sprite.destroy();
        this.#slicePieces.splice(this.#slicePieces.indexOf(piece), 1);
      }
    }
  }

  spawnTestFruit(x = 296, y = 196): { x: number; y: number } {
    const fruit = this.#spawnFruit(x, y, 0, 0);
    fruit.acceleration.y = 0;
    fruit.angularVelocity = 0;
    return { x: fruit.x + fruit.width / 2, y: fruit.y + fruit.height / 2 };
  }

  spawnTestBomb(x = 296, y = 196): { x: number; y: number } {
    const bomb = this.#spawnBomb(x, y, 0, 0);
    this.#testBomb = bomb;
    bomb.acceleration.y = 0;
    bomb.angularVelocity = 0;
    return { x: bomb.x + bomb.width / 2, y: bomb.y + bomb.height / 2 };
  }

  slice(startX: number, startY: number, endX: number, endY: number): number {
    let sliced = 0;
    for (const fruit of [...this.#fruits]) {
      const centerX = fruit.x + fruit.width / 2;
      const centerY = fruit.y + fruit.height / 2;
      if (
        distanceToSegment(centerX, centerY, startX, startY, endX, endY) >
        FRUIT_SIZE * 0.52
      ) {
        continue;
      }
      this.#splitFruit(fruit, startX, startY, endX, endY);
      this.#splash(
        centerX,
        centerY,
        fruit.velocity.x,
        fruit.velocity.y,
        FRUIT_COLORS[fruit.graphicIndex] ?? 0xffffffff,
      );
      this.#removeFruit(fruit);
      this.slices += 1;
      this.score += 10;
      sliced += 1;
    }
    let bombsSliced = 0;
    for (const bomb of [...this.#bombs]) {
      const centerX = bomb.x + bomb.width / 2;
      const centerY = bomb.y + bomb.height / 2;
      if (
        distanceToSegment(centerX, centerY, startX, startY, endX, endY) >
        FRUIT_SIZE * 0.54
      ) {
        continue;
      }
      this.#explodeBomb(bomb, centerX, centerY);
      this.#removeBomb(bomb);
      this.bombsHit += 1;
      this.score = Math.max(0, this.score - 25);
      bombsSliced += 1;
    }
    if (sliced > 0 || bombsSliced > 0) this.#updateHud();
    return sliced;
  }

  snapshot(): SwipeDemoSnapshot {
    return {
      activeBombs: this.#bombs.length,
      activeFruit: this.#fruits.length,
      bombsHit: this.bombsHit,
      juiceParticles: this.#particles.filter((particle) => particle.life > 0)
        .length,
      juiceParticlesEmitted: this.#juiceParticlesEmitted,
      lastJuiceColor: this.lastJuiceColor,
      lastDirection: this.lastDirection,
      misses: this.misses,
      score: this.score,
      slicePieces: this.#slicePieces.length,
      slicePiecesCreated: this.#slicePiecesCreated,
      slices: this.slices,
      testBombActive: this.#testBomb !== null,
      trailSegments: this.#trailSegments.filter((segment) => segment.life > 0)
        .length,
      trailSegmentsCreated: this.#trailSegmentsCreated,
    };
  }

  override destroy(): void {
    this.#fruits = [];
    this.#bombs = [];
    this.#particles = [];
    this.#slicePieces = [];
    this.#trailSegments = [];
    super.destroy();
    this.#bombGraphic.destroy();
    for (const graphic of this.#fruitGraphics) graphic.destroy();
    for (const graphic of this.#fruitParticleGraphics) graphic.destroy();
    for (const pair of this.#explosionGraphics) {
      pair[0].destroy();
      pair[1].destroy();
    }
    for (const pair of this.#fruitHalfGraphics) {
      pair[0].destroy();
      pair[1].destroy();
    }
  }

  #handleSwipes(): void {
    for (const swipe of FlxG.touches.swipes) {
      this.lastDirection = swipe.direction;
      this.#updateHud();
    }

    const mouse = FlxG.mouse;
    if (mouse.justPressed()) this.#mouseStart = mouse.getGlobalPosition();
    if (mouse.justReleased() && this.#mouseStart !== null) {
      const end = mouse.getGlobalPosition();
      const dx = end.x - this.#mouseStart.x;
      const dy = end.y - this.#mouseStart.y;
      if (Math.hypot(dx, dy) >= 24) {
        this.lastDirection =
          Math.abs(dx) >= Math.abs(dy)
            ? dx < 0
              ? 'left'
              : 'right'
            : dy < 0
              ? 'up'
              : 'down';
        this.#updateHud();
      }
      this.#mouseStart = null;
    }
  }

  #updateTrail(): void {
    for (const segment of this.#trailSegments) {
      if (segment.life <= 0) continue;
      segment.life = Math.max(0, segment.life - FlxG.elapsed);
      const strength = segment.life / TRAIL_LIFETIME;
      segment.sprite.alpha = strength * strength;
      segment.sprite.scale.y = 2 + strength * 7;
      segment.sprite.visible = segment.life > 0;
    }

    const touch = FlxG.touches.firstActive;
    const mouseActive = FlxG.mouse.pressed() && this.#mouseStart !== null;
    if (touch === null && !mouseActive) {
      this.#trailKey = null;
      this.#trailLast = null;
      return;
    }

    const key = touch === null ? 'mouse' : `touch-${touch.pointerId}`;
    const current = touch ?? FlxG.mouse.getGlobalPosition();
    if (this.#trailKey !== key || this.#trailLast === null) {
      this.#trailKey = key;
      this.#trailLast =
        touch === null
          ? new FlxPoint(
              this.#mouseStart?.x ?? current.x,
              this.#mouseStart?.y ?? current.y,
            )
          : new FlxPoint(touch.startX, touch.startY);
    }
    const previous = this.#trailLast;
    if (previous === null) return;
    this.#appendTrailSegment(previous, current);
    previous.copyFrom(current);
  }

  #appendTrailSegment(start: FlxPoint, end: FlxPoint): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) return;
    const segment =
      this.#trailSegments.find((candidate) => candidate.life <= 0) ??
      this.#trailSegments.reduce((oldest, candidate) =>
        candidate.life < oldest.life ? candidate : oldest,
      );
    segment.life = TRAIL_LIFETIME;
    segment.sprite.visible = true;
    segment.sprite.alpha = 1;
    segment.sprite.x = start.x;
    segment.sprite.y = start.y;
    segment.sprite.scale.x = distance;
    segment.sprite.scale.y = 9;
    segment.sprite.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    this.#trailSegmentsCreated += 1;
    this.slice(start.x, start.y, end.x, end.y);
  }

  #launchFruit(): void {
    const launchNumber = this.#launchIndex;
    const launch = LAUNCHES[launchNumber % LAUNCHES.length] ?? LAUNCHES[0];
    const graphicIndex = launchNumber % this.#fruitGraphics.length;
    this.#launchIndex += 1;
    if (launchNumber % 5 === 4) {
      this.#spawnBomb(launch.x, FlxG.height + 8, launch.vx, launch.vy);
      return;
    }
    this.#spawnFruit(
      launch.x,
      FlxG.height + 8,
      launch.vx,
      launch.vy,
      graphicIndex,
    );
  }

  #spawnFruit(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    graphicIndex = this.#launchIndex % this.#fruitGraphics.length,
  ): Fruit {
    const graphic = this.#fruitGraphics[graphicIndex] ?? this.#fruitGraphics[0];
    if (graphic === undefined)
      throw new Error('Fruit graphics are unavailable.');
    const fruit = new Fruit(x, y, graphic, graphicIndex);
    fruit.velocity.make(velocityX, velocityY);
    this.#fruits.push(fruit);
    this.add(fruit);
    return fruit;
  }

  #removeFruit(fruit: Fruit): void {
    this.remove(fruit, true);
    this.#fruits.splice(this.#fruits.indexOf(fruit), 1);
    fruit.destroy();
  }

  #spawnBomb(x: number, y: number, velocityX: number, velocityY: number): Bomb {
    const bomb = new Bomb(x, y, this.#bombGraphic);
    bomb.velocity.make(velocityX, velocityY);
    this.#bombs.push(bomb);
    this.add(bomb);
    return bomb;
  }

  #removeBomb(bomb: Bomb): void {
    this.remove(bomb, true);
    this.#bombs.splice(this.#bombs.indexOf(bomb), 1);
    if (this.#testBomb === bomb) this.#testBomb = null;
    bomb.destroy();
  }

  #splitFruit(
    fruit: Fruit,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): void {
    const graphics = this.#fruitHalfGraphics[fruit.graphicIndex];
    if (graphics === undefined) return;
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const swipeAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    for (const [index, graphic] of graphics.entries()) {
      const direction = index === 0 ? -1 : 1;
      const piece = new FlxSprite(fruit.x, fruit.y, graphic);
      piece.angle = swipeAngle;
      piece.velocity.make(
        fruit.velocity.x + normalX * direction * 125,
        fruit.velocity.y + normalY * direction * 125 - 25,
      );
      piece.acceleration.y = 650;
      piece.angularVelocity = direction * 260;
      this.#slicePieces.push({ life: 0.72, sprite: piece });
      this.#slicePiecesCreated += 1;
      this.add(piece);
    }
  }

  #splash(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    color: number,
  ): void {
    this.lastJuiceColor = color;
    const colorIndex = FRUIT_COLORS.indexOf(color);
    const graphic =
      this.#fruitParticleGraphics[colorIndex] ?? this.#fruitParticleGraphics[0];
    if (graphic === undefined) return;
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const particle = this.#acquireParticle(graphic, x, y, 0.42);
      particle.sprite.velocity.make(
        velocityX * 0.2 + Math.cos(angle) * 150,
        velocityY * 0.15 + Math.sin(angle) * 150,
      );
      particle.sprite.acceleration.y = 360;
    }
  }

  #explodeBomb(bomb: Bomb, x: number, y: number): void {
    for (let index = 0; index < 20; index += 1) {
      const angle = (index / 20) * Math.PI * 2;
      const speed = 120 + (index % 4) * 35;
      const colorIndex = index % EXPLOSION_COLORS.length;
      const sizeIndex = index % 3 === 0 ? 1 : 0;
      const graphic = this.#explosionGraphics[colorIndex]?.[sizeIndex];
      if (graphic === undefined) continue;
      const particle = this.#acquireParticle(graphic, x, y, 0.58);
      particle.sprite.velocity.make(
        bomb.velocity.x * 0.15 + Math.cos(angle) * speed,
        bomb.velocity.y * 0.1 + Math.sin(angle) * speed,
      );
      particle.sprite.acceleration.y = 260;
      particle.sprite.angularVelocity = index % 2 === 0 ? 300 : -300;
    }
    FlxG.camera.shake(0.018, 0.22);
  }

  #acquireParticle(
    graphic: FlxGraphic,
    x: number,
    y: number,
    life: number,
  ): JuiceParticle {
    const particle =
      this.#particles.find((candidate) => candidate.life <= 0) ??
      this.#particles.reduce((oldest, candidate) =>
        candidate.life < oldest.life ? candidate : oldest,
      );
    particle.life = life;
    particle.sprite.loadGraphic(graphic);
    particle.sprite.x = x;
    particle.sprite.y = y;
    particle.sprite.alpha = 1;
    particle.sprite.angle = 0;
    particle.sprite.angularVelocity = 0;
    particle.sprite.velocity.make(0, 0);
    particle.sprite.acceleration.make(0, 0);
    particle.sprite.visible = true;
    this.#juiceParticlesEmitted += 1;
    return particle;
  }

  #updateHud(): void {
    this.#hud.text = `SCORE ${String(this.score).padStart(3, '0')}\nSLICES ${this.slices} · MISSED ${this.misses}\nBOMBS ${this.bombsHit} · ${this.lastDirection.toUpperCase()}`;
  }
}
