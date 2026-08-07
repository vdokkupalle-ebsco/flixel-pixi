import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Kenney Platformer sample', () => {
  test('boots, lands on floor, exposes lives, destroys cleanly', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/kenney-platformer/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 20_000 },
    );

    await page.waitForTimeout(1500);
    const grounded = await page.evaluate(
      () => window.__FLIXEL_PIXI_KENNEY__?.onFloor?.() ?? false,
    );
    expect(grounded).toBe(true);

    const lives = await page.evaluate(
      () => window.__FLIXEL_PIXI_KENNEY__?.lives?.() ?? 0,
    );
    expect(lives).toBe(3);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});
