import { FlxG, FlxState, FlxText } from '../../../src';

export class KenneyPlayState extends FlxState {
  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff0f172a;

    const title = new FlxText(40, 200, 560, 'KENNEY PLATFORMER');
    title.setFormat(undefined, 28, 0xff38bdf8, 'center');
    this.add(title);
  }
}
