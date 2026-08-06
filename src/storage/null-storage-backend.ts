import type { FlxSaveResult, FlxStorageBackend } from './flx-storage-backend';

/**
 * In-memory storage backend for headless unit tests.
 * Data lives only for the lifetime of this instance.
 * @public
 */
export class NullStorageBackend implements FlxStorageBackend {
  readonly #store = new Map<string, Record<string, unknown>>();

  read(key: string): Record<string, unknown> | null {
    const data = this.#store.get(key);
    return data !== undefined ? { ...data } : null;
  }

  write(key: string, data: Record<string, unknown>): FlxSaveResult {
    this.#store.set(key, { ...data });
    return { success: true };
  }

  erase(key: string): boolean {
    return this.#store.delete(key);
  }

  close(key: string): void {
    void key;
  }
}
