import { expect, test } from '@playwright/test';

const TWEENS = 'http://127.0.0.1:4174/tweens/';

test('animates, pauses, restarts, and destroys the tween showcase', async ({
  page,
}) => {
  await page.goto(TWEENS);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );

  const before = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_TWEENS__?.snapshot?.() ?? null;
  });
  expect(before).not.toBeNull();
  expect(before?.activeTweens).toBeGreaterThan(8);

  await page.waitForTimeout(250);
  const animated = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_TWEENS__?.snapshot?.() ?? null;
  });
  expect(animated?.propertyX).not.toBeCloseTo(before?.propertyX ?? 0, 3);
  expect(animated?.motionX).not.toBeCloseTo(before?.motionX ?? 0, 3);

  await page.locator('[data-action="pause"]').click();
  const paused = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_TWEENS__?.snapshot?.() ?? null;
  });
  await page.waitForTimeout(250);
  const stillPaused = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_TWEENS__?.snapshot?.() ?? null;
  });
  expect(stillPaused?.paused).toBe(true);
  expect(stillPaused?.activeTweens).toBe(0);
  expect(stillPaused?.propertyX).toBeCloseTo(paused?.propertyX ?? 0, 5);
  expect(stillPaused?.motionY).toBeCloseTo(paused?.motionY ?? 0, 5);

  await page.locator('[data-action="restart"]').click();
  const restarted = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_TWEENS__?.snapshot?.() ?? null;
  });
  expect(restarted?.paused).toBe(false);
  expect(restarted?.activeTweens).toBeGreaterThan(8);
  expect(restarted?.cycles).toBe(0);

  await page.locator('[data-action="destroy"]').click();
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'destroyed',
  );
});
