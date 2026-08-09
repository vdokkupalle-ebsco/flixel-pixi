import type { FlxBasic } from './flx-basic';
import { FlxGroup } from './flx-group';

/**
 * Exclusive logical group. A member can belong to only one `FlxContainer`;
 * adding it elsewhere reparents it synchronously.
 * @public
 */
export class FlxContainer<T extends FlxBasic = FlxBasic> extends FlxGroup<T> {
  override replace(oldObject: T, newObject: T): T | null {
    if (oldObject !== newObject && this.members.includes(newObject))
      return null;
    return super.replace(oldObject, newObject);
  }

  /** @internal */
  protected override onMemberAdd(object: T): void {
    const previous = object.container;
    if (previous !== null && previous !== this) previous.remove(object);
    object.container = this;
  }

  /** @internal */
  protected override onMemberRemove(object: T): void {
    if (object.container === this) object.container = null;
  }
}
