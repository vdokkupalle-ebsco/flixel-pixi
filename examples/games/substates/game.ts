import { FlxG, FlxSprite, FlxState, FlxSubState, FlxText } from '../../../src';

export interface SubstateDemoSnapshot {
  paused: boolean;
  updates: number;
  markerX: number;
  opened: number;
  closed: number;
}

class PauseOverlay extends FlxSubState {
  override create(): void {
    const shade = new FlxSprite().makeGraphic(640, 480, 0xff0f172a);
    shade.alpha = 0.78;
    shade.scrollFactor.x = 0;
    shade.scrollFactor.y = 0;
    this.add(shade);

    const title = new FlxText(80, 182, 480, 'PAUSED');
    title.setFormat(undefined, 34, 0xfffacc15, 'center');
    title.scrollFactor.x = 0;
    title.scrollFactor.y = 0;
    this.add(title);

    const hint = new FlxText(
      80,
      235,
      480,
      'The world remains drawn but no longer updates.\nPress SPACE or ESCAPE to resume.',
    );
    hint.setFormat(undefined, 15, 0xffe2e8f0, 'center');
    hint.scrollFactor.x = 0;
    hint.scrollFactor.y = 0;
    this.add(hint);
  }

  override update(): void {
    if (FlxG.keys.justPressed('SPACE') || FlxG.keys.justPressed('ESCAPE')) {
      this.close();
    }
    super.update();
  }
}

export class SubstateDemoState extends FlxState {
  readonly marker = new FlxSprite();
  readonly hud = new FlxText(48, 315, 544, '');
  updates = 0;
  opened = 0;
  closed = 0;

  override create(): void {
    FlxG.camera.bgColor = 0xff07111f;

    const title = new FlxText(32, 24, 576, 'SUBSTATE LIFECYCLE');
    title.setFormat(undefined, 24, 0xff38bdf8, 'center');
    this.add(title);

    const track = new FlxSprite(56, 210).makeGraphic(528, 4, 0xff334155);
    this.add(track);

    this.marker.makeGraphic(30, 30, 0xfff472b6);
    this.marker.y = 197;
    this.add(this.marker);

    this.hud.setFormat(undefined, 14, 0xffcbd5e1, 'center');
    this.add(this.hud);

    this.subStateOpened.add(() => {
      this.opened += 1;
    });
    this.subStateClosed.add(() => {
      this.closed += 1;
    });
  }

  override update(): void {
    this.updates += 1;
    this.marker.x = 56 + ((this.updates * 2) % 498);
    this.hud.text = `World updates: ${this.updates} · overlays opened: ${this.opened} · closed: ${this.closed}\nPress SPACE to open the pause substate`;

    if (FlxG.keys.justPressed('SPACE')) this.pause();
    super.update();
  }

  pause(): void {
    if (this.subState === null) this.openSubState(new PauseOverlay());
  }

  resume(): void {
    this.subState?.close();
  }

  snapshot(): SubstateDemoSnapshot {
    return {
      paused: this.subState !== null,
      updates: this.updates,
      markerX: this.marker.x,
      opened: this.opened,
      closed: this.closed,
    };
  }
}
