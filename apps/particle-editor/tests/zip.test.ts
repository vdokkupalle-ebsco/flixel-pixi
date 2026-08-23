import { describe, expect, it } from 'vitest';
import { calculateCrc32, createZipBlob, type ZipFileEntry } from '../src/zip';

describe('zero-dependency PKZIP zip writer', () => {
  it('calculates standard CRC32 checksums correctly', () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('123456789');
    expect(calculateCrc32(data)).toBe(0xcbf43926);
  });

  it('creates a valid ZIP binary blob containing multiple files and folders', async () => {
    const entries: ZipFileEntry[] = [
      {
        path: 'effect/effect.json',
        data: '{"id":"test"}',
      },
      {
        path: 'effect/textures/particle.png',
        data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      },
      {
        path: 'effect/README.md',
        data: '# Test Effect',
      },
    ];

    const blob = createZipBlob(entries);
    expect(blob.type).toBe('application/zip');
    expect(blob.size).toBeGreaterThan(0);

    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);

    // Verify local file header signature 0x04034b50 (PK\x03\x04)
    expect(view.getUint32(0, true)).toBe(0x04034b50);
  });
});
