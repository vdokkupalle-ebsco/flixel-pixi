import { FlxG } from '../core/flx-g';
import { FlxObject } from './flx-object';
import { FlxSprite } from './flx-sprite';

/** Sprite with lifespan and gravity-contact behavior for emitters. @public */
export class FlxParticle extends FlxSprite {
  lifespan = 0;
  friction = 500;

  override update(): void {
    if (this.lifespan <= 0) return;
    this.lifespan -= FlxG.elapsed;
    if (this.lifespan <= 0) this.kill();

    if (this.touching !== FlxObject.NONE && this.angularVelocity !== 0) {
      this.angularVelocity = -this.angularVelocity;
    }
    if (this.acceleration.y <= 0) return;
    if ((this.touching & FlxObject.FLOOR) !== 0) {
      this.drag.x = this.friction;
      if ((this.wasTouching & FlxObject.FLOOR) === 0) {
        if (this.velocity.y < -this.elasticity * 10) {
          if (this.angularVelocity !== 0) {
            this.angularVelocity *= -this.elasticity;
          }
        } else {
          this.velocity.y = 0;
          this.angularVelocity = 0;
        }
      }
    } else {
      this.drag.x = 0;
    }
  }

  /** Hook invoked after the emitter has reset all launch properties. */
  onEmit(): void {
    // Extension hook for custom particle behavior.
  }
}
