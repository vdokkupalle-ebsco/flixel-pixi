import { FlxBackdrop, FlxG, FlxSprite, FlxState, FlxText } from 'flixel-pixi';

import {
  DINO_ATLAS,
  DINO_HEIGHT,
  DINO_WIDTH,
  FLOOR_Y,
  GAME_WIDTH,
} from './assets';

const ART_SCALE = 0.5;
const DINO_X = 52;
const DINO_GROUND_Y = 95;
const START_SPEED = 360;
const MAX_SPEED = 720;
const ACCELERATION = 3.6;
const CLEAR_RUNWAY_SECONDS = 3;
const RESTART_DELAY_SECONDS = 0.75;
const JUMP_VELOCITY = -720;
const RELEASE_VELOCITY = -300;
const GRAVITY = 2_160;
const DROP_GRAVITY = 6_480;
const DEATH_GRAVITY = 1_800;
const SCORE_COEFFICIENT = 0.025;
const GAP_COEFFICIENT = 0.6;
const MAX_GAP_COEFFICIENT = 1.5;
const DINO_PIVOT_X = DINO_WIDTH / 2;
const DINO_PIVOT_Y = DINO_HEIGHT / 2;
const DINO_PIVOT_SHIFT_X = DINO_PIVOT_X * (1 - ART_SCALE);
const DINO_PIVOT_SHIFT_Y = DINO_PIVOT_Y * (1 - ART_SCALE);
const DINO_DEATH_FLOOR_Y = DINO_GROUND_Y - DINO_PIVOT_SHIFT_Y;

type ObstacleKind = 'small' | 'large';

interface ObstacleSlot {
  followingSpawned: boolean;
  gap: number;
  sprite: FlxSprite;
}

export class DinoRunnerState extends FlxState {
  player!: FlxSprite;

  score = 0;
  highScore = 0;
  running = false;
  gameOver = false;

  #clouds: FlxSprite[] = [];
  #crashTime = 0;
  #deathAnimating = false;
  #deathAngle = 0;
  #distance = 0;
  #gameOverLabel!: FlxSprite;
  #ground!: FlxBackdrop;
  #messageText!: FlxText;
  #milestone = 0;
  #milestoneFlashTime = 0;
  #obstacles: ObstacleSlot[] = [];
  #restartIcon!: FlxSprite;
  #runTime = 0;
  #scoreGlyphs: FlxSprite[] = [];
  #speed = START_SPEED;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xffffffff;
    const atlas = FlxG.atlas.get(DINO_ATLAS);

    for (let index = 0; index < 3; index += 1) {
      const cloud = new FlxSprite(180 + index * 250, 35 + index * 16);
      cloud.loadGraphic(atlas.getFrame('cloud').texture);
      cloud.scale.make(ART_SCALE, ART_SCALE);
      cloud.origin.make(0, 0);
      cloud.width = 46;
      cloud.height = 14;
      this.#clouds.push(cloud);
      this.add(cloud);
    }

