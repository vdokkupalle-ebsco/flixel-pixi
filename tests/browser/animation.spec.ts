import { expect, test } from '@playwright/test';

const ANIMATION = 'http://127.0.0.1:4174/animation/';

test('renders named, reversed, timed animations and lifecycle signals', async ({
  page,
}) => {
  await page.goto(ANIMATION);
  const status = page.locator('[data-testid="status"]');
  await expect(status).toHaveAttribute('data-state', 'ready', {
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid="canvas-host"] canvas')).toHaveCount(
    1,
  );

  await expect
    .poll(async () =>
      page.evaluate(() => {
        return window.__FLIXEL_PIXI_ANIMATION__?.snapshot?.()?.loops ?? 0;
      }),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        return window.__FLIXEL_PIXI_ANIMATION__?.snapshot?.()?.finished ?? 0;
      }),
    )
    .toBeGreaterThan(0);

  await page.locator('[data-action="pause"]').click();
  const paused = await page.evaluate(
    () => window.__FLIXEL_PIXI_ANIMATION__?.snapshot?.() ?? null,
  );
  await page.waitForTimeout(250);
  const stillPaused = await page.evaluate(
    () => window.__FLIXEL_PIXI_ANIMATION__?.snapshot?.() ?? null,
  );
  expect(stillPaused?.paused).toBe(true);
  expect(stillPaused).toEqual(paused);

  await page.locator('[data-action="restart"]').click();
  const restarted = await page.evaluate(
    () => window.__FLIXEL_PIXI_ANIMATION__?.snapshot?.() ?? null,
  );
  expect(restarted).toMatchObject({
    finished: 0,
    frameChanges: 1,
    loops: 0,
    paused: false,
  });

  await page.locator('[data-action="destroy"]').click();
  await expect(status).toHaveAttribute('data-state', 'destroyed');
  await expect(page.locator('[data-testid="canvas-host"] canvas')).toHaveCount(
    0,
  );
});
