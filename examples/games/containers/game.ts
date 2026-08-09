import {
  FlxG,
  FlxSprite,
  FlxSpriteContainer,
  FlxState,
  FlxText,
} from '../../../src';

export interface ContainerShowcaseSnapshot {
  angle: number;
  collisions: number;
  localX: number;
  memberCount: number;
  scale: number;
  worldX: number;
}

function caption(
  state: FlxState,
  x: number,
  y: number,
  width: number,
  text: string,
  color = 0xff94a3b8,
  size = 10,
): FlxText {
  const label = new FlxText(x, y, width, text).setFormat(
    undefined,
    size,
    color,
    'left',
  );
  state.add(label);
  return label;
}

/** Public-API showcase for nested sprite containers and member collisions. */
export class ContainerShowcaseState extends FlxState {
  composite!: FlxSpriteContainer;
  member!: FlxSprite;
  target!: FlxSprite;
  status!: FlxText;
  collisions = 0;

  #time = 0;
  #touching = false;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    caption(this, 24, 18, 592, 'CONTAINERS + SPRITE GROUPS', 0xffe2e8f0, 16);
    caption(
      this,
      24,
      45,
      592,
      'LOCAL AUTHORING · WORLD COLLISION · NESTED LIFECYCLE · PIXI CONTAINER BRANCHES',
      0xff38bdf8,
      9,
    );

    this.composite = new FlxSpriteContainer(120, 120);
    this.composite.origin.make(55, 25);
    this.composite.cameras = [FlxG.camera];

    this.member = this.composite.add(
      new FlxSprite(0, 8).makeGraphic(28, 28, 0xff38bdf8),
    );
    this.composite.add(new FlxSprite(42, 0).makeGraphic(22, 44, 0xfffbbf24));

    const nested = new FlxSpriteContainer(82, 9);
    nested.origin.make(14, 14);
    nested.add(new FlxSprite(0, 0).makeGraphic(28, 28, 0xffa78bfa));
    nested.add(new FlxSprite(8, 8).makeGraphic(12, 12, 0xff07111f));
    this.composite.add(nested);
    this.add(this.composite);

    this.target = new FlxSprite(226, 124).makeGraphic(22, 38, 0xfffb7185);
    this.target.immovable = true;
    this.add(this.target);

    caption(
      this,
      24,
      224,
      592,
      'CYAN MEMBER COLLIDES AS A WORLD-SPACE AABB',
      0xffcbd5e1,
      10,
    );
    caption(
      this,
      24,
      245,
      592,
      'PINK = COLLISION TARGET · PURPLE = NESTED CONTAINER',
      0xff94a3b8,
      9,
    );
    this.status = caption(this, 24, 284, 592, '', 0xff4ade80, 11);
    caption(
      this,
      24,
      316,
      592,
      'Simulation owns coordinates and collision. Pixi owns only the synchronized container branch.',
      0xff94a3b8,
      9,
    );
  }

  override update(): void {
    this.#time += FlxG.elapsed;
    this.composite.x = 120 + Math.sin(this.#time * 1.35) * 78;
    this.composite.angle = Math.sin(this.#time * 0.9) * 24;
    const scale = 1 + Math.sin(this.#time * 1.8) * 0.12;
    this.composite.scale.make(scale, scale);

    const touching = FlxG.overlap(this.composite, this.target);
    if (touching && !this.#touching) this.collisions += 1;
    this.#touching = touching;
    this.target.color = touching ? 0x4ade80 : 0xfb7185;

    const local = this.composite.getMemberLocalPosition(this.member);
    this.status.text = `local (${local.x.toFixed(0)}, ${local.y.toFixed(0)}) · world (${this.member.x.toFixed(0)}, ${this.member.y.toFixed(0)}) · ${this.collisions} collision passes`;
    super.update();
  }

  snapshot(): ContainerShowcaseSnapshot {
    return {
      angle: this.composite.angle,
      collisions: this.collisions,
      localX: this.composite.getMemberLocalPosition(this.member).x,
      memberCount: this.composite.length,
      scale: this.composite.scale.x,
      worldX: this.member.x,
    };
  }
}
