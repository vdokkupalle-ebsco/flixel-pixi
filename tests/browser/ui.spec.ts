import { expect, test } from '@playwright/test';

const UI_DEMO = 'http://127.0.0.1:4174/ui/';

test('operates rendered UI through native keyboard accessibility controls', async ({
  page,
}) => {
  await page.goto(UI_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );
  const controls = page.locator('[data-flx-accessible-button]');
  await expect(controls).toHaveCount(2);
  await expect(controls.nth(0)).toHaveAttribute(
    'aria-label',
    'Damage health by 15',
  );
  const alignment = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const button = document.querySelector<HTMLElement>(
      '[data-flx-accessible-button]',
    );
    if (!canvas || !button) return null;
    const canvasBounds = canvas.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    const scale = Math.min(canvasBounds.width / 640, canvasBounds.height / 320);
    const contentTop =
      canvasBounds.top + (canvasBounds.height - 320 * scale) / 2;
    return {
      actual: {
        height: buttonBounds.height,
        left: buttonBounds.left,
        top: buttonBounds.top,
        width: buttonBounds.width,
      },
      expected: {
        height: 49 * scale,
        left: canvasBounds.left + 146 * scale,
        top: contentTop + 182 * scale,
        width: 170 * scale,
      },
    };
  });
  expect(alignment).not.toBeNull();
  expect(alignment?.actual.left).toBeCloseTo(alignment?.expected.left ?? 0, 0);
  expect(alignment?.actual.top).toBeCloseTo(alignment?.expected.top ?? 0, 0);
  expect(alignment?.actual.width).toBeCloseTo(
    alignment?.expected.width ?? 0,
    0,
  );
  expect(alignment?.actual.height).toBeCloseTo(
    alignment?.expected.height ?? 0,
    0,
  );

  const before = await page.evaluate(() =>
    window.__FLIXEL_PIXI_UI__?.snapshot?.(),
  );
  expect(before).toMatchObject({ health: 65, percent: 65 });

  await controls.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.health),
    )
    .toBe(50);

  await controls.nth(1).focus();
  await page.keyboard.press('Space');
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.health),
    )
    .toBe(65);

  await page.locator('[data-action="destroy"]').click();
  await expect(controls).toHaveCount(0);
});