    this.#ground = new FlxBackdrop(
      atlas.getFrame('ground').texture,
      0,
      FLOOR_Y,
      GAME_WIDTH,
      9,
    );
    this.#ground.tileScale.make(ART_SCALE, ART_SCALE);
    this.#ground.repeatY = false;
    this.add(this.#ground);

    this.player = new FlxSprite(DINO_X, DINO_GROUND_Y);
    const frameSize = {
      frameHeight: DINO_HEIGHT,
      frameWidth: DINO_WIDTH,
    };
    this.player.addAnimation(
      'run',
      atlas.framesByPrefix('dino_run_', 1, 2),
      frameSize,
    );
    this.player.addAnimation('jump', [atlas.getFrame('dino_jump')], frameSize);
    this.player.addAnimation(
      'crashed',
      [atlas.getFrame('dino_crashed')],
      frameSize,
    );
    this.player.scale.make(ART_SCALE, ART_SCALE);
    this.player.origin.make(0, 0);
    this.player.width = 38;
    this.player.height = 40;
    this.player.offset.make(2, 2);
    this.player.play('jump');
    this.player.acceleration.y = GRAVITY;
    this.player.maxVelocity.y = 900;
    this.add(this.player);

    for (let index = 0; index < 3; index += 1) {
      const sprite = new FlxSprite();
      sprite.kill();
      this.#obstacles.push({ followingSpawned: false, gap: 0, sprite });
      this.add(sprite);
    }

    this.#createScoreDisplay();

    this.#messageText = new FlxText(
      60,
      52,
      GAME_WIDTH - 120,
      'PRESS SPACE, ↑, W, OR TAP TO START',
    );
    this.#messageText.setFormat(undefined, 13, 0xff53565a, 'center');
    this.#messageText.scrollFactor.make(0, 0);
    this.add(this.#messageText);

    this.#gameOverLabel = new FlxSprite(
      GAME_WIDTH / 2 - 191 / 2,
      48,
      atlas.getFrame('game_over').texture,
    );
    this.#gameOverLabel.scale.make(ART_SCALE, ART_SCALE);
    this.#gameOverLabel.origin.make(0, 0);
    this.#gameOverLabel.width = 191;
    this.#gameOverLabel.height = 11;
    this.#gameOverLabel.visible = false;
    this.#gameOverLabel.scrollFactor.make(0, 0);
    this.add(this.#gameOverLabel);

    this.#restartIcon = new FlxSprite(
      GAME_WIDTH / 2 - 18,
      78,
      atlas.getFrame('restart').texture,
    );
    this.#restartIcon.scale.make(ART_SCALE, ART_SCALE);
    this.#restartIcon.origin.make(0, 0);
    this.#restartIcon.width = 36;
    this.#restartIcon.height = 32;
    this.#restartIcon.visible = false;
    this.#restartIcon.scrollFactor.make(0, 0);
    this.add(this.#restartIcon);
  }

  override update(): void {
    const jumpPressed =
      FlxG.keys.justPressed('SPACE') ||
      FlxG.keys.justPressed('UP') ||
      FlxG.keys.justPressed('W') ||
      FlxG.mouse.justPressed();
    const jumpReleased =
      FlxG.keys.justReleased('SPACE') ||
      FlxG.keys.justReleased('UP') ||
      FlxG.keys.justReleased('W') ||
      FlxG.mouse.justReleased();
    const restartPressed = FlxG.keys.justPressed('ENTER');
    const dropPressed =
      FlxG.keys.justPressed('DOWN') || FlxG.keys.justPressed('S');
    const dropping = FlxG.keys.pressed('DOWN') || FlxG.keys.pressed('S');
    const grounded = this.player.y >= DINO_GROUND_Y - 0.5;

    if (this.gameOver) {
      this.#crashTime += FlxG.elapsed;
      if (
        restartPressed ||
        (jumpPressed && this.#crashTime >= RESTART_DELAY_SECONDS)
      ) {
        this.#restart();
      }
    } else if (jumpPressed) {
      if (!this.running) this.#startRun();
      if (grounded) this.#jump();
    }

    if (!this.gameOver) {
      if (this.running && !grounded) {
        if (jumpReleased && this.player.y < DINO_GROUND_Y - 35) {
          this.player.velocity.y = Math.max(
            this.player.velocity.y,
            RELEASE_VELOCITY,
          );
        }
        if (dropPressed) {
          this.player.velocity.y = Math.max(60, this.player.velocity.y);
        }
        this.player.acceleration.y = dropping ? DROP_GRAVITY : GRAVITY;
      } else {
        this.player.acceleration.y = GRAVITY;
      }
    }

    const worldSpeed = this.running ? this.#speed : 0;
    this.#ground.scrollVelocity.x = -worldSpeed;
    for (const cloud of this.#clouds) {
      cloud.velocity.x = -worldSpeed * 0.2;
    }
    for (const obstacle of this.#obstacles) {
      obstacle.sprite.velocity.x = obstacle.sprite.exists ? -worldSpeed : 0;
    }

    super.update();

    if (this.gameOver && this.#deathAnimating) {
      this.#updateDeathAnimation();
    } else if (!this.gameOver && this.player.y >= DINO_GROUND_Y) {
      this.player.y = DINO_GROUND_Y;
      this.player.velocity.y = 0;
      if (this.running && this.player.animationName !== 'run') {
        this.player.play('run', { loop: true, speed: 12 / 60 });
      }
    }

    this.#updateClouds();
    if (!this.running) return;

    this.#runTime += FlxG.elapsed;
    this.#distance += this.#speed * FlxG.elapsed;
    this.score = Math.floor(this.#distance * SCORE_COEFFICIENT);
    this.#speed = Math.min(
      MAX_SPEED,
      this.#speed + ACCELERATION * FlxG.elapsed,
    );

    if (this.#runTime >= CLEAR_RUNWAY_SECONDS) this.#updateObstacles();

    if (
      this.#obstacles.some(
        ({ sprite }) => sprite.exists && this.player.overlaps(sprite),
      )
    ) {
      this.#finishRun();
    }

    this.#updateScoreDisplay();
  }

  #jump(): void {
    this.player.velocity.y = JUMP_VELOCITY;
    this.player.play('jump');
  }

  #createScoreDisplay(): void {
    const atlas = FlxG.atlas.get(DINO_ATLAS);
    const frameSize = { frameHeight: 26, frameWidth: 20 };

    for (let index = 0; index < 12; index += 1) {
      const glyph = new FlxSprite();
      for (let digit = 0; digit <= 9; digit += 1) {
        glyph.addAnimation(
          String(digit),
          [atlas.getFrame(`font_${digit}`)],
          frameSize,
        );
      }
      glyph.addAnimation('h', [atlas.getFrame('font_h')], frameSize);
      glyph.addAnimation('i', [atlas.getFrame('font_i')], frameSize);
      glyph.scale.make(ART_SCALE, ART_SCALE);
      glyph.origin.make(0, 0);
      glyph.width = 10;
      glyph.height = 13;
      glyph.scrollFactor.make(0, 0);
      glyph.play('0');
      this.#scoreGlyphs.push(glyph);
      this.add(glyph);
    }

    this.#updateScoreDisplay();
  }

  #startRun(): void {
    this.running = true;
    this.#messageText.text = '';
    this.player.play('run', { loop: true, speed: 12 / 60 });
  }

  #updateClouds(): void {
    for (const cloud of this.#clouds) {
      if (cloud.x + cloud.width < 0) {
        const rightmost = Math.max(...this.#clouds.map((item) => item.x));
        cloud.x = rightmost + 100 + Math.random() * 300;
        cloud.y = 30 + Math.random() * 42;
      }
    }
  }

  #updateObstacles(): void {
    for (const obstacle of this.#obstacles) {
      if (
        obstacle.sprite.exists &&
        obstacle.sprite.x + obstacle.sprite.width < 0
      ) {
        obstacle.sprite.kill();
      }
    }

    const active = this.#obstacles
      .filter(({ sprite }) => sprite.exists)
      .sort((a, b) => a.sprite.x - b.sprite.x);
    const last = active.at(-1);

    if (!last) {
      this.#spawnObstacle();
    } else if (
      !last.followingSpawned &&
      last.sprite.x + last.sprite.width + last.gap < GAME_WIDTH
    ) {
      this.#spawnObstacle();
      last.followingSpawned = true;
    }
  }

  #spawnObstacle(): void {
    const slot = this.#obstacles.find(({ sprite }) => !sprite.exists);
    if (!slot) return;

    const atlas = FlxG.atlas.get(DINO_ATLAS);
    const kind: ObstacleKind = Math.random() < 0.5 ? 'small' : 'large';
    const normalizedSpeed = this.#speed / 60;
    const multipleSpeed = kind === 'small' ? 3 : 6;
    const maxCount = normalizedSpeed >= multipleSpeed ? 3 : 1;
    const count = 1 + Math.floor(Math.random() * maxCount);
    const unitWidth = kind === 'small' ? 17 : 25;
    const artHeight = kind === 'small' ? 35 : 50;
    const fullWidth = unitWidth * count;

    slot.sprite.loadGraphic(atlas.getFrame(`cactus_${kind}_${count}`).texture);
    slot.sprite.revive();
    slot.sprite.scale.make(ART_SCALE, ART_SCALE);
    slot.sprite.origin.make(0, 0);
    slot.sprite.x = GAME_WIDTH + 2;
    slot.sprite.y = (kind === 'small' ? 105 : 90) + 3;
    slot.sprite.width = Math.max(5, fullWidth - 4);
    slot.sprite.height = artHeight - 4;
    slot.sprite.offset.make(2, 3);
    slot.followingSpawned = false;

    const minGap = Math.round(
      fullWidth * normalizedSpeed + 120 * GAP_COEFFICIENT,
    );
    slot.gap = minGap + Math.random() * (minGap * MAX_GAP_COEFFICIENT - minGap);
  }

  #finishRun(): void {
    this.running = false;
    this.gameOver = true;
    this.#crashTime = 0;
    this.highScore = Math.max(this.highScore, this.score);
    this.player.play('crashed');
    this.#startDeathAnimation();
    this.#messageText.text = '';
    this.#gameOverLabel.visible = true;
    this.#restartIcon.visible = true;
    this.#updateScoreDisplay();
  }

  #startDeathAnimation(): void {
    const speedRatio = Math.max(
      0,
      Math.min(1, (this.#speed - START_SPEED) / (MAX_SPEED - START_SPEED)),
    );
    this.#deathAnimating = true;
    this.#deathAngle = 10 + speedRatio * 14;

    this.player.origin.make(DINO_PIVOT_X, DINO_PIVOT_Y);
    this.player.x -= DINO_PIVOT_SHIFT_X;
    this.player.y -= DINO_PIVOT_SHIFT_Y;
    this.player.velocity.x = 55 + speedRatio * 75;
    this.player.velocity.y = -(260 + speedRatio * 100);
    this.player.acceleration.y = DEATH_GRAVITY;
    this.player.angularVelocity = this.#deathAngle / 0.32;
  }

  #updateDeathAnimation(): void {
    if (this.player.angle >= this.#deathAngle) {
      this.player.angle = this.#deathAngle;
      this.player.angularVelocity = 0;
    }
    if (this.player.y >= DINO_DEATH_FLOOR_Y && this.player.velocity.y >= 0) {
      this.player.y = DINO_DEATH_FLOOR_Y;
      this.player.velocity.make(0, 0);
      this.player.acceleration.y = 0;
      this.player.angularVelocity = 0;
      this.#deathAnimating = false;
    }
  }

  #restart(): void {
    this.score = 0;
    this.#distance = 0;
    this.#runTime = 0;
    this.#speed = START_SPEED;
    this.#milestone = 0;
    this.#milestoneFlashTime = 0;
    this.running = true;
    this.gameOver = false;
    this.#deathAnimating = false;
    this.#deathAngle = 0;
    this.player.origin.make(0, 0);
    this.player.x = DINO_X;
    this.player.y = DINO_GROUND_Y;
    this.player.velocity.make(0, 0);
    this.player.acceleration.y = GRAVITY;
    this.player.angle = 0;
    this.player.angularVelocity = 0;
    this.player.play('run', { loop: true, speed: 12 / 60 });
    for (const obstacle of this.#obstacles) obstacle.sprite.kill();
    this.#messageText.text = '';
    this.#gameOverLabel.visible = false;
    this.#restartIcon.visible = false;
    this.#setScoreVisible(true);
    this.#updateScoreDisplay();
  }

  #updateScoreDisplay(): void {
    const milestone = Math.floor(this.score / 100);
    if (milestone > this.#milestone) {
      this.#milestone = milestone;
      this.#milestoneFlashTime = 1.5;
    }
    let scoreVisible = true;
    if (this.#milestoneFlashTime > 0) {
      this.#milestoneFlashTime -= FlxG.elapsed;
      scoreVisible = Math.floor(this.#milestoneFlashTime / 0.25) % 2 === 0;
    }

    const current = this.score.toString().padStart(5, '0').slice(-5);
    const best = this.highScore.toString().padStart(5, '0').slice(-5);
    const text = this.highScore > 0 ? `hi ${best} ${current}` : current;
    const totalWidth = [...text].reduce(
      (width, character) => width + (character === ' ' ? 8 : 11),
      0,
    );
    let x = GAME_WIDTH - 10 - totalWidth;
    let glyphIndex = 0;

    for (const character of text) {
      if (character === ' ') {
        x += 8;
        continue;
      }
      const glyph = this.#scoreGlyphs[glyphIndex];
      if (!glyph) break;
      glyph.x = Math.round(x);
      glyph.y = 8;
      glyph.visible = scoreVisible;
      if (glyph.animationName !== character) glyph.play(character);
      x += 11;
      glyphIndex += 1;
    }

    for (; glyphIndex < this.#scoreGlyphs.length; glyphIndex += 1) {
      this.#scoreGlyphs[glyphIndex]!.visible = false;
    }
  }

  #setScoreVisible(visible: boolean): void {
    for (const glyph of this.#scoreGlyphs) glyph.visible = visible;
  }
}
