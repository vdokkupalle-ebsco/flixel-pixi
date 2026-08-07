/**
 * Platformer sample with jump feel helpers inspired by
 * https://github.com/DavidStrachan/GM-Perfect-Platforming-Paragon
 * and https://www.davetech.co.uk/gamedevplatformer
 *
 * Helpers used: coyote time, jump buffering, early fall (variable height),
 * anti-gravity apex, clamp fall speed, speedy apex air control, sticky feet.
 */
import {
  FlxCamera,
  FlxG,
  FlxGraphic,
  FlxGroup,
  FlxObject,
  FlxSprite,
  FlxState,
  FlxText,
  FlxTilemap,
  makeGraphicPixels,
} from '../../../src';

const TILE = 16;
const MAP_W = 120;
const MAP_H = 22;

// Full hold clears ~5 tiles (≈80px); ledges step by ≤3 tiles vertically.
const JUMP_VELOCITY = -460;
const GRAVITY = 1300;
/** Softer gravity near the apex (anti-gravity apex). */
const APEX_GRAVITY = 650;
const APEX_SPEED = 90;
const MAX_FALL = 520;
const MOVE_ACCEL = 900;
const AIR_ACCEL = 700;
/** Extra horizontal accel at apex for quicker turnaround (speedy apex). */
const APEX_TURN_ACCEL = 1600;
const MAX_RUN = 190;
const GROUND_DRAG = 1200;
/** ~8 frames @ 60fps (Paragon coyote_jump). */
const COYOTE_TIME = 8 / 60;
/** ~7 frames @ 60fps (Paragon jump_buffering). */
const JUMP_BUFFER = 7 / 60;

const FLOOR = MAP_H - 2;

/** Floating coin positions in tile coords (x, y) — mid-air along the course. */
const COIN_SPOTS: [number, number][] = [
  [14, FLOOR - 5],
  [20, FLOOR - 4], // over pit 1
  [27, FLOOR - 6],
  [33, FLOOR - 7],
  [40, FLOOR - 5],
  [46, FLOOR - 4], // over pit 2
  [55, FLOOR - 6],
  [60, FLOOR - 7],
  [69, FLOOR - 5],
  [81, FLOOR - 4], // over pit 3
  [94, FLOOR - 6],
  [108, FLOOR - 5],
  [115, FLOOR - 7],
];

const COIN_YELLOW = 0xffff00ff;
const COIN_YELLOW_EDGE = 0xe6c200ff;

function createSynthBlip(
  ctx: AudioContext,
  kind: 'coin' | 'jump' | 'respawn',
): AudioBuffer {
  // Jump is short + bright so it cuts through laptop speakers (low bass is easy to miss).
  const duration = kind === 'jump' ? 0.14 : kind === 'respawn' ? 0.28 : 0.2;
  const buffer = ctx.createBuffer(
    1,
    Math.floor(ctx.sampleRate * duration),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const t = i / ctx.sampleRate;
    let sample = 0;
    if (kind === 'coin') {
      const freq = t < 0.08 ? 987.77 : 1318.51;
      sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 14) * 0.45;
    } else if (kind === 'jump') {
      // Proper linear chirp (integrate frequency) + square mix for punch
      const f0 = 420;
      const f1 = 980;
      const phase =
        2 * Math.PI * (f0 * t + ((f1 - f0) / (2 * duration)) * t * t);
      const sine = Math.sin(phase);
      const square = Math.sign(sine);
      sample = (0.55 * sine + 0.35 * square) * Math.exp(-t * 16) * 0.7;
    } else {
      // Soft descending whoosh for respawn
      const f0 = 640;
      const f1 = 220;
      const phase =
        2 * Math.PI * (f0 * t + ((f1 - f0) / (2 * duration)) * t * t);
      sample =
        (Math.sin(phase) + 0.3 * Math.sin(phase * 0.5)) *
        Math.exp(-t * 7) *
        0.45;
    }
    data[i] = sample;
  }
  return buffer;
}

/** Yellow oval coin graphic (transparent outside the ellipse). */
function makeCoinGraphic(): FlxGraphic {
  const width = 16;
  const height = 12;
  const pixels = makeGraphicPixels(width, height, 0x00000000);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const rx = width / 2 - 0.5;
  const ry = height / 2 - 0.5;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d <= 1) {
        pixels.data[y * width + x] = d > 0.72 ? COIN_YELLOW_EDGE : COIN_YELLOW;
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'platformer-coin');
}

function fillRow(
  data: number[],
  row: number,
  x0: number,
  x1: number,
  tile = 1,
): void {
  for (let x = x0; x < x1; x += 1) {
    data[row * MAP_W + x] = tile;
  }
}

