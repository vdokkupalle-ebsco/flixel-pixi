import { FlxBackdrop, FlxG, FlxSprite, FlxState, FlxText } from 'flixel-pixi';
import {
  FLOOR_Y,
  makeCollectibleGraphic,
  makeGroundTile,
  makeRunnerSheet,
  makeSkyTile,
  PLAYER_FLOOR_Y,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './art';

export class HeroRunnerState extends FlxState {
  player!: FlxSprite;
  scoreText!: FlxText;

  #collectibles: FlxSprite[] = [];
  #jumpRequested = false;
  #score = 0;
  #nextCollectibleGap = 0;

  requestJump(): void {
    this.#jumpRequested = true;
  }

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff090d16;

    const sky = new FlxBackdrop(makeSkyTile(), 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    sky.repeatY = false;
    sky.scrollVelocity.x = -13;
    this.add(sky);

    const ground = new FlxBackdrop(
      makeGroundTile(),
      0,
      FLOOR_Y,
      VIEW_WIDTH,
      VIEW_HEIGHT - FLOOR_Y,
    );
    ground.repeatY = false;
    ground.scrollVelocity.x = -92;
    this.add(ground);

    this.player = new FlxSprite(52, PLAYER_FLOOR_Y);
    this.player.loadGraphic(
      makeRunnerSheet(),
      true,
      false,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
    );
    this.player.addAnimation('run', [0, 1, 2, 3], 11, true);
    this.player.play('run', { loop: true, speed: 11 / 60 });
    this.player.acceleration.y = 680;
    this.player.maxVelocity.y = 420;
    this.add(this.player);

    this.#makeCollectible(224, 102);
    this.#makeCollectible(292, 78);
    this.#makeCollectible(366, 102);

    this.scoreText = new FlxText(9, 8, 150, 'GEMS 000');
    this.scoreText.setFormat(undefined, 9, 0xfff8fafc, 'left');
    this.scoreText.scrollFactor.make(0, 0);
    this.add(this.scoreText);
  }

  override update(): void {
    const grounded = this.player.y >= PLAYER_FLOOR_Y - 0.5;
    if (this.#jumpRequested && grounded) {
      this.player.velocity.y = -285;
      this.player.play('run', { loop: true, speed: 7 / 60 });
    }
    this.#jumpRequested = false;

    super.update();

    if (this.player.y >= PLAYER_FLOOR_Y) {
      this.player.y = PLAYER_FLOOR_Y;
      this.player.velocity.y = 0;
      this.player.play('run', { loop: true, speed: 11 / 60 });
    }

    for (const collectible of this.#collectibles) {
      if (collectible.x + collectible.width < 0) {
        this.#recycleCollectible(collectible);
      }
      if (this.player.overlaps(collectible)) {
        this.#score += 1;
        this.scoreText.text = `GEMS ${this.#score.toString().padStart(3, '0')}`;
        FlxG.camera.flash(0x4412d9e6, 0.12);
        this.#recycleCollectible(collectible);
      }
    }
  }

  #makeCollectible(x: number, y: number): void {
    const collectible = new FlxSprite(x, y);
    collectible.loadGraphic(makeCollectibleGraphic());
    collectible.velocity.x = -92;
    collectible.angularVelocity = 90;
    this.#collectibles.push(collectible);
    this.add(collectible);
  }

  #recycleCollectible(collectible: FlxSprite): void {
    this.#nextCollectibleGap += 37;
    collectible.x = VIEW_WIDTH + 54 + (this.#nextCollectibleGap % 76);
    collectible.y = this.#nextCollectibleGap % 2 === 0 ? 102 : 78;
  }
}
