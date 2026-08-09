import { expect, test } from '@playwright/test';

const SUBSTATES = 'http://127.0.0.1:4174/substates/';

test('pauses and resumes the parent through a rendered substate', async ({
  page,
}) => {
  await page.goto(SUBSTATES);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );

  const before = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_SUBSTATES__?.snapshot?.() ?? null;
  });
  expect(before).not.toBeNull();

  await expect(page.locator('[data-action="toggle"]')).toBeEnabled();
  await page.evaluate(() => {
    window.__FLIXEL_PIXI_SUBSTATES__?.pause?.();
  });
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        return window.__FLIXEL_PIXI_SUBSTATES__?.snapshot?.()?.paused ?? false;
      });
    })
    .toBe(true);

  const paused = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_SUBSTATES__?.snapshot?.() ?? null;
  });
  await page.waitForTimeout(250);
  const stillPaused = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_SUBSTATES__?.snapshot?.() ?? null;
  });
  expect(stillPaused?.updates).toBe(paused?.updates);
  expect(stillPaused?.markerX).toBe(paused?.markerX);
  expect(stillPaused?.opened).toBe(1);

  await page.evaluate(() => {
    window.__FLIXEL_PIXI_SUBSTATES__?.resume?.();
  });
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        return window.__FLIXEL_PIXI_SUBSTATES__?.snapshot?.()?.paused ?? true;
      });
    })
    .toBe(false);
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        return window.__FLIXEL_PIXI_SUBSTATES__?.snapshot?.()?.updates ?? 0;
      });
    })
    .toBeGreaterThan(paused?.updates ?? 0);

  const resumed = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_SUBSTATES__?.snapshot?.() ?? null;
  });
  expect(resumed?.closed).toBe(1);
});
