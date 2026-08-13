import { expect, test } from '@playwright/test';

import budgets from '../../performance-budgets.json' with { type: 'json' };

const GAMES = 'http://127.0.0.1:4174';
const PERF_GATES = process.env.RENDER_PERF_GATES === '1';
const SOAK_MINUTES = Number(process.env.SOAK_MINUTES ?? 0);
const LONG_SOAK = Number.isFinite(SOAK_MINUTES) && SOAK_MINUTES > 0;
const SOAK_DURATION_MS = LONG_SOAK ? SOAK_MINUTES * 60_000 : 0;

// Perf samples and the soak share CPU/GPU resources, so this file must not
// measure several stress scenes against one another.
test.describe.configure({ mode: 'serial' });
test.skip(
  !PERF_GATES && !LONG_SOAK,
  'Run performance and lifecycle stress checks through their dedicated serial commands.',
);

test.describe('Sprite stress benchmark', () => {
  test.skip(
    !PERF_GATES,
    'Run hardware-sensitive sprite stress checks through npm run test:perf.',
  );

  for (const active of [2000, 5000, 10000] as const) {
    test(`boots ${active} sprites, reports finite FPS, destroys`, async ({
      browserName,
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
      expect(Number.isFinite(metrics?.medianFps)).toBe(true);
      expect(Number.isFinite(metrics?.minFps)).toBe(true);
      expect(metrics?.avgFps ?? 0).toBeGreaterThan(0);
      // Hardware floors are enabled only by the dedicated serial perf command.
      if (PERF_GATES && browserName === 'chromium') {
        const floor =
          budgets.browser.spriteStressMedianFpsMin[
            String(active) as '2000' | '5000' | '10000'
          ];
        expect(metrics?.medianFps ?? 0).toBeGreaterThanOrEqual(floor);
      }
      // Mean/min remain diagnostic; the median gate resists isolated scheduler stalls.
      console.log(`[performance bench active=${active}]`, metrics);

      await page.locator('[data-action="destroy"]').click();
      await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
        'data-state',
        'destroyed',
      );
    });
  }
});

test.describe('Boot/destroy soak', () => {
  test('completes the configured run without errors or rising handle counts', async ({
    page,
  }) => {
    test.setTimeout(LONG_SOAK ? SOAK_DURATION_MS + 300_000 : 180_000);
    await page.goto(
      `${GAMES}/bench-soak/${LONG_SOAK ? `?durationMs=${SOAK_DURATION_MS}` : ''}`,
    );
    await page.waitForFunction(
      () => window.__FLIXEL_PIXI_SOAK__?.done === true,
      { timeout: LONG_SOAK ? SOAK_DURATION_MS + 240_000 : 150_000 },
    );

    const soak = await page.evaluate(() => window.__FLIXEL_PIXI_SOAK__);
    expect(soak?.errors ?? ['missing']).toEqual([]);
    if (LONG_SOAK) {
      expect(soak?.elapsedMs ?? 0).toBeGreaterThanOrEqual(SOAK_DURATION_MS);
      expect(soak?.cycles ?? 0).toBeGreaterThan(30);
    } else {
      expect(soak?.cycles).toBe(30);
    }
    expect(soak?.registeredSamples?.length).toBe(soak?.cycles);
    expect(soak?.resourceSamples?.length).toBe(soak?.cycles);

    const samples = soak?.registeredSamples ?? [];
    for (const sample of samples) {
      expect(sample).toBeLessThanOrEqual(
        budgets.browser.resources.registeredObjectsMax,
      );
    }

    const resources = soak?.resourceSamples ?? [];
    const retainedListeners = resources[0]?.released.listeners ?? 0;
    expect(retainedListeners).toBeLessThanOrEqual(
      budgets.browser.resources.retainedListenersMax,
    );
    for (const { active, released } of resources) {
      for (const [name, maximum] of Object.entries(
        budgets.browser.resources.activeMaximum,
      )) {
        expect(active[name as keyof typeof active]).toBeLessThanOrEqual(
          maximum,
        );
      }
      expect(active.audioContexts).toBeGreaterThan(0);
      expect(active.audioHandles).toBeGreaterThan(0);
      expect(active.canvases).toBeGreaterThan(0);
      expect(active.renderHandles).toBeGreaterThan(0);
      expect(active.renderTargetBytes).toBeGreaterThan(0);
      expect(active.renderTargets).toBeGreaterThan(0);
      expect(active.textureSources).toBeGreaterThan(0);
      expect(active.listeners).toBeGreaterThan(released.listeners);
      const { listeners, ...releasedResources } = released;
      expect(listeners).toBe(retainedListeners);
      expect(releasedResources).toEqual(
        budgets.browser.resources.releasedMaximum,
      );
    }
    console.log('[performance soak]', {
      cycles: soak?.cycles,
      elapsedMs: soak?.elapsedMs,
      registeredSamples: soak?.registeredSamples,
      retainedListeners,
    });
  });
});
