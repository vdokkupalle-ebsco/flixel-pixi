import { FlxG, FlxSprite, FlxState, FlxText } from '../../../src';

/** Title screen — press SPACE / click Start path via switchState from Play. */
export class TitleState extends FlxState {
  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff0f172a;

    const title = new FlxText(40, 160, 560, 'HELLO FLIXEL-PIXI');
    title.setFormat(undefined, 28, 0xfffacc15, 'center');
    this.add(title);

    const hint = new FlxText(
      40,
      220,
      560,
      'Press SPACE or ENTER to play\nArrow keys move the square',
    );
    hint.setFormat(undefined, 14, 0xff94a3b8, 'center');
    this.add(hint);
  }

  override update(): void {
    super.update();
    if (FlxG.keys.justPressed('SPACE') || FlxG.keys.justPressed('ENTER')) {
      FlxG.switchState(new PlayState());
    }
  }
}

/** Basic movement sample — public APIs only. */
export class PlayState extends FlxState {
  player!: FlxSprite;
  hud!: FlxText;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff0f172a;

    this.player = new FlxSprite(300, 220);
    this.player.makeGraphic(32, 32, 0xff38bdf8);
    this.player.maxVelocity.x = 240;
    this.player.maxVelocity.y = 240;
    this.player.drag.x = 1600;
    this.player.drag.y = 1600;
    this.add(this.player);

    this.hud = new FlxText(
      16,
      12,
      600,
      'HELLO — arrows move · R reset · Esc title',
    );
    this.hud.setFormat(undefined, 13, 0xffe2e8f0, 'left');
    this.add(this.hud);
  }

  override update(): void {
    this.player.acceleration.x = 0;
    this.player.acceleration.y = 0;
    if (FlxG.keys.pressed('LEFT')) this.player.acceleration.x = -1200;
    if (FlxG.keys.pressed('RIGHT')) this.player.acceleration.x = 1200;
    if (FlxG.keys.pressed('UP')) this.player.acceleration.y = -1200;
    if (FlxG.keys.pressed('DOWN')) this.player.acceleration.y = 1200;

    if (this.player.x < 0) this.player.x = 0;
    if (this.player.y < 0) this.player.y = 0;
    if (this.player.x > FlxG.width - this.player.width) {
      this.player.x = FlxG.width - this.player.width;
    }
    if (this.player.y > FlxG.height - this.player.height) {
      this.player.y = FlxG.height - this.player.height;
    }

    this.hud.text = `pos (${Math.round(this.player.x)}, ${Math.round(this.player.y)}) · R reset · Esc title`;

    if (FlxG.keys.justPressed('R')) {
      FlxG.switchState(new PlayState());
    }
    if (FlxG.keys.justPressed('ESCAPE')) {
      FlxG.switchState(new TitleState());
    }

    super.update();
  }
}