function makeTileset(): FlxGraphic {
  const colors = [0x00000000, 0xff475569, 0xff64748b, 0xff94a3b8];
  const pixels = makeGraphicPixels(TILE * colors.length, TILE, 0x00000000);
  for (let frame = 0; frame < colors.length; frame += 1) {
    for (let y = 0; y < TILE; y += 1) {
      for (let x = 0; x < TILE; x += 1) {
        const edge = x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1;
        pixels.data[y * pixels.width + frame * TILE + x] = edge
          ? 0xff1e293b
          : (colors[frame] as number);
      }
    }
  }
  return FlxGraphic.fromPixels(pixels, 'platformer-tiles');
}

/** One wide side-scrolling course: ground, gaps, and reachable ledges. */
function makeMapData(): number[] {
  const data = new Array<number>(MAP_W * MAP_H).fill(0);

  // Solid ground with a few pits (must jump)
  fillRow(data, FLOOR, 0, MAP_W, 1);
  fillRow(data, FLOOR + 1, 0, MAP_W, 2);
  // Pit 1
  fillRow(data, FLOOR, 18, 22, 0);
  fillRow(data, FLOOR + 1, 18, 22, 0);
  // Pit 2
  fillRow(data, FLOOR, 44, 49, 0);
  fillRow(data, FLOOR + 1, 44, 49, 0);
  // Pit 3
  fillRow(data, FLOOR, 78, 84, 0);
  fillRow(data, FLOOR + 1, 78, 84, 0);

  // Floating ledges (≤3 tiles above local ground / each other)
  fillRow(data, FLOOR - 3, 10, 16); // intro hop
  fillRow(data, FLOOR - 3, 24, 30); // after pit 1
  fillRow(data, FLOOR - 5, 28, 34); // step up
  fillRow(data, FLOOR - 3, 36, 42);
  fillRow(data, FLOOR - 4, 52, 58); // after pit 2
  fillRow(data, FLOOR - 6, 56, 62);
  fillRow(data, FLOOR - 3, 64, 72);
  fillRow(data, FLOOR - 5, 70, 76);
  fillRow(data, FLOOR - 3, 86, 94); // after pit 3
  fillRow(data, FLOOR - 5, 92, 100);
  fillRow(data, FLOOR - 3, 102, 112); // run-up to goal
  fillRow(data, FLOOR - 4, 110, 118); // goal ledge

  // End walls
  for (let y = 0; y < MAP_H; y += 1) {
    data[y * MAP_W] = 2;
    data[y * MAP_W + MAP_W - 1] = 2;
  }
  return data;
}

/** Side-view platformer with Paragon-style jump helpers. */
export class PlatformerState extends FlxState {
  map!: FlxTilemap;
  player!: FlxSprite;
  coins!: FlxGroup<FlxSprite>;
  hud!: FlxText;
  score = 0;
  totalCoins = COIN_SPOTS.length;

  #coyote = 0;
  #jumpBuffer = 0;
  /** Still in the upward phase and Space hasn't been released (early-fall gate). */
  #jumpHeld = false;
  #touchedGroundSinceJump = true;
  #wasGrounded = false;
  #framesGoingDown = 0;
  #spawnX = 3 * TILE;
  #audioCtx: AudioContext | null = null;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff0b1220;
    FlxG.worldBounds.make(0, 0, MAP_W * TILE, MAP_H * TILE);

    this.map = new FlxTilemap().loadMapData(
      makeMapData(),
      MAP_W,
      makeTileset(),
      {
        tileWidth: TILE,
        tileHeight: TILE,
        collideIndex: 1,
      },
    );
    this.add(this.map);

    this.#spawnX = 3 * TILE;
    this.player = new FlxSprite(this.#spawnX, FLOOR * TILE - 20);
    this.player.makeGraphic(14, 20, 0xff38bdf8);
    this.player.maxVelocity.x = MAX_RUN;
    this.player.maxVelocity.y = MAX_FALL;
    this.player.drag.x = GROUND_DRAG;
    this.add(this.player);

    this.coins = new FlxGroup<FlxSprite>();
    const coinGraphic = makeCoinGraphic();
    for (const [tx, ty] of COIN_SPOTS) {
      const coin = new FlxSprite(tx * TILE, ty * TILE);
      coin.loadGraphic(coinGraphic);
      this.coins.add(coin);
    }
    this.add(this.coins);

    this.hud = new FlxText(
      8,
      6,
      620,
      `coins 0/${this.totalCoins} · → run · hold SPACE`,
    );
    this.hud.setFormat(undefined, 12, 0xffe2e8f0, 'left');
    this.hud.scrollFactor.x = 0;
    this.hud.scrollFactor.y = 0;
    this.add(this.hud);

    FlxG.camera.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    FlxG.camera.follow(this.player, FlxCamera.STYLE_PLATFORMER);
    this.map.follow(FlxG.camera, 0, true);
  }

