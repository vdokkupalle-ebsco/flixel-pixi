/**
 * Kenney-art Mode-lite platformer. Jump feel helpers inspired by
 * the procedural platformer sample (coyote, buffer, early fall, apex).
 */
import { Texture } from 'pixi.js';

import {
  FlxCamera,
  FlxEmitter,
  FlxG,
  FlxGamepadButton,
  FlxGroup,
  FlxObject,
  FlxSave,
  FlxSprite,
  FlxState,
  FlxText,
  FlxTilemap,
  LocalStorageBackend,
} from '../../../src';
import { playKenneySfx } from './audio';
import {
  COIN_SPOTS,
  FLAG_SPOT,
  FLY_SPOTS,
  MAP_H,
  MAP_W,
  PLAYER_SPAWN,
  SLIME_SPOTS,
  SPRING_SPOTS,
  TILE,
  makeMapData,
} from './level';

import bgUrl from './assets/backgrounds/blue_grass.png';
import enemiesPngUrl from './assets/spritesheet_enemies.png';
import enemiesXmlUrl from './assets/spritesheet_enemies.xml?raw';
import groundPngUrl from './assets/spritesheet_ground.png';
import groundXmlUrl from './assets/spritesheet_ground.xml?raw';
import itemsPngUrl from './assets/spritesheet_items.png';
import itemsXmlUrl from './assets/spritesheet_items.xml?raw';
import playerPngUrl from './assets/spritesheet_players.png';
import playerXmlUrl from './assets/spritesheet_players.xml?raw';

const JUMP_VELOCITY = -560;
const GRAVITY = 1300;
const APEX_GRAVITY = 650;
const APEX_SPEED = 90;
const MAX_FALL = 560;
const MOVE_ACCEL = 900;
const AIR_ACCEL = 700;
const APEX_TURN_ACCEL = 1600;
const MAX_RUN = 190;
const GROUND_DRAG = 1200;
const COYOTE_TIME = 8 / 60;
const JUMP_BUFFER = 7 / 60;
const INVULN_TIME = 1.5;
/** Display size for Kenney 128×256 player frames (half scale vs tiles). */
const PLAYER_FRAME_W = 64;
const PLAYER_FRAME_H = 128;
/** Tight hitbox inside the scaled frame (feet near bottom). */
const PLAYER_HIT_W = 24;
const PLAYER_HIT_H = 52;
/** Walk cycle rate relative to update framerate (~10 fps). */
const WALK_ANIM_SPEED = 10 / 60;
/** Horizontal parallax rate vs camera scroll (0 = locked to screen, 1 = world). */
const BG_PARALLAX = 0.22;
const BG_WIDTH = 1024;
const BG_COPIES = 3;

export interface KenneyAssets {
  background: Texture;
  tiles: Texture;
  coin: Texture;
  flag: Texture;
  slime: Texture;
  fly: Texture;
  star: Texture;
}

let preloadedAssets: KenneyAssets | null = null;

export async function preloadKenneyAssets(): Promise<KenneyAssets> {
  if (preloadedAssets) return preloadedAssets;

  const bgImg = new Image();
  bgImg.src = bgUrl;
  await bgImg.decode();

  await Promise.all([
    FlxG.atlas.load('ground', groundPngUrl, groundXmlUrl),
    FlxG.atlas.load('player', playerPngUrl, playerXmlUrl),
    FlxG.atlas.load('items', itemsPngUrl, itemsXmlUrl),
    FlxG.atlas.load('enemies', enemiesPngUrl, enemiesXmlUrl),
  ]);

  const ground = FlxG.atlas.get('ground');
  const items = FlxG.atlas.get('items');
  const enemies = FlxG.atlas.get('enemies');

  preloadedAssets = {
    background: Texture.from(bgImg),
    tiles: ground.makeGraphic(
      [
        null,
        ground.getFrame('grassMid'),
        ground.getFrame('grassLeft'),
        ground.getFrame('grassRight'),
        ground.getFrame('grassCenter'),
        ground.getFrame('grassHalf'),
      ],
      TILE,
      TILE,
    ),
    coin: items.makeGraphic([items.getFrame('coinGold')], 32, 32),
    flag: items.makeGraphic(
      [items.getFrame('flagGreen1'), items.getFrame('flagGreen2')],
      64,
      64,
    ),
    slime: enemies.makeGraphic(
      [enemies.getFrame('slimeGreen'), enemies.getFrame('slimeGreen_move')],
      64,
      64,
    ),
    fly: enemies.makeGraphic(
      [enemies.getFrame('fly'), enemies.getFrame('fly_move')],
      64,
      64,
    ),
    star: items.makeGraphic([items.getFrame('star')], 32, 32),
  };
  return preloadedAssets;
}

