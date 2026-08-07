/**
 * External port target: minimal mechanics inspired by Adam Saltsman's Mode
 * (Flixel demo, MIT). Original Flash assets are NOT copied — procedural
 * graphics only. See docs/phase12-external-gap.md.
 */
import {
  FlxButton,
  FlxG,
  FlxGroup,
  FlxSprite,
  FlxState,
  FlxText,
} from '../../../src';

class Enemy extends FlxSprite {
  constructor() {
    super(0, 0);
    this.makeGraphic(18, 18, 0xffef4444);
    this.exists = false;
  }

  spawn(x: number, y: number, vx: number): void {
    this.reset(x, y);
    this.velocity.x = vx;
    this.velocity.y = 0;
    this.health = 1;
  }
}

class Bullet extends FlxSprite {
  constructor() {
    super(-100, -100);
    this.makeGraphic(6, 6, 0xfffbbf24);
    this.exists = false;
  }

  fire(x: number, y: number, vx: number): void {
    this.reset(x, y);
    this.velocity.x = vx;
    this.velocity.y = 0;
  }
}

export class ModeMenuState extends FlxState {
  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff0c0a09;

    const title = new FlxText(40, 140, 560, 'EXTERNAL — MODE LITE');
    title.setFormat(undefined, 24, 0xfff97316, 'center');
    this.add(title);

    const start = new FlxButton(270, 240, 'START', () => {
      FlxG.switchState(new ModePlayState());
    });
    this.add(start);

    const hint = new FlxText(
      40,
      300,
      560,
      'Educational port of Mode-like combat (MIT Flixel demo mechanics).\nArrows move · Z shoot',
    );
    hint.setFormat(undefined, 12, 0xffa8a29e, 'center');
    this.add(hint);
  }
}

export class ModePlayState extends FlxState {
  player!: FlxSprite;
  enemies!: FlxGroup<Enemy>;
  bullets!: Bullet[];
  hud!: FlxText;
  score = 0;
  spawnTimer = 0;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff1c1917;

    FlxG.actions.bind('shoot', 'Z');

    this.player = new FlxSprite(80, 220);
    this.player.makeGraphic(20, 28, 0xff38bdf8);
    this.player.maxVelocity.x = 200;
    this.player.maxVelocity.y = 200;
    this.player.drag.x = 1200;
    this.player.drag.y = 1200;
    this.add(this.player);

    this.enemies = new FlxGroup<Enemy>(16);
    for (let i = 0; i < 16; i += 1) {
      this.enemies.add(new Enemy());
    }
    this.add(this.enemies);

    this.bullets = [];
    for (let i = 0; i < 12; i += 1) {
      const b = new Bullet();
      this.bullets.push(b);
      this.add(b);
    }

    this.hud = new FlxText(8, 6, 400, 'score 0');
    this.hud.setFormat(undefined, 13, 0xfffafaf9, 'left');
    this.add(this.hud);
  }

  #fire(): void {
    const bullet = this.bullets.find((b) => !b.exists);
    if (!bullet) return;
    bullet.fire(
      this.player.x + this.player.width,
      this.player.y + this.player.height / 2,
      360,
    );
  }

  #spawnEnemy(): void {
    const enemy = this.enemies.recycle(Enemy);
    if (enemy) {
      enemy.spawn(
        FlxG.width + 10,
        40 + Math.floor(FlxG.random() * (FlxG.height - 80)),
        -80 - FlxG.random() * 60,
      );
    }
  }

  override update(): void {
    this.player.acceleration.x = 0;
    this.player.acceleration.y = 0;
    if (FlxG.keys.pressed('LEFT')) this.player.acceleration.x = -1000;
    if (FlxG.keys.pressed('RIGHT')) this.player.acceleration.x = 1000;
    if (FlxG.keys.pressed('UP')) this.player.acceleration.y = -1000;
    if (FlxG.keys.pressed('DOWN')) this.player.acceleration.y = 1000;
    if (FlxG.actions.justPressed('shoot')) this.#fire();

    if (this.player.x < 0) this.player.x = 0;
    if (this.player.y < 0) this.player.y = 0;
    if (this.player.x > FlxG.width - this.player.width) {
      this.player.x = FlxG.width - this.player.width;
    }
    if (this.player.y > FlxG.height - this.player.height) {
      this.player.y = FlxG.height - this.player.height;
    }

    this.spawnTimer += FlxG.elapsed;
    if (this.spawnTimer > 0.9) {
      this.spawnTimer = 0;
      this.#spawnEnemy();
    }

    for (const bullet of this.bullets) {
      if (!bullet.exists) continue;
      if (bullet.x > FlxG.width + 20) bullet.kill();
      for (const enemy of this.enemies.members) {
        if (!enemy || !enemy.exists) continue;
        if (bullet.overlaps(enemy)) {
          bullet.kill();
          enemy.kill();
          this.score += 10;
        }
      }
    }

    for (const enemy of this.enemies.members) {
      if (!enemy || !enemy.exists) continue;
      if (enemy.x < -40) enemy.kill();
      if (enemy.overlaps(this.player)) {
        this.hud.text = `GAME OVER — score ${this.score} · Esc menu`;
        if (FlxG.keys.justPressed('ESCAPE')) {
          FlxG.switchState(new ModeMenuState());
        }
        super.update();
        return;
      }
    }

    this.hud.text = `score ${this.score} · Esc menu`;
    if (FlxG.keys.justPressed('ESCAPE')) {
      FlxG.switchState(new ModeMenuState());
    }

    super.update();
  }
}
