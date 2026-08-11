import type { FlxSound } from './flx-sound';

/** A hierarchical volume and mute bus for {@link FlxSound} instances. @public */
export class FlxSoundGroup {
  readonly name: string;
  readonly parent: FlxSoundGroup | null;

  readonly #children = new Set<FlxSoundGroup>();
  readonly #sounds = new Set<FlxSound>();
  #volume = 1;
  #muted = false;
  #destroyed = false;

  constructor(name: string, parent: FlxSoundGroup | null = null) {
    const normalizedName = name.trim();
    if (normalizedName.length === 0) {
      throw new Error('FlxSoundGroup name cannot be empty.');
    }
    this.name = normalizedName;
    this.parent = parent;
    if (parent !== null) parent.#children.add(this);
  }

  get volume(): number {
    return this.#volume;
  }

  set volume(value: number) {
    this.#volume = Math.max(0, Math.min(1, value));
    this.#syncTree();
  }

  get mute(): boolean {
    return this.#muted;
  }

  set mute(value: boolean) {
    this.#muted = value;
    this.#syncTree();
  }

  /** Volume after applying every ancestor bus. */
  get actualVolume(): number {
    return this.#volume * (this.parent?.actualVolume ?? 1);
  }

  /** Whether this bus or any ancestor bus is muted. */
  get muted(): boolean {
    return this.#muted || (this.parent?.muted ?? false);
  }

  get soundCount(): number {
    return this.#sounds.size;
  }

  /** Route a sound through this bus, removing it from its previous bus. */
  add(sound: FlxSound): FlxSound {
    if (this.#destroyed)
      throw new Error(`Sound group "${this.name}" is destroyed.`);
    if (sound.group === this) return sound;
    sound.group?.remove(sound);
    this.#sounds.add(sound);
    sound._setGroup(this);
    return sound;
  }

  /** Stop routing a sound through this bus. */
  remove(sound: FlxSound): FlxSound {
    if (this.#sounds.delete(sound)) sound._setGroup(null);
    return sound;
  }

  /** Create a child bus whose effective settings include this bus. */
  createChild(name: string): FlxSoundGroup {
    if (this.#destroyed)
      throw new Error(`Sound group "${this.name}" is destroyed.`);
    return new FlxSoundGroup(name, this);
  }

  /** Detach sounds and recursively destroy child buses. */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    for (const child of [...this.#children]) child.destroy();
    for (const sound of [...this.#sounds]) this.remove(sound);
    if (this.parent !== null) this.parent.#children.delete(this);
  }

  #syncTree(): void {
    for (const sound of this.#sounds) sound._syncGroupVolume();
    for (const child of this.#children) child.#syncTree();
  }
}
