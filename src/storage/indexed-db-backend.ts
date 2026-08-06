import type { FlxSaveResult, FlxStorageBackend } from './flx-storage-backend';

const STORE_NAME = 'flixel_saves';

/**
 * Optional IndexedDB-backed storage adapter.
 *
 * Provides the same synchronous-style `FlxStorageBackend` interface by
 * pre-opening the database.  Actual read/write operations use micro-task
 * transactions.
 *
 * **Usage:**
 * ```ts
 * const db = await IndexedDBBackend.open('my-game-saves');
 * const save = new FlxSave();
 * save.bind('slot1', { backend: db });
 * ```
 *
 * @public
 */
export class IndexedDBBackend implements FlxStorageBackend {
  readonly #db: IDBDatabase;
  /** In-memory mirror for synchronous reads after initial load. */
  readonly #cache = new Map<string, Record<string, unknown>>();

  private constructor(db: IDBDatabase) {
    this.#db = db;
  }

  /**
   * Open (or create) the named database and return a ready backend.
   * @param dbName - The IndexedDB database name.
   */
  static open(dbName: string): Promise<IndexedDBBackend> {
    return new Promise<IndexedDBBackend>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (): void => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (): void => {
        const backend = new IndexedDBBackend(request.result);
        // Pre-load all keys into the in-memory cache.
        backend
          .#preload()
          .then(() => resolve(backend))
          .catch(reject);
      };

      request.onerror = (): void => {
        reject(
          new Error(
            `[FlxSave] Failed to open IndexedDB "${dbName}": ${String(request.error)}`,
          ),
        );
      };
    });
  }

  read(key: string): Record<string, unknown> | null {
    const data = this.#cache.get(key);
    return data !== undefined ? { ...data } : null;
  }

  write(key: string, data: Record<string, unknown>): FlxSaveResult {
    try {
      const copy = { ...data };
      this.#cache.set(key, copy);
      // Fire-and-forget async write.
      this.#asyncWrite(key, copy);
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: 'unknown',
        message: String(error),
      };
    }
  }

  erase(key: string): boolean {
    const existed = this.#cache.has(key);
    this.#cache.delete(key);
    // Fire-and-forget async delete.
    this.#asyncDelete(key);
    return existed;
  }

  close(key: string): void {
    void key;
  }

  /** Close the underlying IDBDatabase connection. */
  closeDatabase(): void {
    this.#db.close();
  }

  #asyncWrite(key: string, data: Record<string, unknown>): void {
    try {
      const tx = this.#db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, key);
    } catch {
      console.warn(`[FlxSave] IndexedDB async write failed for key "${key}".`);
    }
  }

  #asyncDelete(key: string): void {
    try {
      const tx = this.#db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    } catch {
      console.warn(`[FlxSave] IndexedDB async delete failed for key "${key}".`);
    }
  }

  async #preload(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = this.#db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.openCursor();

        request.onsuccess = (): void => {
          const cursor = request.result;
          if (cursor) {
            if (
              typeof cursor.value === 'object' &&
              cursor.value !== null &&
              !Array.isArray(cursor.value)
            ) {
              this.#cache.set(
                cursor.key as string,
                cursor.value as Record<string, unknown>,
              );
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = (): void => {
          reject(request.error);
        };
      } catch (error: unknown) {
        reject(error);
      }
    });
  }
}
