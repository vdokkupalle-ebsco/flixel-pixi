import {
  FlxG,
  FlxGraphics,
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

const DRAG_STRENGTH = 13;
const MAX_DRAG_SPEED = 900;

interface DragState {
  readonly body: FlxPhysicsBody;
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface PhysicsJointsSnapshot {
  readonly distanceX: number;
  readonly distanceY: number;
  readonly draggableCount: number;
  readonly draggingId: string | null;
  readonly jointCount: number;
  readonly prismaticX: number;
  readonly revoluteAngle: number;
  readonly wheelAngle: number;
}

/** Interactive, playable proof for all portable joint definitions. */
export class PhysicsJointsState extends FlxState {
  world!: FlxPhysicsWorld;
  #connectors!: FlxGraphics;
  #distanceBob!: FlxSprite;
  #drag: DragState | undefined;
  readonly #draggables = new Set<FlxPhysicsBody>();
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
      'DISTANCE · CRANE LOAD',
      'A damped hoist cable keeps cargo at a fixed reach.',
      'DRAG THE CARGO',
    );
    this.#panel(
      320,
      96,
      260,
      184,
      'REVOLUTE · SWING GATE',
      'A powered hinge rotates while angular stops limit travel.',
      'DRAG THE GATE',
    );
    this.#panel(
      616,
      96,
      260,
      184,
      'PRISMATIC · SLIDING DOOR',
      'A warehouse door travels on one rail and nowhere else.',
      'DRAG THE DOOR',
    );
    this.#panel(
      172,
      316,
      260,
      184,
      'WELD · ROBOT TOOL',
      'A tool head stays rigidly attached to its moving arm.',
      'DRAG THE ARM',
    );
    this.#panel(
      468,
      316,
      260,
      184,
      'WHEEL · SUSPENSION',
      'A driven wheel moves vertically on a damped spring.',
      'DRAG THE WHEEL',
    );

    this.#connectors = new FlxGraphics(0, 0, 900, 540);
    this.add(this.#connectors);
    this.#distanceDemo();
    this.#revoluteDemo();
    this.#prismaticDemo();
    this.#weldDemo();
    this.#wheelDemo();
  }

  override update(): void {
    this.#updateDragging();

    if (this.#drag?.body !== this.#prismaticBody) {
      if (this.#prismaticSprite.x > 803) {
        this.#prismaticBody.setVelocity({ x: -72, y: 0 });
      } else if (this.#prismaticSprite.x < 684) {
        this.#prismaticBody.setVelocity({ x: 72, y: 0 });
      }
    }

    this.#drawConnectors();
    super.update();
  }

  snapshot(): PhysicsJointsSnapshot {
    return {
      distanceX: this.#distanceBob.x + this.#distanceBob.width / 2,
      distanceY: this.#distanceBob.y + this.#distanceBob.height / 2,
      draggableCount: this.#draggables.size,
      draggingId: this.#drag?.body.id ?? null,
      jointCount: this.world.jointCount,
      prismaticX: this.#prismaticSprite.x,
      revoluteAngle: this.#revoluteSprite.angle,
      wheelAngle: this.#wheelSprite.angle,
    };
  }

  #distanceDemo(): void {
    this.#sprite(48, 158, 184, 8, COLORS.floor);
    const anchor = this.#body(
      146,
      160,
      16,
      16,
      COLORS.muted,
      'distance-anchor',
      'static',
    );
    this.#distanceBob = this.#sprite(177, 201, 56, 34, COLORS.cyan);
    const cargo = this.world.addBody(this.#distanceBob, {
      id: 'distance-cargo',
      type: 'dynamic',
      shapes: [{ kind: 'box', width: 56, height: 34 }],
      material: { density: 0.8, friction: 0.3, restitution: 0.15 },
    });
    this.#draggables.add(cargo);
    this.world.addJoint({
      id: 'distance-demo',
      type: 'distance',
      bodyA: anchor,
      bodyB: cargo,
      anchorA: { x: 154, y: 168 },
      anchorB: { x: 205, y: 218 },
      length: 66,
      frequencyHz: 2.2,
      dampingRatio: 0.18,
    });
  }

  #revoluteDemo(): void {
    this.#sprite(348, 230, 204, 6, COLORS.floor);
    const pivot = this.#body(
      356,
      174,
      18,
      18,
      COLORS.muted,
      'revolute-pivot',
      'static',
    );
    this.#revoluteSprite = this.#sprite(365, 175, 104, 16, COLORS.pink);
    const gate = this.world.addBody(this.#revoluteSprite, {
      id: 'revolute-gate',
      type: 'dynamic',
      shapes: [{ kind: 'box', width: 104, height: 16 }],
      material: { density: 0.65, friction: 0.3 },
    });
    this.#draggables.add(gate);
    this.world.addJoint({
      id: 'revolute-demo',
      type: 'revolute',
      bodyA: pivot,
      bodyB: gate,
      anchor: { x: 365, y: 183 },
      enableLimit: true,
      lowerAngle: -50,
      upperAngle: 50,
      enableMotor: true,
      motorSpeed: 38,
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
    this.#prismaticSprite = this.#sprite(730, 168, 42, 48, COLORS.yellow);
    this.#prismaticBody = this.world.addBody(this.#prismaticSprite, {
      id: 'prismatic-door',
      type: 'dynamic',
      fixedRotation: true,
      shapes: [{ kind: 'box', width: 42, height: 48 }],
      material: { density: 0.8, friction: 0.1 },
    });
    this.#draggables.add(this.#prismaticBody);
    this.world.addJoint({
      id: 'prismatic-demo',
      type: 'prismatic',
      bodyA: rail,
      bodyB: this.#prismaticBody,
      anchor: { x: 751, y: 192 },
      axis: { x: 1, y: 0 },
      enableLimit: true,
      lowerTranslation: -72,
      upperTranslation: 72,
    });
    this.#prismaticBody.setVelocity({ x: 72, y: 0 });
  }

  #weldDemo(): void {
    const armSprite = this.#sprite(238, 398, 112, 18, COLORS.violet);
    const arm = this.world.addBody(armSprite, {
      id: 'weld-robot-arm',
      type: 'kinematic',
      shapes: [{ kind: 'box', width: 112, height: 18 }],
    });
    const tool = this.#body(
      338,
      384,
      38,
      46,
      COLORS.cyan,
      'weld-tool-head',
      'dynamic',
    );
    this.#draggables.add(arm);
    this.world.addJoint({
      id: 'weld-demo',
      type: 'weld',
      bodyA: arm,
      bodyB: tool,
      anchor: { x: 344, y: 407 },
    });
  }

  #wheelDemo(): void {
    const chassis = this.#body(
      530,
      382,
      136,
      24,
      COLORS.violet,
      'wheel-chassis',
      'static',
    );
    this.#wheelSprite = this.#sprite(575, 421, 46, 46, COLORS.pink);
    const wheel = this.world.addBody(this.#wheelSprite, {
      id: 'wheel-tire',
      type: 'dynamic',
      shapes: [{ kind: 'circle', radius: 23 }],
      material: { density: 1, friction: 0.8, restitution: 0.05 },
    });
    this.#draggables.add(wheel);
    this.world.addJoint({
      id: 'wheel-demo',
      type: 'wheel',
      bodyA: chassis,
      bodyB: wheel,
      anchor: { x: 598, y: 444 },
      axis: { x: 0, y: 1 },
      enableMotor: true,
      motorSpeed: 180,
      maxMotorTorque: 32_000,
      frequencyHz: 4,
      dampingRatio: 0.65,
    });
  }

  #updateDragging(): void {
    const pointer = FlxG.mouse.getWorldPosition();
    if (FlxG.mouse.justPressed()) {
      let body = this.world
        .queryPoint(pointer)
        .find(({ body }) => this.#draggables.has(body))?.body;
      body ??= this.world
        .queryAabb({
          x: pointer.x - 12,
          y: pointer.y - 12,
          width: 24,
          height: 24,
        })
        .find(({ body }) => this.#draggables.has(body))?.body;
      body ??= [...this.#draggables].find(({ object }) =>
        containsWithPadding(object, pointer.x, pointer.y, 12),
      );
      if (body !== undefined) {
        const centerX = body.object.x + body.object.width / 2;
        const centerY = body.object.y + body.object.height / 2;
        this.#drag = {
          body,
          offsetX: pointer.x - centerX,
          offsetY: pointer.y - centerY,
        };
      }
    }

    if (this.#drag !== undefined && FlxG.mouse.pressed()) {
      const object = this.#drag.body.object;
      const centerX = object.x + object.width / 2;
      const centerY = object.y + object.height / 2;
      const targetX = pointer.x - this.#drag.offsetX;
      const targetY = pointer.y - this.#drag.offsetY;
      this.#drag.body.setVelocity({
        x: clamp(
          (targetX - centerX) * DRAG_STRENGTH,
          -MAX_DRAG_SPEED,
          MAX_DRAG_SPEED,
        ),
        y: clamp(
          (targetY - centerY) * DRAG_STRENGTH,
          -MAX_DRAG_SPEED,
          MAX_DRAG_SPEED,
        ),
      });
    }

    if (
      this.#drag !== undefined &&
      (FlxG.mouse.justReleased() || FlxG.mouse.justCancelled())
    ) {
      if (this.#drag.body.type === 'kinematic') {
        this.#drag.body.setVelocity({ x: 0, y: 0 });
      }
      this.#drag = undefined;
    }
  }

  #drawConnectors(): void {
    const stroke = {
      cap: 'round' as const,
      fill: COLORS.muted,
      width: 3,
    };
    this.#connectors
      .clearGraphics()
      .line(
        [
          154,
          168,
          this.#distanceBob.x + this.#distanceBob.width / 2,
          this.#distanceBob.y + this.#distanceBob.height / 2,
        ],
        stroke,
      )
      .line(
        [
          598,
          406,
          this.#wheelSprite.x + this.#wheelSprite.width / 2,
          this.#wheelSprite.y + this.#wheelSprite.height / 2,
        ],
        stroke,
      );
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
    const title = new FlxText(24, 20, 852, 'JOINTS AT WORK');
    title.setFormat(undefined, 24, COLORS.text, 'center');
    this.add(title);
    const hint = new FlxText(
      24,
      54,
      852,
      'Drag the bright objects · the constraints keep doing their job',
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
    action: string,
  ): void {
    const panel = this.#sprite(x, y, width, height, COLORS.panel);
    panel.alpha = 0.82;
    const heading = new FlxText(x + 14, y + 12, width - 28, title);
    heading.setFormat(undefined, 12, COLORS.cyan, 'left');
    this.add(heading);
    const copy = new FlxText(x + 14, y + 34, width - 28, description);
    copy.setFormat(undefined, 10, 0xff91a4bd, 'left');
    this.add(copy);
    const prompt = new FlxText(x + 14, y + height - 24, width - 28, action);
    prompt.setFormat(undefined, 9, COLORS.yellow, 'right');
    this.add(prompt);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function containsWithPadding(
  object: FlxPhysicsBody['object'],
  x: number,
  y: number,
  padding: number,
): boolean {
  return (
    x >= object.x - padding &&
    x <= object.x + object.width + padding &&
    y >= object.y - padding &&
    y <= object.y + object.height + padding
  );
}
