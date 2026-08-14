/**
 * Source port of Adam Saltsman's MIT-licensed Flx-Invaders at commit
 * a941a9dfad7663a20e9f7f4bf2a90603d7effe89.
 */
import {
  FlxAssets,
  FlxG,
  FlxGroup,
  FlxSprite,
  FlxState,
  FlxText,
} from '../../../src';
import type { FlxGraphic, FlxObject } from '../../../src';

export const ALIEN_ASSET = 'flx-invaders-alien';
export const SHIP_ASSET = 'flx-invaders-ship';

function requireGraphic(id: string): FlxGraphic {
  const graphic = FlxAssets.fromContext(FlxG.context)?.getGraphic(id);
  if (graphic === undefined)
    throw new Error(`Missing Flx-Invaders asset ${id}.`);
  return graphic;
}

class PlayerShip extends FlxSprite {
  shotsFired = 0;

  constructor(readonly bullets: FlxGroup<FlxSprite>) {
    super(FlxG.width / 2 - 6, FlxG.height - 12, requireGraphic(SHIP_ASSET));
  }

  override update(): void {
    this.velocity.x = 0;
    if (FlxG.keys.LEFT) this.velocity.x -= 150;
    if (FlxG.keys.RIGHT) this.velocity.x += 150;
    super.update();

    if (this.x > FlxG.width - this.width - 4) {
      this.x = FlxG.width - this.width - 4;
    }
    if (this.x < 4) this.x = 4;
    if (FlxG.keys.justPressed('SPACE')) this.fire();
  }

  fire(): void {
    const bullet = this.bullets.recycle();
    if (bullet === null) return;
    bullet.reset(this.x + this.width / 2 - bullet.width / 2, this.y);
    bullet.velocity.y = -140;
    this.shotsFired++;
  }
}

class Alien extends FlxSprite {
  #shotClock = 0;
  readonly #originalX: number;

  constructor(
    x: number,
    y: number,
    color: number,
    readonly bullets: FlxGroup<FlxSprite>,
  ) {
    super(x, y);
    this.loadGraphic(requireGraphic(ALIEN_ASSET), true);
    this.color = color;
    this.#originalX = x;
    this.#resetShotClock();
    this.addAnimation('Default', [0, 1, 0, 2], 6 + FlxG.random() * 4);
    this.play('Default');
    this.velocity.x = 10;
  }

  override update(): void {
    if (this.x < this.#originalX - 8) {
      this.x = this.#originalX - 8;
      this.velocity.x = -this.velocity.x;
      this.velocity.y += 1;
    }
    if (this.x > this.#originalX + 8) {
      this.x = this.#originalX + 8;
      this.velocity.x = -this.velocity.x;
    }

    if (this.y > FlxG.height * 0.35) this.#shotClock -= FlxG.elapsed;
    if (this.#shotClock <= 0) {
      this.#resetShotClock();
      const bullet = this.bullets.recycle();
      if (bullet !== null) {
        bullet.reset(this.x + this.width / 2 - bullet.width / 2, this.y);
        bullet.velocity.y = 65;
      }
    }
  }

  #resetShotClock(): void {
    this.#shotClock = 1 + FlxG.random() * 10;
  }
}

export class FlxInvadersState extends FlxState {
  player!: PlayerShip;
  playerBullets!: FlxGroup<FlxSprite>;
  aliens!: FlxGroup<Alien>;
  alienBullets!: FlxGroup<FlxSprite>;
  shields!: FlxGroup<FlxSprite>;
  status!: FlxText;

  override create(): void {
    super.create();
    if (FlxG.scores.length === 0) FlxG.scores[0] = 'WELCOME TO FLX INVADERS';

    this.playerBullets = this.#makeBulletPool(8);
    this.add(this.playerBullets);
    this.player = new PlayerShip(this.playerBullets);
    this.add(this.player);

    this.alienBullets = this.#makeBulletPool(32);
    this.add(this.alienBullets);
    this.aliens = new FlxGroup<Alien>(50);
    const colors = [
      FlxG.BLUE,
      FlxG.BLUE | FlxG.GREEN,
      FlxG.GREEN,
      FlxG.GREEN | FlxG.RED,
      FlxG.RED,
    ];
    for (let index = 0; index < 50; index += 1) {
      this.aliens.add(
        new Alien(
          8 + (index % 10) * 32,
          24 + Math.trunc(index / 10) * 32,
          colors[Math.trunc(index / 10)] ?? FlxG.WHITE,
          this.alienBullets,
        ),
      );
    }
    this.add(this.aliens);

    this.shields = new FlxGroup<FlxSprite>();
    for (let index = 0; index < 64; index += 1) {
      const shield = new FlxSprite(
        32 + 80 * Math.trunc(index / 16) + (index % 4) * 4,
        FlxG.height - 32 + Math.trunc((index % 16) / 4) * 4,
      );
      shield.active = false;
      shield.makeGraphic(4, 4);
      this.shields.add(shield);
    }
    this.add(this.shields);

    this.status = new FlxText(4, 4, FlxG.width - 8, String(FlxG.scores[0]));
    this.status.alignment = 'center';
    this.add(this.status);
  }

  override update(): void {
    FlxG.overlap(this.playerBullets, this.shields, killPair);
    FlxG.overlap(this.playerBullets, this.aliens, killPair);
    FlxG.overlap(this.alienBullets, this.shields, killPair);
    FlxG.overlap(this.alienBullets, this.player, killPair);
    super.update();

    if (!this.player.exists) {
      FlxG.scores[0] = 'YOU LOST';
      FlxG.resetState();
    } else if (this.aliens.getFirstExtant() === null) {
      FlxG.scores[0] = 'YOU WON';
      FlxG.resetState();
    }
  }

  #makeBulletPool(size: number): FlxGroup<FlxSprite> {
    const bullets = new FlxGroup<FlxSprite>(size);
    for (let index = 0; index < size; index += 1) {
      const bullet = new FlxSprite(-100, -100).makeGraphic(2, 8);
      bullet.exists = false;
      bullets.add(bullet);
    }
    return bullets;
  }
}

function killPair(first: FlxObject, second: FlxObject): void {
  first.kill();
  second.kill();
}