  #playSfx(kind: 'coin' | 'jump' | 'respawn'): void {
    try {
      if (!this.#audioCtx) this.#audioCtx = new AudioContext();
      const ctx = this.#audioCtx;
      const volume = kind === 'coin' ? 0.55 : kind === 'jump' ? 0.7 : 0.5;
      // Play on this context after resume — avoids a silent race with the
      // game backend's separate AudioContext (resume is async).
      void ctx.resume().then(() => {
        if (ctx.state !== 'running') return;
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = volume;
        src.buffer = createSynthBlip(ctx, kind);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
      });
    } catch {
      // Audio may be blocked until a gesture; gameplay still continues.
    }
  }

  override update(): void {
    const dt = FlxG.elapsed;
    const grounded = (this.player.wasTouching & FlxObject.FLOOR) !== 0;
    const atApex = !grounded && Math.abs(this.player.velocity.y) < APEX_SPEED;

    // --- timers (Paragon: grounded_frames_ago / w_frames_ago) ---
    if (grounded) {
      this.#coyote = COYOTE_TIME;
      this.#touchedGroundSinceJump = true;
      this.#framesGoingDown = 0;
      // Remember last safe footing X for pit respawns
      this.#spawnX = this.player.x;
    } else {
      this.#coyote = Math.max(0, this.#coyote - dt);
      if (this.player.velocity.y > 0) this.#framesGoingDown += 1;
      else this.#framesGoingDown = 0;
    }

    if (FlxG.keys.justPressed('SPACE')) {
      this.#jumpBuffer = JUMP_BUFFER;
    } else {
      this.#jumpBuffer = Math.max(0, this.#jumpBuffer - dt);
    }

    // --- horizontal move + speedy apex ---
    this.player.acceleration.x = 0;
    const left = FlxG.keys.pressed('LEFT');
    const right = FlxG.keys.pressed('RIGHT');
    const accel = grounded ? MOVE_ACCEL : atApex ? APEX_TURN_ACCEL : AIR_ACCEL;
    if (left) this.player.acceleration.x = -accel;
    if (right) this.player.acceleration.x = accel;
    this.player.drag.x = grounded && !left && !right ? GROUND_DRAG : 0;

    // Sticky feet: on landing frame, snap reverse if holding opposite direction
    if (grounded && !this.#wasGrounded) {
      if (left && this.player.velocity.x > 0) {
        this.player.velocity.x = -MAX_RUN;
      } else if (right && this.player.velocity.x < 0) {
        this.player.velocity.x = MAX_RUN;
      }
    }

    // --- gravity (anti-gravity apex when near peak) ---
    this.player.acceleration.y = atApex ? APEX_GRAVITY : GRAVITY;

    // --- early fall: release Space while rising → vertical speed = 0 ---
    if (
      this.#jumpHeld &&
      FlxG.keys.justReleased('SPACE') &&
      !grounded &&
      this.player.velocity.y < 0
    ) {
      this.player.velocity.y = 0;
      this.#jumpHeld = false;
    }

    // --- jump (coyote + buffer); Paragon: can_jump && use_w ---
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
      this.#playSfx('jump');
    }

    if (this.player.velocity.y >= 0) {
      this.#jumpHeld = false;
    }

    super.update();
    FlxG.collide(this.player, this.map);

    // Fell below the visible camera view → respawn at last solid ground
    const viewBottom = FlxG.camera.scroll.y + FlxG.camera.height;
    if (this.player.y > viewBottom) {
      this.#respawn();
    }

    // Clamp fall (also enforced via maxVelocity.y)
    if (this.player.velocity.y > MAX_FALL) {
      this.player.velocity.y = MAX_FALL;
    }

    for (const member of this.coins.members) {
      if (member === null || !member.exists) continue;
      if (this.player.overlaps(member)) {
        member.kill();
        this.score += 1;
        this.#playSfx('coin');
      }
    }

    this.#wasGrounded = (this.player.touching & FlxObject.FLOOR) !== 0;

    const onFloor = this.#wasGrounded;
    const done = this.score >= this.totalCoins;
    this.hud.text = done
      ? `all ${this.totalCoins} coins!`
      : `coins ${this.score}/${this.totalCoins} · ${
          onFloor ? 'ground' : atApex ? 'apex' : 'air'
        }`;
  }

  #respawn(): void {
    this.player.x = this.#spawnX;
    // Drop in from the top of the current camera view
    this.player.y = FlxG.camera.scroll.y;
    this.player.velocity.x = 0;
    this.player.velocity.y = 0;
    this.player.acceleration.x = 0;
    this.player.acceleration.y = 0;
    this.#coyote = 0;
    this.#jumpBuffer = 0;
    this.#jumpHeld = false;
    this.#touchedGroundSinceJump = true;
    this.#wasGrounded = false;
    this.#framesGoingDown = 0;
    this.#playSfx('respawn');
  }
}
