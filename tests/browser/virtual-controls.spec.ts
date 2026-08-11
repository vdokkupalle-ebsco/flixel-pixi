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
  await expect(controls).toHaveCount(5);
  const moveRight = page.locator('[aria-label="Move right"]');
  const actionA = page.locator('[aria-label="Action A"]');
  await expect(moveRight).toHaveCount(1);
  await expect(actionA).toHaveCount(1);

  const before = await page.evaluate(
    () => window.__FLIXEL_PIXI_ACTION__?.playerPosition?.() ?? null,
  );
  expect(before).not.toBeNull();
  const box = await moveRight.boundingBox();
  if (box === null) throw new Error('Expected a visible Move right control.');
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
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
