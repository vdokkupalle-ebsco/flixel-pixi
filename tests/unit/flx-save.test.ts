import { describe, expect, it } from 'vitest';
import { FlxSave } from '../../src/storage/flx-save';
import { NullStorageBackend } from '../../src/storage/null-storage-backend';
import { LocalStorageBackend } from '../../src/storage/local-storage-backend';
import { FlxContext } from '../../src/core/flx-context';
import { FlxG } from '../../src/core/flx-g';
import { FLX_STORAGE_SERVICE } from '../../src/storage/flx-storage-backend';
import type {
  FlxAsyncStorageBackend,
  FlxSaveResult,
} from '../../src/storage/flx-storage-backend';

describe('FlxSave and Storage Backends', () => {
  it('handles bind, read, write, flush, erase, and close on NullStorageBackend', () => {
    const backend = new NullStorageBackend();
    const save = new FlxSave();

    save.bind('slot1', { backend });
    expect(save.name).toBe('slot1');
    expect(save.data).toEqual({});

    if (save.data) {
      save.data.score = 100;
      save.data.name = 'Hero';
    }

    const result = save.flush();
    expect(result.success).toBe(true);

    // Read back in new save instance
    const save2 = new FlxSave();
    save2.bind('slot1', { backend });
    expect(save2.data?.score).toBe(100);
    expect(save2.data?.name).toBe('Hero');

    // Erase
    const erased = save2.erase();
    expect(erased).toBe(true);
    expect(save2.data).toEqual({});

    save.close();
    save2.close();
  });

  it('performs schema migration when version changes', () => {
    const backend = new NullStorageBackend();

    // Version 1 save
    const saveV1 = new FlxSave();
    saveV1.bind('player_data', {
      version: 1,
      backend,
    });
    if (saveV1.data) {
      saveV1.data.coins = 50;
    }
    saveV1.flush();
    saveV1.close();

    // Version 2 save with migration
    const saveV2 = new FlxSave();
    saveV2.bind('player_data', {
      version: 2,
      backend,
      migrate: (oldData, oldVersion) => {
        expect(oldVersion).toBe(1);
        return {
          coins: oldData.coins,
          gems: 10, // New field added in v2
        };
      },
    });

    expect(saveV2.data?.coins).toBe(50);
    expect(saveV2.data?.gems).toBe(10);
    expect(saveV2.data?.__version).toBe(2);

    saveV2.close();
  });

  it('survives malformed stored data gracefully', () => {
    const memoryMap = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => memoryMap.get(k) ?? null,
      setItem: (k: string, v: string) => memoryMap.set(k, v),
      removeItem: (k: string) => memoryMap.delete(k),
    };
    const orig = globalThis.localStorage;
    globalThis.localStorage = mockStorage as unknown as Storage;

    try {
      const backend = new LocalStorageBackend();
      localStorage.setItem('flixel:corrupt_slot', '{ invalid json ...');

      const save = new FlxSave();
      save.bind('corrupt_slot', { backend });

      expect(save.data).toEqual({});
      save.close();
    } finally {
      globalThis.localStorage = orig;
    }
  });

  it('tests LocalStorageBackend quota and error paths', () => {
    const memoryMap = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => memoryMap.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (k.includes('quota')) {
          const err = new DOMException(
            'QuotaExceededError',
            'QuotaExceededError',
          );
          throw err;
        }
        if (k.includes('type_err')) {
          throw new TypeError('Circular reference');
        }
        memoryMap.set(k, v);
      },
      removeItem: (k: string) => memoryMap.delete(k),
    };
    const orig = globalThis.localStorage;
    globalThis.localStorage = mockStorage as unknown as Storage;

    try {
      const backend = new LocalStorageBackend();

      // Test erase when present vs absent
      backend.write('test_slot', { a: 1 });
      expect(backend.erase('test_slot')).toBe(true);
      expect(backend.erase('test_slot')).toBe(false);

      // Quota failure
      const quotaRes = backend.write('quota_slot', { a: 1 });
      expect(quotaRes.success).toBe(false);
      if (!quotaRes.success) {
        expect(quotaRes.error).toBe('quota');
      }

      // TypeError failure
      const typeRes = backend.write('type_err_slot', { a: 1 });
      expect(typeRes.success).toBe(false);
      if (!typeRes.success) {
        expect(typeRes.error).toBe('serialization');
      }

      // Read non-object JSON array
      localStorage.setItem('flixel:array_slot', '[1, 2, 3]');
      expect(backend.read('array_slot')).toBeNull();
    } finally {
      globalThis.localStorage = orig;
    }
  });

  it('handles unbound or missing backend edge cases', () => {
    const save = new FlxSave();
    // Flush when unbound
    expect(save.flush().success).toBe(false);
    expect(save.erase()).toBe(false);

    // Bind without backend parameter
    save.bind('no_backend');
    expect(save.data).toEqual({});
    expect(save.flush().success).toBe(false);
    expect(save.erase()).toBe(false);
    save.close();

    // Bind with version but no backend
    save.bind('no_backend_version', { version: 1 });
    expect(save.data).toEqual({});
    save.close();

    // Bind with version but no migration callback
    const backend = new NullStorageBackend();
    save.bind('versioned', { version: 2, backend });
    expect(save.data?.__version).toBe(2);
    save.close();
  });

  it('integrates with FlxG static save facade', () => {
    const context = new FlxContext(320, 240);
    const backend = new NullStorageBackend();
    const saveInstance = new FlxSave();
    saveInstance._setBackend(backend);

    context.setService(FLX_STORAGE_SERVICE, {
      save: saveInstance,
      saves: [saveInstance],
    });

    FlxG.installContext(context);

    expect(FlxG.save).toBe(saveInstance);
    expect(FlxG.saves.length).toBe(1);
    expect(FlxG.saves[0]).toBe(saveInstance);

    FlxG.clearContext(context);
  });

  it('awaits durable writes and erases on asynchronous backends', async () => {
    class AsyncBackend implements FlxAsyncStorageBackend {
      readonly data = new Map<string, Record<string, unknown>>();
      read(key: string): Record<string, unknown> | null {
        return this.data.get(key) ?? null;
      }
      write(): FlxSaveResult {
        return {
          success: false,
          error: 'async',
          message: 'await the write',
        };
      }
      async writeAsync(
        key: string,
        data: Record<string, unknown>,
      ): Promise<FlxSaveResult> {
        this.data.set(key, { ...data });
        return { success: true };
      }
      erase(): boolean {
        return false;
      }
      async eraseAsync(key: string): Promise<boolean> {
        return this.data.delete(key);
      }
      close(): void {
        return undefined;
      }
    }

    const backend = new AsyncBackend();
    const save = new FlxSave();
    save.bind('async-slot', { backend });
    if (save.data !== null) save.data.score = 42;

    expect(save.flush()).toMatchObject({ success: false, error: 'async' });
    expect(await save.flushAsync()).toEqual({ success: true });
    expect(backend.data.get('async-slot')?.score).toBe(42);
    expect(await save.eraseAsync()).toBe(true);
    expect(save.data).toEqual({});
  });
});
