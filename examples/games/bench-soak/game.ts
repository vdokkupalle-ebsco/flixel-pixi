import { FlxG, FlxSprite, FlxState, FlxText } from '../../../src';

/** Minimal state so each soak cycle has something to register/destroy. */
export class SoakState extends FlxState {
  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff111827;
    const s = new FlxSprite(300, 220);
    s.makeGraphic(32, 32, 0xff38bdf8);
    this.add(s);
    const t = new FlxText(8, 8, 400, 'SOAK CYCLE');
    t.setFormat(undefined, 12, 0xffe2e8f0, 'left');
    this.add(t);
  }
}
