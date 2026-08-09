import type {
  FlxAsyncStorageBackend,
  FlxSaveResult,
} from './flx-storage-backend';

const STORE_NAME = 'flixel_saves';

/**
 * Optional IndexedDB-backed storage adapter.
 *
 * Reads from a cache populated while opening. Writes and erases must use the
 * async `FlxSave` methods so their results represent transaction completion.
 *
 * **Usage:**
 * ```ts
 * const db = await IndexedDBBackend.open('my-game-saves');
 * const save = new FlxSave();
 * save.bind('slot1', { backend: db });
 * await save.flushAsync();
 * ```
 *
 * @public
 */
export class IndexedDBBackend implements FlxAsyncStorageBackend {
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
    void key;
    void data;
    return {
      success: false,
      error: 'async',
      message: 'IndexedDB writes must be awaited with FlxSave.flushAsync().',
    };
  }

  erase(key: string): boolean {
    void key;
    return false;
  }

  /** Persist a record and resolve only after its transaction commits. */
  writeAsync(
    key: string,
    data: Record<string, unknown>,
  ): Promise<FlxSaveResult> {
    const copy = { ...data };
    return new Promise<FlxSaveResult>((resolve) => {
      try {
        const tx = this.#db.transaction(STORE_NAME, 'readwrite');
        const request = tx.objectStore(STORE_NAME).put(copy, key);
        tx.oncomplete = (): void => {
          this.#cache.set(key, copy);
          resolve({ success: true });
        };
        const fail = (): void =>
          resolve(this.#failure(tx.error ?? request.error));
        tx.onerror = fail;
        tx.onabort = fail;
      } catch (error: unknown) {
        resolve(this.#failure(error));
      }
    });
  }

  /** Delete a record and resolve only after its transaction commits. */
  eraseAsync(key: string): Promise<boolean> {
    const existed = this.#cache.has(key);
    return new Promise<boolean>((resolve) => {
      try {
        const tx = this.#db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = (): void => {
          this.#cache.delete(key);
          resolve(existed);
        };
        tx.onerror = (): void => resolve(false);
        tx.onabort = (): void => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  close(key: string): void {
    void key;
  }

  /** Close the underlying IDBDatabase connection. */
  closeDatabase(): void {
    this.#db.close();
  }

  #failure(error: unknown): FlxSaveResult {
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: 'quota',
          message: `IndexedDB quota exceeded: ${error.message}`,
        };
      }
      if (error.name === 'DataCloneError') {
        return {
          success: false,
          error: 'serialization',
          message: `IndexedDB could not clone save data: ${error.message}`,
        };
      }
    }
    return {
      success: false,
      error: 'unknown',
      message: String(error),
    };
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
