import {
  FlxG,
  FlxPhysicsWorld,
  FlxSprite,
  FlxState,
  FlxText,
  type FlxPhysicsBody,
} from 'flixel-pixi';
import { createPlanckPhysicsBackend } from '@flixel-pixi/physics-planck';

const COLORS = {
  background: 0xff08111f,
  cyan: 0x1de8f1ff,
  floor: 0x26384fff,
  muted: 0x64748bff,
  panel: 0x0d192aff,
  pink: 0xff397eff,
  text: 0xffe8eef7,
  violet: 0xa78bfaff,
  yellow: 0xffd166ff,
} as const;

export interface PhysicsJointsSnapshot {
  readonly jointCount: number;
  readonly prismaticX: number;
  readonly revoluteAngle: number;
  readonly wheelAngle: number;
}

/** Playable proof for all portable joint definitions. */
export class PhysicsJointsState extends FlxState {
  world!: FlxPhysicsWorld;
  #distanceBob!: FlxSprite;
  #prismaticBody!: FlxPhysicsBody;
  #prismaticSprite!: FlxSprite;
  #revoluteSprite!: FlxSprite;
  #wheelSprite!: FlxSprite;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = COLORS.background;
    this.world = new FlxPhysicsWorld(createPlanckPhysicsBackend(), {
      gravity: { x: 0, y: 620 },
    });
    this.setPhysicsWorld(this.world);

