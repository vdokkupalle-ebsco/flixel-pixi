/** Service token for the storage backend. @public */
export const FLX_STORAGE_SERVICE = Symbol('flixel-pixi.storage');

/**
 * Result of a `FlxSave.flush()` operation.
 * On failure, includes an error category and human-readable message.
 * @public
 */
export type FlxSaveResult =
  | { success: true }
  | {
      success: false;
      error: 'quota' | 'serialization' | 'unknown';
      message: string;
    };

/**
 * Replaceable storage backend.
 *
 * The default implementation uses `localStorage`; an optional `IndexedDB`
 * adapter is available for larger data.  A `NullStorageBackend` enables
 * headless testing.
 *
 * @public
 */
export interface FlxStorageBackend {
  /** Read the data record for `key`, or `null` if missing/malformed. */
  read(key: string): Record<string, unknown> | null;

  /** Write `data` for `key`.  Returns a typed success/failure result. */
  write(key: string, data: Record<string, unknown>): FlxSaveResult;

  /** Erase the record for `key`.  Returns true if a record was present. */
  erase(key: string): boolean;

  /** Release any resources associated with `key`. */
  close(key: string): void;
}
