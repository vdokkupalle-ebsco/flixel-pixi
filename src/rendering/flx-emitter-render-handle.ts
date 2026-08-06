import {
  Container,
  Particle,
  ParticleContainer,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxEmitter } from '../objects/flx-emitter';
import type { FlxParticle } from '../objects/flx-particle';
import type { FlxRenderHandle } from './flx-render-handle';

/** Selects the renderer-only projection used by an emitter. @public */
export interface FlxEmitterRenderOptions {
  optimized?: boolean;
  roundPixels?: boolean;
}

/** Pixi projection of an authoritative, group-backed emitter pool. @public */
export class FlxEmitterRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxEmitter' });
  readonly particleContainer: ParticleContainer<Particle> | null;
  readonly optimized: boolean;

  readonly #owner: FlxEmitter;
  readonly #onDestroy: () => void;
  readonly #particles = new Map<FlxParticle, Particle>();
  readonly #sprites = new Map<FlxParticle, Sprite>();
  readonly #bounds = new Rectangle();
  #destroyed = false;

  constructor(
    owner: FlxEmitter,
    options: FlxEmitterRenderOptions = {},
    onDestroy: () => void = () => undefined,
  ) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.optimized = options.optimized ?? false;
    this.particleContainer = this.optimized
      ? new ParticleContainer<Particle>({
          dynamicProperties: {
            color: true,
            position: true,
            rotation: true,
            uvs: true,
            vertex: true,
          },
          roundPixels: options.roundPixels ?? true,
        })
      : null;
    if (this.particleContainer !== null) {
      this.particleContainer.boundsArea = this.#bounds;
      this.view.addChild(this.particleContainer);
    }
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  get projectedParticleCount(): number {
    return this.optimized ? this.#particles.size : this.#sprites.size;
  }

  sync(camera?: FlxCamera): void {
    if (this.#destroyed) return;
    const members = this.#owner.members
      .slice(0, this.#owner.length)
      .filter((particle): particle is FlxParticle => particle !== null);
    if (this.optimized) this.#syncOptimizedMembers(members);
    else this.#syncSpriteMembers(members);

    for (const particle of members) {
      if (this.optimized) this.#syncParticle(particle, camera);
      else this.#syncSprite(particle, camera);
    }
    if (camera !== undefined) {
      this.#bounds.x = 0;
      this.#bounds.y = 0;
      this.#bounds.width = camera.width;
      this.#bounds.height = camera.height;
    }
    this.view.visible = this.#owner.exists && this.#owner.visible;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#particles.clear();
    this.#sprites.clear();
    this.view.destroy({ children: true });
    this.#onDestroy();
  }

  #syncOptimizedMembers(members: readonly FlxParticle[]): void {
    const container = this.particleContainer;
    if (container === null) return;
    let changed = false;
    for (const owner of [...this.#particles.keys()]) {
      if (!members.includes(owner)) {
        this.#particles.delete(owner);
        changed = true;
      }
    }
    for (const owner of members) {
      if (!this.#particles.has(owner)) {
        this.#particles.set(owner, new Particle(owner.renderTexture));
        changed = true;
      }
    }
    if (changed) {
      container.particleChildren = members.map((owner) => {
        return this.#particles.get(owner) as Particle;
      });
      container.texture =
        container.particleChildren[0]?.texture ?? Texture.EMPTY;
      container.update();
    }
  }

  #syncSpriteMembers(members: readonly FlxParticle[]): void {
    for (const [owner, sprite] of [...this.#sprites]) {
      if (!members.includes(owner)) {
        this.#sprites.delete(owner);
        sprite.destroy();
      }
    }
    for (const owner of members) {
      if (this.#sprites.has(owner)) continue;
      const sprite = new Sprite({ texture: owner.renderTexture });
      this.#sprites.set(owner, sprite);
      this.view.addChild(sprite);
    }
  }

  #syncParticle(owner: FlxParticle, camera?: FlxCamera): void {
    const particle = this.#particles.get(owner);
    if (particle === undefined) return;
    particle.texture = owner.renderTexture;
    particle.anchorX =
      owner.frameWidth > 0 ? owner.origin.x / owner.frameWidth : 0;
    particle.anchorY =
      owner.frameHeight > 0 ? owner.origin.y / owner.frameHeight : 0;
    particle.x = this.#screenX(owner, camera) + owner.origin.x;
    particle.y = this.#screenY(owner, camera) + owner.origin.y;
    particle.scaleX = owner.renderFlipped ? -owner.scale.x : owner.scale.x;
    particle.scaleY = owner.scale.y;
    particle.rotation = (owner.angle * Math.PI) / 180;
    particle.tint = owner.color;
    particle.alpha = owner.exists && owner.visible ? owner.alpha : 0;
  }

  #syncSprite(owner: FlxParticle, camera?: FlxCamera): void {
    const sprite = this.#sprites.get(owner);
    if (sprite === undefined) return;
    sprite.texture = owner.renderTexture;
    sprite.anchor.set(
      owner.frameWidth > 0 ? owner.origin.x / owner.frameWidth : 0,
      owner.frameHeight > 0 ? owner.origin.y / owner.frameHeight : 0,
    );
    sprite.position.set(
      this.#screenX(owner, camera) + owner.origin.x,
      this.#screenY(owner, camera) + owner.origin.y,
    );
    sprite.scale.set(
      owner.renderFlipped ? -owner.scale.x : owner.scale.x,
      owner.scale.y,
    );
    sprite.angle = owner.angle;
    sprite.alpha = owner.alpha;
    sprite.tint = owner.color;
    sprite.blendMode = owner.blend ?? 'normal';
    sprite.roundPixels = !owner.antialiasing;
    sprite.visible = owner.exists && owner.visible && owner.alpha > 0;
  }

  #screenX(owner: FlxParticle, camera?: FlxCamera): number {
    return (
      owner.x -
      owner.offset.x -
      Math.trunc((camera?.scroll.x ?? 0) * owner.scrollFactor.x)
    );
  }

  #screenY(owner: FlxParticle, camera?: FlxCamera): number {
    return (
      owner.y -
      owner.offset.y -
      Math.trunc((camera?.scroll.y ?? 0) * owner.scrollFactor.y)
    );
  }
}
