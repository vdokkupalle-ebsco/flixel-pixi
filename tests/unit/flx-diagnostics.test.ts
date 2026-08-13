import { describe, expect, it, vi } from 'vitest';

import { FlxDiagnostics } from '../../src/debugger/flx-diagnostics';

describe('FlxDiagnostics', () => {
  it('retains a bounded sample history and throttles memory reads', () => {
    const readMemoryBytes = vi.fn(() => 64 * 1_048_576);
    const diagnostics = new FlxDiagnostics({
      maxSamples: 3,
      memorySampleInterval: 2,
      readMemoryBytes,
    });
    for (let frame = 1; frame <= 5; frame++) {
      diagnostics.record(frame, frame, 60, frame * 10);
    }
    expect(diagnostics.samples.map((sample) => sample.frame)).toEqual([
      3, 4, 5,
    ]);
    expect(readMemoryBytes).toHaveBeenCalledTimes(2);
    expect(diagnostics.samples[0]?.memoryBytes).toBe(64 * 1_048_576);
  });

  it('captures stable aggregates and independent sample arrays', () => {
    const diagnostics = new FlxDiagnostics({ memorySampleInterval: 0 });
    for (let frame = 1; frame <= 20; frame++) {
      diagnostics.record(frame, frame, 50 + frame, frame * 10);
    }
    const snapshot = diagnostics.capture(new Date('2026-08-13T00:00:00Z'));
    expect(snapshot).toMatchObject({
      capturedAt: '2026-08-13T00:00:00.000Z',
      schemaVersion: 1,
      summary: {
        averageFps: 60.5,
        maxUpdateMs: 20,
        p95UpdateMs: 19,
        peakMemoryBytes: null,
        sampleCount: 20,
      },
    });
    diagnostics.clear();
    expect(snapshot.samples).toHaveLength(20);
    expect(diagnostics.samples).toEqual([]);
  });

  it('validates options and sample values', () => {
    expect(() => new FlxDiagnostics({ maxSamples: -1 })).toThrow(
      'maxSamples must be a non-negative integer.',
    );
    const diagnostics = new FlxDiagnostics();
    expect(() => diagnostics.record(1, Number.NaN, 60, 0)).toThrow(
      'updateMs must be finite.',
    );
  });
});