    this.#title();
    this.#panel(
      24,
      96,
      260,
      184,
      'DISTANCE',
      'A fixed-length rope with spring damping',
    );
    this.#panel(
      320,
      96,
      260,
      184,
      'REVOLUTE',
      'A powered hinge with angular limits',
    );
    this.#panel(
      616,
      96,
      260,
      184,
      'PRISMATIC',
      'A motor constrained to one axis',
    );
    this.#panel(
      172,
      316,
      260,
      184,
      'WELD',
      'Two bodies locked into one rigid assembly',
    );
    this.#panel(
      468,
      316,
      260,
      184,
      'WHEEL',
      'Suspension travel plus a rotary motor',
    );

    this.#distanceDemo();
    this.#revoluteDemo();
    this.#prismaticDemo();
    this.#weldDemo();
    this.#wheelDemo();
  }

  override update(): void {
    if (this.#prismaticSprite.x > 803) {
      this.#prismaticBody.setVelocity({ x: -72, y: 0 });
    } else if (this.#prismaticSprite.x < 684) {
      this.#prismaticBody.setVelocity({ x: 72, y: 0 });
    }

    if (FlxG.mouse.justPressed()) {
      this.#distanceBobBody().applyImpulse({ x: 0.28, y: -0.12 });
    }
    super.update();
  }

  snapshot(): PhysicsJointsSnapshot {
    return {
      jointCount: this.world.jointCount,
      prismaticX: this.#prismaticSprite.x,
      revoluteAngle: this.#revoluteSprite.angle,
      wheelAngle: this.#wheelSprite.angle,
    };
  }

  #distanceBobBody(): FlxPhysicsBody {
    const body = this.world.getBody(this.#distanceBob);
    if (body === undefined)
      throw new Error('Distance bob body is unavailable.');
    return body;
  }

  #distanceDemo(): void {
    const anchor = this.#body(
      68,
      147,
      16,
      16,
      COLORS.muted,
      'distance-anchor',
      'static',
    );
    this.#distanceBob = this.#sprite(188, 202, 34, 34, COLORS.cyan);
    const bob = this.world.addBody(this.#distanceBob, {
      id: 'distance-bob',
      type: 'dynamic',
      shapes: [{ kind: 'circle', radius: 17 }],
      material: { density: 0.8, friction: 0.2, restitution: 0.25 },
    });
    this.world.addJoint({
      id: 'distance-demo',
      type: 'distance',
      bodyA: anchor,
      bodyB: bob,
      anchorA: { x: 76, y: 155 },
      anchorB: { x: 205, y: 219 },
      length: 142,
      frequencyHz: 2.2,
      dampingRatio: 0.18,
    });
  }

  #revoluteDemo(): void {
    const pivot = this.#body(
      442,
      184,
      18,
      18,
      COLORS.muted,
      'revolute-pivot',
      'static',
    );
    this.#revoluteSprite = this.#sprite(395, 188, 112, 10, COLORS.pink);
    const arm = this.world.addBody(this.#revoluteSprite, {
      id: 'revolute-arm',
      type: 'dynamic',
      shapes: [{ kind: 'box', width: 112, height: 10 }],
      material: { density: 0.65, friction: 0.3 },
    });
    this.world.addJoint({
      id: 'revolute-demo',
      type: 'revolute',
      bodyA: pivot,
      bodyB: arm,
      anchor: { x: 451, y: 193 },
      enableLimit: true,
      lowerAngle: -150,
      upperAngle: 150,
      enableMotor: true,
      motorSpeed: 72,
      maxMotorTorque: 24_000,
    });
  }

  #prismaticDemo(): void {
    const rail = this.#body(
      674,
      210,
      152,
      6,
      COLORS.muted,
      'prismatic-rail',
      'static',
    );
    this.#prismaticSprite = this.#sprite(730, 181, 42, 34, COLORS.yellow);
    this.#prismaticBody = this.world.addBody(this.#prismaticSprite, {
      id: 'prismatic-slider',
      type: 'dynamic',
      fixedRotation: true,
      shapes: [{ kind: 'box', width: 42, height: 34 }],
      material: { density: 0.8, friction: 0.1 },
    });
    this.world.addJoint({
      id: 'prismatic-demo',
      type: 'prismatic',
      bodyA: rail,
      bodyB: this.#prismaticBody,
      anchor: { x: 751, y: 198 },
      axis: { x: 1, y: 0 },
      enableLimit: true,
      lowerTranslation: -72,
      upperTranslation: 72,
      enableMotor: true,
      motorSpeed: 72,
      maxMotorForce: 38_000,
    });
  }

  #weldDemo(): void {
    const driverSprite = this.#sprite(265, 406, 70, 14, COLORS.violet);
    const driver = this.world.addBody(driverSprite, {
      id: 'weld-driver',
      type: 'kinematic',
      shapes: [{ kind: 'box', width: 70, height: 14 }],
    });
    const payload = this.#body(
      329,
      392,
      34,
      42,
      COLORS.cyan,
      'weld-payload',
      'dynamic',
    );
    this.world.addJoint({
      id: 'weld-demo',
      type: 'weld',
      bodyA: driver,
      bodyB: payload,
      anchor: { x: 329, y: 413 },
    });
    driver.setVelocity({ x: 0, y: 0 }, 22);
  }

  #wheelDemo(): void {
    const chassis = this.#body(
      530,
      385,
      136,
      24,
      COLORS.violet,
      'wheel-chassis',
      'static',
    );
    this.#wheelSprite = this.#sprite(575, 421, 46, 46, COLORS.pink);
    const wheel = this.world.addBody(this.#wheelSprite, {
      id: 'wheel-body',
      type: 'dynamic',
      shapes: [{ kind: 'circle', radius: 23 }],
      material: { density: 1, friction: 0.8, restitution: 0.05 },
    });
    this.world.addJoint({
      id: 'wheel-demo',
      type: 'wheel',
      bodyA: chassis,
      bodyB: wheel,
      anchor: { x: 598, y: 421 },
      axis: { x: 0, y: 1 },
      enableMotor: true,
      motorSpeed: 180,
      maxMotorTorque: 32_000,
      frequencyHz: 4,
      dampingRatio: 0.65,
    });
  }

  #body(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    id: string,
    type: 'dynamic' | 'kinematic' | 'static',
  ): FlxPhysicsBody {
    const sprite = this.#sprite(x, y, width, height, color);
    return this.world.addBody(sprite, {
      id,
      type,
      shapes: [{ kind: 'box', width, height }],
      material: { density: 0.8, friction: 0.4 },
    });
  }

  #sprite(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
  ): FlxSprite {
    const sprite = new FlxSprite(x, y).makeGraphic(width, height, color);
    this.add(sprite);
    return sprite;
  }

  #title(): void {
    const title = new FlxText(24, 20, 852, 'FIVE JOINTS · ONE PORTABLE API');
    title.setFormat(undefined, 24, COLORS.text, 'center');
    this.add(title);
    const hint = new FlxText(
      24,
      54,
      852,
      'Click anywhere to kick the distance-joint pendulum',
    );
    hint.setFormat(undefined, 12, 0xff9fb1c8, 'center');
    this.add(hint);
  }

  #panel(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    description: string,
  ): void {
    const panel = this.#sprite(x, y, width, height, COLORS.panel);
    panel.alpha = 0.82;
    const heading = new FlxText(x + 14, y + 12, width - 28, title);
    heading.setFormat(undefined, 13, COLORS.cyan, 'left');
    this.add(heading);
    const copy = new FlxText(x + 14, y + 34, width - 28, description);
    copy.setFormat(undefined, 10, 0xff91a4bd, 'left');
    this.add(copy);
  }
}
