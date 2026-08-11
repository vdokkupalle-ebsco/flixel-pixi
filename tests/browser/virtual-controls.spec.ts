import { expect, test } from '@playwright/test';

const ACTION_DEMO = 'http://127.0.0.1:4174/action/';

test('combines canvas virtual controls with semantic keyboard activation', async ({
  page,
}) => {
  await page.goto(ACTION_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );

  const controls = page.locator('[data-flx-accessible-button]');
  await expect(controls).toHaveCount(1);
  const actionA = page.locator('[aria-label="Action A"]');
  await expect(actionA).toHaveCount(1);

  const before = await page.evaluate(
    () => window.__FLIXEL_PIXI_ACTION__?.playerPosition?.() ?? null,
  );
  expect(before).not.toBeNull();
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const stick = await page.evaluate(
    () => window.__FLIXEL_PIXI_ACTION__?.virtualStick?.() ?? null,
  );
  if (box === null || stick === null) {
    throw new Error('Expected a visible virtual stick.');
  }
  const scale = Math.min(box.width / 640, box.height / 480);
  const viewportX = box.x + (box.width - 640 * scale) * 0.5;
  const viewportY = box.y + (box.height - 480 * scale) * 0.5;
  const centerX = viewportX + stick.x * scale;
  const centerY = viewportY + stick.y * scale;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_ACTION__?.virtualStick?.()?.pressed ?? false,
      ),
    )
    .toBe(true);
  await page.mouse.move(centerX + stick.radius * scale, centerY);
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_ACTION__?.virtualStick?.()?.xAxis ?? 0,
      ),
    )
    .toBeGreaterThan(0.9);
  await expect
    .poll(
      () =>
        page.evaluate(
          () => window.__FLIXEL_PIXI_ACTION__?.playerPosition?.()?.x ?? 0,
        ),
      { timeout: 3_000 },
    )
    .toBeGreaterThan((before?.x ?? 0) + 2);
  await page.mouse.up();

  const bursts = await page.evaluate(
    () => window.__FLIXEL_PIXI_ACTION__?.bursts?.() ?? 0,
  );
  await actionA.focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_ACTION__?.bursts?.() ?? 0),
    )
    .toBe(bursts + 1);
});