function requireAssets(): KenneyAssets {
  if (!preloadedAssets) {
    throw new Error('Call preloadKenneyAssets() before booting the game');
  }
  return preloadedAssets;
}

class Slime extends FlxSprite {
  leftBound = 0;
  rightBound = 0;

  spawn(x: number, y: number, left: number, right: number, tex: Texture): void {
    this.loadGraphic(tex, true, true, 64, 64);
    this.width = 40;
    this.height = 32;
    this.offset.make(12, 32);
    this.acceleration.y = GRAVITY;
    this.maxVelocity.y = MAX_FALL;
    this.addAnimation('move', [0, 1], 6, true);
    this.play('move', { loop: true, speed: 6 / 60 });
    this.reset(x, y);
    this.leftBound = left;
    this.rightBound = right;
    this.velocity.x = 60;
  }

  override update(): void {
    if (
      this.x < this.leftBound ||
      (this.wasTouching & FlxObject.LEFT) !== 0 ||
      this.isTouching(FlxObject.LEFT)
    ) {
      this.velocity.x = 60;
    } else if (
      this.x > this.rightBound ||
      (this.wasTouching & FlxObject.RIGHT) !== 0 ||
      this.isTouching(FlxObject.RIGHT)
    ) {
      this.velocity.x = -60;
    }

    if (this.velocity.x < 0) this.facing = FlxObject.RIGHT;
    else if (this.velocity.x > 0) this.facing = FlxObject.LEFT;

    super.update();
  }
}

class Fly extends FlxSprite {
  homeY = 0;
  amp = 40;
  t = 0;

  spawn(x: number, y: number, amp: number, tex: Texture): void {
    this.loadGraphic(tex, true, true, 64, 64);
    this.width = 40;
    this.height = 28;
    this.offset.make(12, 18);
    this.addAnimation('fly', [0, 1], 8, true);
    this.play('fly', { loop: true, speed: 8 / 60 });
    this.reset(x, y);
    this.homeY = y;
    this.amp = amp;
    this.t = Math.random() * Math.PI * 2;
  }

  override update(): void {
    this.t += FlxG.elapsed * 2;
    this.y = this.homeY + Math.sin(this.t) * this.amp;
    this.velocity.x = 0;
    this.velocity.y = 0;
    super.update();
  }
}

class Spring extends FlxSprite {
  spawn(x: number, y: number, tex: Texture): void {
    this.loadGraphic(tex);
    this.width = 32;
    this.height = 32;
    this.reset(x, y);
  }
}

/** Side-view Kenney platformer with Paragon-style jump helpers. */
export class KenneyPlayState extends FlxState {
  map!: FlxTilemap;
  player!: FlxSprite;
  coins!: FlxGroup<FlxSprite>;
  slimes!: FlxGroup<Slime>;
  flies!: FlxGroup<Fly>;
  springs!: FlxGroup<Spring>;
  flag!: FlxSprite;
  hudText!: FlxText;
  #bgLayers: FlxSprite[] = [];

  coinEmitter!: FlxEmitter;
  stompEmitter!: FlxEmitter;
  springEmitter!: FlxEmitter;
  hurtEmitter!: FlxEmitter;

  status: 'play' | 'won' | 'lost' = 'play';
  lives = 3;
  coinsCollected = 0;
  score = 0;
  highScore = 0;

  #spawnX = PLAYER_SPAWN.tx * TILE;
  #spawnY = PLAYER_SPAWN.ty * TILE - PLAYER_HIT_H;
  #coyote = 0;
  #jumpBuffer = 0;
  #jumpHeld = false;
  #touchedGroundSinceJump = true;
  #wasGrounded = false;
  #framesGoingDown = 0;
  #invuln = 0;

