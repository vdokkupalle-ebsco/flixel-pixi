import type {
  FlxSaveResult,
  FlxStorageBackend,
} from './flx-storage-backend';

/** Version field stored alongside user data for schema migration. @internal */
const VERSION_KEY = '__version';

/**
 * Callback for migrating save data between schema versions.
 * @public
 */
export type FlxSaveMigration = (
  oldData: Record<string, unknown>,
  oldVersion: number,
) => Record<string, unknown>;

/**
 * Options for `FlxSave.bind()`.
 * @public
 */
export interface FlxSaveBindOptions {
  /** Schema version.  Defaults to 0 (no versioning). */
  version?: number;
  /** Migration callback invoked when the stored version differs. */
  migrate?: FlxSaveMigration;
  /** Override the storage backend for this save slot. */
  backend?: FlxStorageBackend;
}

/**
 * Port of `org.flixel.FlxSave`.
 *
 * Provides namespaced, versioned save slots backed by a replaceable
 * `FlxStorageBackend`.  The default backend is provided by the `FlxContext`
 * service map (typically `LocalStorageBackend`).
 *
 * @public
 */
export class FlxSave {
  /** Slot name set by `bind()`. */
  name: string | null = null;

  /** User-facing data object.  Read and mutate freely between `bind()` and `close()`. */
  data: Record<string, unknown> | null = null;

  #backend: FlxStorageBackend | null = null;
  #bound = false;

  /**
   * Bind this save to a named slot.
   *
   * Reads existing data from the backend.  If a `version` is provided and the
   * stored version differs, the `migrate` callback transforms the data in-place
   * and the result is flushed back immediately.
   *
   * @param name - The slot name (namespaced automatically by the backend).
   * @param options - Optional version, migration, and backend override.
   * @returns `true` if data was loaded (even if empty), `false` on error.
   */
  bind(
    name: string,
    options: FlxSaveBindOptions = {},
  ): boolean {
    if (this.#bound) this.close();

    const backend = options.backend ?? null;
    if (backend === null) {
      // Backend must be provided explicitly or set by the manager.
      this.#backend = null;
    } else {
      this.#backend = backend;
    }

    this.name = name;
    this.#bound = true;

    if (this.#backend === null) {
      // No backend available — create empty data.
      this.data = {};
      return true;
    }

    const stored = this.#backend.read(name);
    if (stored === null) {
      this.data = {};
      if (options.version !== undefined) {
        (this.data as Record<string, unknown>)[VERSION_KEY] =
          options.version;
        this.flush();
      }
      return true;
    }

    // --- Schema migration ---
    const storedVersion =
      typeof stored[VERSION_KEY] === 'number'
        ? (stored[VERSION_KEY] as number)
        : 0;

    const requestedVersion = options.version ?? 0;

    if (storedVersion !== requestedVersion && options.migrate) {
      const migrated = options.migrate(stored, storedVersion);
      migrated[VERSION_KEY] = requestedVersion;
      this.data = migrated;
      this.flush();
    } else {
      this.data = stored;
    }

    return true;
  }

  /**
   * Set the backend after construction (used by FlxG/manager integration).
   * @internal
   */
  _setBackend(backend: FlxStorageBackend): void {
    this.#backend = backend;
  }

  /**
   * Persist the current `data` to the storage backend.
   * @returns A typed result indicating success or the failure category.
   */
  flush(): FlxSaveResult {
    if (!this.#bound || this.name === null || this.data === null) {
      return {
        success: false,
        error: 'unknown',
        message: 'FlxSave is not bound to a slot.',
      };
    }
    if (this.#backend === null) {
      return {
        success: false,
        error: 'unknown',
        message: 'No storage backend is available.',
      };
    }
    return this.#backend.write(this.name, this.data);
  }

  /** Erase all stored data for this slot. */
  erase(): boolean {
    if (!this.#bound || this.name === null || this.#backend === null) {
      return false;
    }
    const result = this.#backend.erase(this.name);
    this.data = {};
    return result;
  }

  /** Flush and disconnect from the slot. */
  close(): void {
    if (!this.#bound) return;
    this.flush();
    if (this.#backend !== null && this.name !== null) {
      this.#backend.close(this.name);
    }
    this.name = null;
    this.data = null;
    this.#backend = null;
    this.#bound = false;
  }

  /** Release all resources. */
  destroy(): void {
    this.close();
  }
}
