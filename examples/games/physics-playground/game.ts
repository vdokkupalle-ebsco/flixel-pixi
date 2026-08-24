import {
  FlxG,
  FlxPhysicsWorld,
  FlxSprite,
  FlxState,
  FlxText,
  type FlxPhysicsBody,
  type FlxPhysicsContact,
} from 'flixel-pixi';
import { createPlanckPhysicsBackend } from '@flixel-pixi/physics-planck';

const WIDTH = 760;
const HEIGHT = 460;

const COLORS = {
  background: 0xff08111f,
  cyan: 0x1de8f1ff,
  floor: 0x26384fff,
  pink: 0xff397eff,
  sensor: 0xa855f7ff,
  text: 0xffe8eef7,
  yellow: 0xffd166ff,
} as const;

export interface PhysicsPlaygroundSnapshot {
  readonly bodies: number;
  readonly contacts: number;
  readonly dynamicY: number;
  readonly lastEvent: string;
  readonly query: string;
  readonly sensorEntries: number;
}

interface DynamicEntry {
  readonly body: FlxPhysicsBody;
  readonly sprite: FlxSprite;
  highlight: number;
}

/** Playable proof for the public, renderer-neutral physics API. */
export class PhysicsPlaygroundState extends FlxState {
  world!: FlxPhysicsWorld;
  sweeper!: FlxSprite;
  sensor!: FlxSprite;
  contactCount = 0;
  sensorEntries = 0;
  lastEvent = 'waiting for first contact';
  queryResult = 'click a body to query + nudge it';

  readonly #dynamic: DynamicEntry[] = [];
  #hud!: FlxText;
  #queryHud!: FlxText;
  #sensorOccupants = new Set<string>();

