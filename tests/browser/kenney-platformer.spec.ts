import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Kenney Platformer sample', () => {
  test('boots, lands on floor, exposes lives, destroys cleanly', async ({
    page,
  }) => {
    await page.route('**/*.png', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });
    await page.goto(`${GAMES}/kenney-platformer/`, {
      waitUntil: 'domcontentloaded',
    });

    const preloader = page.locator('[data-testid="flx-preloader"]');
    await expect(preloader).toBeVisible({ timeout: 5000 });
    await expect(preloader).toHaveClass(/kenney-preloader/);
    await expect(preloader).toContainText(
      'Preparing the platforming adventure',
    );
    expect(
      await preloader.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--flx-preloader-accent'),
      ),
    ).toBe('#facc15');

    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 20_000 },
    );
    await expect(preloader).not.toBeAttached({ timeout: 3000 });

    const loadingStages = await page.evaluate(
      () => window.__FLIXEL_PIXI_KENNEY__?.loadingStages?.() ?? [],
    );
    expect(loadingStages).toContain('renderer');
    expect(loadingStages).toContain('assets');
    expect(loadingStages).toContain('first-frame');
    expect(loadingStages.at(-1)).toBe('complete');

    const framerates = await page.evaluate(() => ({
      render: window.__FLIXEL_PIXI_KENNEY__?.app?.renderFramerate,
      update: window.__FLIXEL_PIXI_KENNEY__?.app?.updateFramerate,
    }));
    expect(framerates).toEqual({ render: 60, update: 60 });

    const fpsDisplay = page.locator('[data-testid="flx-fps-display"]');
    await expect(fpsDisplay).toBeVisible();
    await expect(fpsDisplay).toContainText(/(?:—|\d+) FPS/);
    await expect(fpsDisplay).toHaveClass(/flx-fps-display--top-right/);

    const timingAgreement = await page.evaluate(async () => {
      const app = window.__FLIXEL_PIXI_KENNEY__?.app;
      if (!app) return { actualAverage: 0, count: 0, reportedAverage: 0 };
      const actual: number[] = [];
      const reported: number[] = [];
      let previous = performance.now();
      let skipFirst = true;
      const unsubscribe = app.onFrame((frame) => {
        const now = performance.now();
        if (skipFirst) skipFirst = false;
        else {
          actual.push(now - previous);
          reported.push(frame.elapsedMS);
        }
        previous = now;
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      unsubscribe();
      const average = (values: number[]): number =>
        values.reduce((sum, value) => sum + value, 0) / values.length;
      return {
        actualAverage: average(actual),
        count: actual.length,
        reportedAverage: average(reported),
      };
    });
    expect(timingAgreement.count).toBeGreaterThan(10);
    expect(
      Math.abs(timingAgreement.actualAverage - timingAgreement.reportedAverage),
    ).toBeLessThan(1.5);
    await expect(fpsDisplay).toContainText(/\d+ FPS/);

    const grounded = await page.evaluate(
      () => window.__FLIXEL_PIXI_KENNEY__?.onFloor?.() ?? false,
    );
    expect(grounded).toBe(true);

    const lives = await page.evaluate(
      () => window.__FLIXEL_PIXI_KENNEY__?.lives?.() ?? 0,
    );
    expect(lives).toBe(3);

    await page.locator('[data-action="destroy"]').click();
    await expect(fpsDisplay).not.toBeAttached();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });

  test('recovers from a startup failure through the preloader retry action', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/kenney-platformer/?fail-preload-once=1`, {
      waitUntil: 'domcontentloaded',
    });

    const preloader = page.locator('[data-testid="flx-preloader"]');
    await expect(preloader).toContainText('Simulated startup asset failure', {
      timeout: 5000,
    });
    const retry = preloader.locator('.flx-preloader__retry');
    await expect(retry).toBeVisible();
    await retry.click();

    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 20_000 },
    );
    expect(
      await page.evaluate(
        () => window.__FLIXEL_PIXI_KENNEY__?.preloadAttempts?.() ?? 0,
      ),
    ).toBe(2);
    await expect(preloader).not.toBeAttached({ timeout: 3000 });
  });
});
