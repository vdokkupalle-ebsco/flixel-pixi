import {
  FlxG,
  FlxGradient,
  FlxGraphics,
  FlxState,
  FlxText,
} from '../../../src';

export interface GraphicsShowcaseSnapshot {
  backgroundCommands: number;
  backgroundRevision: number;
  hudRevision: number;
  night: boolean;
  pickupRevision: number;
}

/** Game-like showcase for stable vector helpers and local gradients. */
export class GraphicsShowcaseState extends FlxState {
  readonly background = new FlxGraphics(0, 0, 640, 360);
  readonly hud = new FlxGraphics(18, 242, 250, 100);
  readonly route = new FlxGraphics(0, 0, 640, 360);
  readonly pickup = new FlxGraphics(505, 194, 70, 70);
  night = false;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    this.#drawBackground();
    this.#drawRoute();
    this.#drawHud();
    this.#drawPickup();
    this.add(this.background);
    this.add(this.route);
    this.add(this.pickup);
    this.add(this.hud);
    this.add(
      new FlxText(34, 257, 220, 'FOREST QUEST').setFormat(
        undefined,
        14,
        0xffffffff,
        'left',
      ),
    );
    this.add(
      new FlxText(34, 282, 220, 'Health  78 / 100').setFormat(
        undefined,
        10,
        0xffe2e8f0,
        'left',
      ),
    );
    this.add(
      new FlxText(34, 317, 220, 'Route: reach the sun shard').setFormat(
        undefined,
        9,
        0xffcbd5e1,
        'left',
      ),
    );
  }

  override update(): void {
    super.update();
    this.pickup.angle += FlxG.elapsed * 32;
    this.pickup.scale.make(
      1 + Math.sin(this.pickup.angle * 0.08) * 0.08,
      1 + Math.sin(this.pickup.angle * 0.08) * 0.08,
    );
  }

  setNight(enabled: boolean): void {
    if (this.night === enabled) return;
    this.night = enabled;
    this.#drawBackground();
  }

  snapshot(): GraphicsShowcaseSnapshot {
    return {
      backgroundCommands: this.background.commandCount,
      backgroundRevision: this.background.graphicsRevision,
      hudRevision: this.hud.graphicsRevision,
      night: this.night,
      pickupRevision: this.pickup.graphicsRevision,
    };
  }

  #drawBackground(): void {
    const sky = this.night
      ? FlxGradient.linear([
          { color: 0x020617ff, offset: 0 },
          { color: 0x172554ff, offset: 0.55 },
          { color: 0x312e81ff, offset: 1 },
        ])
      : FlxGradient.linear([
          { color: 0x38bdf8ff, offset: 0 },
          { color: 0x7dd3fcff, offset: 0.55 },
          { color: 0xfef3c7ff, offset: 1 },
        ]);
    const glow = FlxGradient.radial([
      { color: this.night ? 0xc4b5fdff : 0xfffbebff, offset: 0 },
      { color: this.night ? 0x8b5cf680 : 0xfbbf2480, offset: 0.55 },
      { color: 0xffffff00, offset: 1 },
    ]);
    this.background
      .clearGraphics()
      .rect(0, 0, 640, 360, { fill: sky })
      .circle(530, 78, this.night ? 34 : 50, { fill: glow })
      .polygon(
        [
          0, 210, 110, 118, 210, 205, 318, 105, 430, 205, 545, 128, 640, 205,
          640, 360, 0, 360,
        ],
        {
          fill: this.night ? 0x1e293bff : 0x475569ff,
        },
      )
      .polygon(
        [
          0, 245, 95, 184, 188, 238, 300, 174, 410, 245, 515, 180, 640, 238,
          640, 360, 0, 360,
        ],
        {
          fill: this.night ? 0x052e16ff : 0x166534ff,
        },
      )
      .rect(0, 286, 640, 74, {
        fill: FlxGradient.linear([
          { color: this.night ? 0x052e16ff : 0x15803dff, offset: 0 },
          { color: this.night ? 0x020617ff : 0x14532dff, offset: 1 },
        ]),
      });
  }

  #drawRoute(): void {
    this.route
      .line([286, 294, 350, 270, 408, 286, 460, 245, 512, 229], {
        cap: 'round',
        fill: 0xfef08aff,
        join: 'round',
        width: 5,
      })
      .circle(286, 294, 7, {
        fill: 0xfacc15ff,
        stroke: { fill: 0xffffffff, width: 2 },
      });
  }

  #drawHud(): void {
    this.hud
      .roundRect(0, 0, 250, 100, 14, {
        fill: FlxGradient.linear(
          [
            { color: 0x0f172af2, offset: 0 },
            { color: 0x1e293be6, offset: 1 },
          ],
          { end: { x: 1, y: 1 } },
        ),
        stroke: { fill: 0x94a3b8cc, width: 2 },
      })
      .roundRect(16, 58, 218, 14, 7, { fill: 0x020617ff })
      .roundRect(18, 60, 167, 10, 5, {
        fill: FlxGradient.linear(
          [
            { color: 0x4ade80ff, offset: 0 },
            { color: 0x16a34aff, offset: 1 },
          ],
          { end: { x: 1, y: 0 } },
        ),
      });
  }

  #drawPickup(): void {
    this.pickup
      .circle(35, 35, 34, {
        fill: FlxGradient.radial([
          { color: 0xfef9c3b3, offset: 0 },
          { color: 0xfacc154d, offset: 0.6 },
          { color: 0xfacc1500, offset: 1 },
        ]),
      })
      .star(35, 35, 6, 21, 10, {
        fill: FlxGradient.linear(
          [
            { color: 0xfffbebff, offset: 0 },
            { color: 0xf59e0bff, offset: 1 },
          ],
          { end: { x: 1, y: 1 } },
        ),
        stroke: { fill: 0xfef3c7ff, width: 2 },
      });
  }
}
