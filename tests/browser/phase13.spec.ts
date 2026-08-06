declare global {
  interface Window {
    __FLIXEL_PIXI_BENCH__?: {
      ready: boolean;
      measured: boolean;
      destroyed: boolean;
      avgFps: number;
      minFps: number;
      activeCount: number;
      inactiveCount: number;
      drawCalls: number | null;
    };
    __FLIXEL_PIXI_SOAK__?: {
      done: boolean;
      cycles: number;
      errors: string[];
      registeredSamples: number[];
    };
  }
}
export {};

import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Phase 13 — Sprite stress bench', () => {
  test('boots, reports finite FPS metrics (report-only), destroys', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto(`${GAMES}/bench-sprites/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 15_000 },
    );

    await page.waitForFunction(
      () => window.__FLIXEL_PIXI_BENCH__?.measured === true,
      { timeout: 20_000 },
    );

    const metrics = await page.evaluate(() => window.__FLIXEL_PIXI_BENCH__);
    expect(metrics?.ready).toBe(true);
    expect(metrics?.activeCount).toBe(2000);
    expect(metrics?.inactiveCount).toBe(8000);
    expect(Number.isFinite(metrics?.avgFps)).toBe(true);
    expect(Number.isFinite(metrics?.minFps)).toBe(true);
    expect(metrics?.avgFps ?? 0).toBeGreaterThan(0);
    // Report-only: log, do not assert a floor
    console.log('[phase13 bench]', metrics);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});
