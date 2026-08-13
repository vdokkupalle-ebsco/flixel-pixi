import { FlxG, FlxSprite, FlxState, FlxText } from '../../../src';

/** Minimal state so each soak cycle has something to register/destroy. */
export class SoakState extends FlxState {
  sprite: FlxSprite | null = null;
  text: FlxText | null = null;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff111827;
    const s = new FlxSprite(300, 220);
    s.makeGraphic(32, 32, 0xff38bdf8);
    this.add(s);
    const t = new FlxText(8, 8, 400, 'SOAK CYCLE');
    t.setFormat(undefined, 12, 0xffe2e8f0, 'left');
    this.add(t);
    this.sprite = s;
    this.text = t;
  }

  /** Resource references retained only so the soak can verify teardown. */
  resourceSnapshot(): {
    liveRenderHandles: number;
    liveTextureSources: number;
  } {
    const objects = [this.sprite, this.text].filter(
      (object): object is FlxSprite => object !== null,
    );
    return {
      liveRenderHandles: objects.reduce(
        (total, object) => total + object.renderHandleCount,
        0,
      ),
      liveTextureSources: objects.reduce((total, object) => {
        const source = object.graphic?.texture.source;
        return total + (source !== undefined && !source.destroyed ? 1 : 0);
      }, 0),
    };
  }
}