  override create(): void {
    super.create();
    const assets = requireAssets();

    // Persistent High Score
    const save = new FlxSave();
    save.bind('kenney_platformer', { backend: new LocalStorageBackend() });
    if (typeof save.data?.highScore === 'number') {
      this.highScore = save.data.highScore as number;
    }
    save.close();

    FlxG.worldBounds.make(0, 0, MAP_W * TILE, MAP_H * TILE);
    FlxG.camera.bgColor = 0xff87ceeb;

    // Seamless parallax: screen-space tiles that wrap as the camera scrolls.
    this.#bgLayers = [];
    for (let i = 0; i < BG_COPIES; i += 1) {
      const bg = new FlxSprite(i * BG_WIDTH, 0);
      bg.loadGraphic(assets.background);
      bg.scrollFactor.make(0, 0);
      bg.moves = false;
      bg.solid = false;
      this.#bgLayers.push(bg);
      this.add(bg);
    }
    this.#wrapBackgrounds();

    this.map = new FlxTilemap().loadMapData(
      makeMapData(),
      MAP_W,
      assets.tiles,
      {
        tileWidth: TILE,
        tileHeight: TILE,
        collideIndex: 1,
      },
    );
    this.add(this.map);

    this.#spawnX = PLAYER_SPAWN.tx * TILE;
    this.#spawnY = PLAYER_SPAWN.ty * TILE - PLAYER_HIT_H;
    this.player = new FlxSprite(this.#spawnX, this.#spawnY);
    const playerAtlas = FlxG.atlas.get('player');
    const playerFrameSize = {
      frameWidth: PLAYER_FRAME_W,
      frameHeight: PLAYER_FRAME_H,
    };
    this.player.addAnimation(
      'idle',
      [playerAtlas.getFrame('alienBlue_stand')],
      playerFrameSize,
    );
    this.player.addAnimation(
      'walk',
      playerAtlas.framesByPrefix('alienBlue_walk', 1, 2),
      playerFrameSize,
    );
    this.player.addAnimation(
      'jump',
      [playerAtlas.getFrame('alienBlue_jump')],
      playerFrameSize,
    );
    this.player.addAnimation(
      'hit',
      [playerAtlas.getFrame('alienBlue_hit')],
      playerFrameSize,
    );
    this.player.width = PLAYER_HIT_W;
    this.player.height = PLAYER_HIT_H;
    this.player.offset.make(
      (PLAYER_FRAME_W - PLAYER_HIT_W) / 2,
      PLAYER_FRAME_H - PLAYER_HIT_H,
    );
    this.player.maxVelocity.x = MAX_RUN;
    this.player.maxVelocity.y = MAX_FALL;
    this.player.drag.x = GROUND_DRAG;
    this.player.play('idle', { loop: true });
    this.add(this.player);

    this.coins = new FlxGroup<FlxSprite>();
    for (const [tx, ty] of COIN_SPOTS) {
      const coin = new FlxSprite(tx * TILE + 16, ty * TILE + 16);
      coin.loadGraphic(assets.coin);
      this.coins.add(coin);
    }
    this.add(this.coins);

    this.springs = new FlxGroup<Spring>();
    for (const [tx, ty] of SPRING_SPOTS) {
      const spring = new Spring();
      spring.spawn(tx * TILE + 16, ty * TILE + 32, assets.star);
      this.springs.add(spring);
    }
    this.add(this.springs);

    this.slimes = new FlxGroup<Slime>();
    for (const spot of SLIME_SPOTS) {
      const slime = new Slime();
      slime.spawn(
        spot.tx * TILE,
        spot.ty * TILE - 32,
        spot.left,
        spot.right,
        assets.slime,
      );
      this.slimes.add(slime);
    }
    this.add(this.slimes);

    this.flies = new FlxGroup<Fly>();
    for (const spot of FLY_SPOTS) {
      const fly = new Fly();
      fly.spawn(spot.tx * TILE, spot.ty * TILE, spot.amp, assets.fly);
      this.flies.add(fly);
    }
    this.add(this.flies);

    this.flag = new FlxSprite(FLAG_SPOT.tx * TILE, FLAG_SPOT.ty * TILE - 32);
    this.flag.loadGraphic(assets.flag, true, false, 64, 64);
    this.flag.addAnimation('wave', [0, 1], 6, true);
    this.flag.play('wave', { loop: true, speed: 6 / 60 });
    this.add(this.flag);

    // Emitters
    this.coinEmitter = new FlxEmitter(0, 0, 15);
    this.coinEmitter.makeParticles(assets.coin, 15);
    this.coinEmitter.setXSpeed(-60, 60);
    this.coinEmitter.setYSpeed(-120, -30);
    this.coinEmitter.gravity = 300;
    this.add(this.coinEmitter);

    this.stompEmitter = new FlxEmitter(0, 0, 20);
    this.stompEmitter.makeParticles(assets.slime, 20);
    this.stompEmitter.setXSpeed(-100, 100);
    this.stompEmitter.setYSpeed(-150, -40);
    this.stompEmitter.gravity = 400;
    this.add(this.stompEmitter);

    this.springEmitter = new FlxEmitter(0, 0, 15);
    this.springEmitter.makeParticles(assets.star, 15);
    this.springEmitter.setXSpeed(-80, 80);
    this.springEmitter.setYSpeed(-200, -80);
    this.springEmitter.gravity = 250;
    this.add(this.springEmitter);

    this.hurtEmitter = new FlxEmitter(0, 0, 15);
    this.hurtEmitter.makeParticles(assets.coin, 15);
    this.hurtEmitter.setXSpeed(-90, 90);
    this.hurtEmitter.setYSpeed(-140, -40);
    this.hurtEmitter.gravity = 350;
    this.add(this.hurtEmitter);

    this.hudText = new FlxText(8, 6, 624, '');
    this.hudText.setFormat(undefined, 13, 0xff0f172a, 'left');
    this.hudText.scrollFactor.make(0, 0);
    this.add(this.hudText);

    const credit = new FlxText(
      8,
      460,
      624,
      'Art: Kenney.nl (CC0) · ←→ / stick move · SPACE / A jump',
    );
    credit.setFormat(undefined, 11, 0xff334155, 'left');
    credit.scrollFactor.make(0, 0);
    this.add(credit);

    FlxG.actions.bindSources(
      'move-x',
      { device: 'keyboard-axis', negative: 'LEFT', positive: 'RIGHT' },
      { device: 'keyboard-axis', negative: 'A', positive: 'D' },
      { axis: 0, device: 'gamepad-axis' },
      {
        device: 'gamepad-button-axis',
        negative: FlxGamepadButton.DPAD_LEFT,
        positive: FlxGamepadButton.DPAD_RIGHT,
      },
    );
    FlxG.actions.bindSources(
      'jump',
      { device: 'keyboard', key: 'SPACE' },
      { device: 'keyboard', key: 'W' },
      { device: 'keyboard', key: 'UP' },
      { button: FlxGamepadButton.A, device: 'gamepad-button' },
    );
    FlxG.actions.bindSources(
      'restart',
      { device: 'keyboard', key: 'R' },
      { button: FlxGamepadButton.A, device: 'gamepad-button' },
      { button: FlxGamepadButton.START, device: 'gamepad-button' },
    );
    FlxG.camera.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    FlxG.camera.follow(this.player, FlxCamera.STYLE_PLATFORMER);
    this.map.follow(FlxG.camera, 0, true);
    this.#updateHud();
  }

  override update(): void {
    this.#wrapBackgrounds();

    if (this.status !== 'play') {
      if (FlxG.actions.justPressed('restart')) {
        FlxG.switchState(new KenneyPlayState());
      }
      this.#updateHud();
      super.update();
      return;
    }

    const dt = FlxG.elapsed;
    const grounded =
      (this.player.wasTouching & FlxObject.FLOOR) !== 0 ||
      this.player.isTouching(FlxObject.FLOOR);
    const atApex = !grounded && Math.abs(this.player.velocity.y) < APEX_SPEED;

    if (this.#invuln > 0) {
      this.#invuln = Math.max(0, this.#invuln - dt);
      this.player.alpha = Math.floor(this.#invuln * 10) % 2 === 0 ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }

    if (grounded) {
      this.#coyote = COYOTE_TIME;
      this.#touchedGroundSinceJump = true;
      this.#framesGoingDown = 0;
      this.#spawnX = this.player.x;
      this.#spawnY = this.player.y;
    } else {
      this.#coyote = Math.max(0, this.#coyote - dt);
      if (this.player.velocity.y > 0) this.#framesGoingDown += 1;
      else this.#framesGoingDown = 0;
    }

    if (FlxG.actions.justPressed('jump')) {
      this.#jumpBuffer = JUMP_BUFFER;
    } else {
      this.#jumpBuffer = Math.max(0, this.#jumpBuffer - dt);
    }

    this.player.acceleration.x = 0;
    const moveX = FlxG.actions.value('move-x');
    const left = moveX < 0;
    const right = moveX > 0;
    const accel = grounded ? MOVE_ACCEL : atApex ? APEX_TURN_ACCEL : AIR_ACCEL;
    this.player.acceleration.x = moveX * accel;
    this.player.drag.x = grounded && !left && !right ? GROUND_DRAG : 0;

    if (left && !right) this.player.facing = FlxObject.LEFT;
    else if (right && !left) this.player.facing = FlxObject.RIGHT;

    if (grounded && !this.#wasGrounded) {
      if (left && this.player.velocity.x > 0) this.player.velocity.x = -MAX_RUN;
      else if (right && this.player.velocity.x < 0) {
        this.player.velocity.x = MAX_RUN;
      }
    }

    this.player.acceleration.y = atApex ? APEX_GRAVITY : GRAVITY;

    if (
      this.#jumpHeld &&
      FlxG.actions.justReleased('jump') &&
      !grounded &&
      this.player.velocity.y < 0
    ) {
      this.player.velocity.y = 0;
      this.#jumpHeld = false;
    }

    const canJump =
      this.#touchedGroundSinceJump && (grounded || this.#coyote > 0);
    const buffered =
      this.#jumpBuffer > 0 &&
      (grounded || this.#framesGoingDown > 2 || this.#coyote > 0);

    if (canJump && buffered) {
      this.player.velocity.y = JUMP_VELOCITY;
      this.#jumpHeld = true;
      this.#jumpBuffer = 0;
      this.#coyote = 0;
      this.#touchedGroundSinceJump = false;
      playKenneySfx('jump');
    }

    if (this.player.velocity.y >= 0) this.#jumpHeld = false;

    this.#syncPlayerAnim(grounded, left || right);

    super.update();
    FlxG.collide(this.player, this.map);
    FlxG.collide(this.slimes, this.map);

    if (this.player.velocity.y > MAX_FALL) {
      this.player.velocity.y = MAX_FALL;
    }

    // Coin collection
    for (const member of this.coins.members) {
      if (member === null || !member.exists) continue;
      if (this.player.overlaps(member)) {
        member.kill();
        this.coinsCollected += 1;
        this.score += 50;
        playKenneySfx('coin');
        this.coinEmitter.x = member.x + 16;
        this.coinEmitter.y = member.y + 16;
        this.coinEmitter.start(true, 0.5, 0, 8);
      }
    }

    // Spring Pads
    for (const spring of this.springs.members) {
      if (spring !== null && spring.exists && this.player.overlaps(spring)) {
        this.player.velocity.y = -750;
        this.player.y = spring.y - PLAYER_HIT_H;
        this.#jumpHeld = true;
        this.#touchedGroundSinceJump = true;
        playKenneySfx('jump');
        this.springEmitter.x = spring.x + 16;
        this.springEmitter.y = spring.y + 16;
        this.springEmitter.start(true, 0.5, 0, 10);
      }
    }

    // Slimes stomping vs damage
    if (this.#invuln <= 0 && this.status === 'play') {
      for (const slime of this.slimes.members) {
        if (slime !== null && slime.exists && this.player.overlaps(slime)) {
          const playerBottom = this.player.last.y + this.player.height;
          const slimeMidY = slime.y + 16;
          if (this.player.velocity.y > 0 && playerBottom <= slimeMidY) {
            slime.kill();
            this.score += 100;
            this.player.velocity.y = -400;
            this.#jumpHeld = true;
            this.#touchedGroundSinceJump = true;
            playKenneySfx('stomp');
            this.stompEmitter.x = slime.x + 20;
            this.stompEmitter.y = slime.y + 16;
            this.stompEmitter.start(true, 0.5, 0, 10);
          } else {
            this.#takeDamage(false, slime.x + slime.width * 0.5);
            break;
          }
        }
      }
    }

    // Flying pests stomping vs damage
    if (this.#invuln <= 0 && this.status === 'play') {
      for (const fly of this.flies.members) {
        if (fly !== null && fly.exists && this.player.overlaps(fly)) {
          const playerBottom = this.player.last.y + this.player.height;
          const flyMidY = fly.y + 14;
          if (this.player.velocity.y > 0 && playerBottom <= flyMidY) {
            fly.kill();
            this.score += 150;
            this.player.velocity.y = -450;
            this.#jumpHeld = true;
            this.#touchedGroundSinceJump = true;
            playKenneySfx('stomp');
            this.stompEmitter.x = fly.x + 20;
            this.stompEmitter.y = fly.y + 14;
            this.stompEmitter.start(true, 0.5, 0, 10);
          } else {
            this.#takeDamage(false, fly.x + fly.width * 0.5);
            break;
          }
        }
      }
    }

    // Flag Victory
    if (
      this.status === 'play' &&
      this.flag.exists &&
      this.player.overlaps(this.flag)
    ) {
      this.status = 'won';
      playKenneySfx('win');
      this.#saveHighScore();
    }

    // Pit fall check
    const viewBottom = FlxG.camera.scroll.y + FlxG.camera.height;
    if (this.player.y > viewBottom + 32 || this.player.y > MAP_H * TILE + 32) {
      this.#takeDamage(true);
    }

    this.#wasGrounded = (this.player.touching & FlxObject.FLOOR) !== 0;
    this.#updateHud();
  }

  #wrapBackgrounds(): void {
    const scroll = FlxG.camera.scroll.x * BG_PARALLAX;
    const wrapped = ((scroll % BG_WIDTH) + BG_WIDTH) % BG_WIDTH;
    for (let i = 0; i < this.#bgLayers.length; i += 1) {
      const layer = this.#bgLayers[i];
      if (!layer) continue;
      layer.x = -wrapped + i * BG_WIDTH;
      layer.y = 0;
    }
  }

  #syncPlayerAnim(grounded: boolean, moving: boolean): void {
    if (this.#invuln > 0.9) {
      this.player.play('hit', { loop: false });
      return;
    }
    if (!grounded) {
      this.player.play('jump', { loop: false });
      return;
    }
    if (moving) {
      this.player.play('walk', { loop: true, speed: WALK_ANIM_SPEED });
      return;
    }
    this.player.play('idle', { loop: true });
  }

  #takeDamage(fromPit: boolean, sourceX?: number): void {
    if (this.status !== 'play') return;
    if (this.#invuln > 0 && !fromPit) return;

    this.lives -= 1;
    this.#invuln = INVULN_TIME;
    this.player.play('hit', true);

    // Screen Shake & Hurt Particles
    FlxG.camera.shake(0.015, 0.25);
    if (this.hurtEmitter) {
      this.hurtEmitter.x = this.player.x + PLAYER_HIT_W * 0.5;
      this.hurtEmitter.y = this.player.y + PLAYER_HIT_H * 0.5;
      this.hurtEmitter.start(true, 0.5, 0, 10);
    }

    if (this.lives <= 0) {
      this.status = 'lost';
      playKenneySfx('hurt');
      this.player.velocity.make(0, 0);
      this.player.acceleration.make(0, 0);
      this.#saveHighScore();
      return;
    }

    playKenneySfx(fromPit ? 'respawn' : 'hurt');

    if (fromPit) {
      this.player.reset(this.#spawnX, this.#spawnY);
      this.player.velocity.make(0, 0);
      this.player.acceleration.make(0, 0);
    } else {
      // Recoil jump / knockback away from enemy!
      const knockDir =
        sourceX !== undefined && this.player.x < sourceX ? -1 : 1;
      this.player.velocity.y = -320;
      this.player.velocity.x = knockDir * 240;
    }

    this.#coyote = 0;
    this.#jumpBuffer = 0;
    this.#jumpHeld = false;
    this.#touchedGroundSinceJump = true;
    this.#wasGrounded = false;
    this.#framesGoingDown = 0;
  }

  #saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      const save = new FlxSave();
      save.bind('kenney_platformer', { backend: new LocalStorageBackend() });
      if (!save.data) save.data = {};
      save.data.highScore = this.highScore;
      save.flush();
      save.close();
    }
  }

  #updateHud(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    let statusMsg = '';
    if (this.status === 'won') {
      statusMsg = ` · 🎉 WIN! Score: ${this.score} (Press 'R' to Restart)`;
    } else if (this.status === 'lost') {
      statusMsg = ` · 💀 GAME OVER! Score: ${this.score} (Press 'R' to Restart)`;
    }
    this.hudText.text = `LIVES: ${'❤️'.repeat(Math.max(0, this.lives))} | COINS: ${this.coinsCollected} | SCORE: ${this.score} | BEST: ${this.highScore}${statusMsg}`;
  }
}
