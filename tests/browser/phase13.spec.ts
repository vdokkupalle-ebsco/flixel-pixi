import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Phase 13 — Sprite stress bench', () => {
  for (const active of [2000, 5000, 10000] as const) {
    test(`boots ${active} sprites, reports finite FPS (report-only), destroys`, async ({
      page,
    }) => {
      test.setTimeout(active >= 10000 ? 120_000 : 60_000);
      await page.goto(`${GAMES}/bench-sprites/?active=${active}`);
      await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
        'data-state',
        'ready',
        { timeout: active >= 10000 ? 45_000 : 15_000 },
      );

      await page.waitForFunction(
        () => window.__FLIXEL_PIXI_BENCH__?.measured === true,
        { timeout: 30_000 },
      );

      const metrics = await page.evaluate(() => window.__FLIXEL_PIXI_BENCH__);
      expect(metrics?.ready).toBe(true);
      expect(metrics?.activeCount).toBe(active);
      expect(metrics?.inactiveCount).toBe(8000);
      expect(Number.isFinite(metrics?.avgFps)).toBe(true);
      expect(Number.isFinite(metrics?.minFps)).toBe(true);
      expect(metrics?.avgFps ?? 0).toBeGreaterThan(0);
      // Report-only: log, do not assert a floor
      console.log(`[phase13 bench active=${active}]`, metrics);

      await page.locator('[data-action="destroy"]').click();
      await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
        'data-state',
        'destroyed',
      );
    });
  }
});

test.describe('Phase 13 — Boot/destroy soak', () => {
  test('completes 10 cycles without errors or rising handle counts', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto(`${GAMES}/bench-soak/`);
    await page.waitForFunction(
      () => window.__FLIXEL_PIXI_SOAK__?.done === true,
      { timeout: 90_000 },
    );

    const soak = await page.evaluate(() => window.__FLIXEL_PIXI_SOAK__);
    expect(soak?.errors ?? ['missing']).toEqual([]);
    expect(soak?.cycles).toBe(10);
    expect(soak?.registeredSamples?.length).toBe(10);

    const samples = soak!.registeredSamples;
    // No monotonic climb: last <= first + 2 (ε for noise)
    expect(samples[samples.length - 1]!).toBeLessThanOrEqual(samples[0]! + 2);
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]!).toBeLessThanOrEqual(samples[0]! + 2);
    }
    console.log('[phase13 soak]', soak);
  });
});