  override create(): void {
    super.create();
    FlxG.camera.bgColor = COLORS.background;

    this.world = new FlxPhysicsWorld(createPlanckPhysicsBackend(), {
      gravity: { x: 0, y: 820 },
    });
    this.setPhysicsWorld(this.world);

    this.#addBackdrop();
    this.#addStaticBox(0, 424, WIDTH, 36, COLORS.floor, 'floor');
    this.#addStaticBox(38, 330, 188, 18, 0x1b6b7aff, 'left-platform');
    this.#addStaticBox(534, 286, 188, 18, 0x7a2447ff, 'right-platform');
    this.#addStaticBox(0, 0, 18, HEIGHT, COLORS.floor, 'left-wall');
    this.#addStaticBox(WIDTH - 18, 0, 18, HEIGHT, COLORS.floor, 'right-wall');

    this.sensor = new FlxSprite(288, 324).makeGraphic(184, 100, COLORS.sensor);
    this.sensor.alpha = 0.18;
    this.add(this.sensor);
    this.world.addBody(this.sensor, {
      id: 'sensor-zone',
      type: 'static',
      shapes: [
        {
          id: 'sensor',
          kind: 'box',
          width: this.sensor.width,
          height: this.sensor.height,
          sensor: true,
        },
      ],
    });

    this.sweeper = new FlxSprite(270, 248).makeGraphic(112, 18, COLORS.pink);
    this.sweeper.velocity.x = 82;
    this.add(this.sweeper);
    this.world.addBody(this.sweeper, {
      id: 'kinematic-sweeper',
      type: 'kinematic',
      shapes: [{ kind: 'box', width: 112, height: 18 }],
      material: { friction: 0.55, restitution: 0.1 },
    });

    this.#addDynamicBox(142, 72, 36, 36, COLORS.cyan, 'cyan-crate');
    this.#addDynamicBox(196, 38, 44, 44, COLORS.yellow, 'yellow-crate');
    this.#addDynamicCircle(574, 92, 17, COLORS.pink, 'pink-ball');
    this.#addDynamicCircle(626, 42, 21, COLORS.cyan, 'cyan-ball');
    this.#addDynamicCircle(368, 330, 12, COLORS.yellow, 'sensor-probe');

    this.world.contactStarted.add((contact) => this.#onContact(contact));
    this.world.contactStayed.add((contact) => this.#onContact(contact));
    this.world.contactEnded.add((contact) => this.#onContact(contact));

    this.#hud = new FlxText(28, 18, 704, '');
    this.#hud.setFormat(undefined, 13, COLORS.text, 'left');
    this.#hud.scrollFactor.make(0, 0);
    this.add(this.#hud);

    this.#queryHud = new FlxText(28, 42, 704, this.queryResult);
    this.#queryHud.setFormat(undefined, 12, 0xff9fb1c8, 'left');
    this.#queryHud.scrollFactor.make(0, 0);
    this.add(this.#queryHud);
  }

  override update(): void {
    if (this.sweeper.x <= 238) this.sweeper.velocity.x = 82;
    else if (this.sweeper.x + this.sweeper.width >= 522) {
      this.sweeper.velocity.x = -82;
    }

    for (const entry of this.#dynamic) {
      if (entry.highlight > 0) {
        entry.highlight = Math.max(0, entry.highlight - FlxG.elapsed);
        entry.sprite.alpha = 0.55;
      } else {
        entry.sprite.alpha = 1;
      }
    }

    if (FlxG.mouse.justPressed()) {
      const pointer = FlxG.mouse.getWorldPosition();
      this.queryAt(pointer.x, pointer.y, true);
    }

    this.#hud.text = `${this.world.bodyCount} bodies · ${this.contactCount} active contacts · ${this.sensorEntries} sensor entries`;
    this.#queryHud.text = this.queryResult;
    super.update();
  }

  queryAt(x: number, y: number, nudge = false): string {
    const hit = this.world.queryPoint({ x, y })[0];
    if (hit === undefined) {
      this.queryResult = `query ${Math.round(x)}, ${Math.round(y)} → empty`;
      return this.queryResult;
    }
    this.queryResult = `query ${Math.round(x)}, ${Math.round(y)} → ${hit.body.id}`;
    const entry = this.#dynamic.find(
      (candidate) => candidate.body === hit.body,
    );
    if (entry !== undefined) {
      entry.highlight = 0.24;
      if (nudge) entry.body.applyImpulse({ x: 0, y: -0.42 });
    }
    return this.queryResult;
  }

  snapshot(): PhysicsPlaygroundSnapshot {
    return {
      bodies: this.world.bodyCount,
      contacts: this.contactCount,
      dynamicY: this.#dynamic[0]?.sprite.y ?? Number.NaN,
      lastEvent: this.lastEvent,
      query: this.queryResult,
      sensorEntries: this.sensorEntries,
    };
  }

  #addBackdrop(): void {
    const title = new FlxText(28, 82, 704, 'RIGID BODY PLAYGROUND');
    title.setFormat(undefined, 23, COLORS.text, 'center');
    title.alpha = 0.12;
    this.add(title);

    const sensorLabel = new FlxText(300, 382, 160, 'SENSOR ZONE');
    sensorLabel.setFormat(undefined, 11, 0xffd8b4fe, 'center');
    sensorLabel.alpha = 0.82;
    this.add(sensorLabel);
  }

  #addStaticBox(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    id: string,
  ): void {
    const sprite = new FlxSprite(x, y).makeGraphic(width, height, color);
    this.add(sprite);
    this.world.addBody(sprite, {
      id,
      type: 'static',
      shapes: [{ kind: 'box', width, height }],
      material: { friction: 0.7, restitution: 0.08 },
    });
  }

  #addDynamicBox(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    id: string,
  ): void {
    const sprite = new FlxSprite(x, y).makeGraphic(width, height, color);
    this.add(sprite);
    const body = this.world.addBody(sprite, {
      id,
      type: 'dynamic',
      shapes: [{ kind: 'box', width, height }],
      material: { density: 0.9, friction: 0.48, restitution: 0.22 },
    });
    this.#dynamic.push({ body, sprite, highlight: 0 });
  }

  #addDynamicCircle(
    x: number,
    y: number,
    radius: number,
    color: number,
    id: string,
  ): void {
    const diameter = radius * 2;
    const sprite = new FlxSprite(x, y).makeGraphic(diameter, diameter, color);
    this.add(sprite);
    const body = this.world.addBody(sprite, {
      id,
      type: 'dynamic',
      shapes: [{ kind: 'circle', radius }],
      material: { density: 0.75, friction: 0.25, restitution: 0.66 },
    });
    this.#dynamic.push({ body, sprite, highlight: 0 });
  }

  #onContact(contact: FlxPhysicsContact): void {
    this.lastEvent = `${contact.phase}: ${contact.bodyA.id} ↔ ${contact.bodyB.id}`;
    if (!contact.sensor) {
      if (contact.phase === 'begin') this.contactCount += 1;
      else if (contact.phase === 'end') {
        this.contactCount = Math.max(0, this.contactCount - 1);
      }
      return;
    }

    const other =
      contact.bodyA.id === 'sensor-zone' ? contact.bodyB : contact.bodyA;
    if (contact.phase === 'begin') {
      this.#sensorOccupants.add(other.id);
      this.sensorEntries += 1;
    } else if (contact.phase === 'end') {
      this.#sensorOccupants.delete(other.id);
    }
    this.sensor.alpha = this.#sensorOccupants.size > 0 ? 0.38 : 0.18;
  }
}
