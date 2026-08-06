import type { FlxSaveResult, FlxStorageBackend } from './flx-storage-backend';

const KEY_PREFIX = 'flixel:';

/**
 * `localStorage`-backed storage implementation.
 *
 * Keys are namespaced as `flixel:{name}` to avoid collisions with other web
 * applications.  Quota failures are detected via `DOMException` and surfaced
 * through the `FlxSaveResult` type.  Malformed stored JSON returns `null` and
 * logs a console warning rather than throwing.
 *
 * @public
 */
export class LocalStorageBackend implements FlxStorageBackend {
  read(key: string): Record<string, unknown> | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(KEY_PREFIX + key);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        console.warn(
          `[FlxSave] Malformed data for key "${key}": expected a plain object.`,
        );
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      console.warn(`[FlxSave] Failed to parse stored data for key "${key}".`);
      return null;
    }
  }

  write(key: string, data: Record<string, unknown>): FlxSaveResult {
    if (typeof localStorage === 'undefined') {
      return {
        success: false,
        error: 'unknown',
        message: 'localStorage is not available in this environment.',
      };
    }
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(KEY_PREFIX + key, json);
      return { success: true };
    } catch (error: unknown) {
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22)
      ) {
        return {
          success: false,
          error: 'quota',
          message: `localStorage quota exceeded for key "${key}".`,
        };
      }
      if (error instanceof TypeError) {
        return {
          success: false,
          error: 'serialization',
          message: `Failed to serialize data for key "${key}": ${String(error)}`,
        };
      }
      return {
        success: false,
        error: 'unknown',
        message: String(error),
      };
    }
  }

  erase(key: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    const existed = localStorage.getItem(KEY_PREFIX + key) !== null;
    localStorage.removeItem(KEY_PREFIX + key);
    return existed;
  }

  close(key: string): void {
    void key;
  }
}
