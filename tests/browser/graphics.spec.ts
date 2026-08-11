import { expect, test } from '@playwright/test';

const GRAPHICS_DEMO = 'http://127.0.0.1:4174/graphics/';

test('renders stable vector gradients and rebuilds only for theme changes', async ({
  page,
}) => {
  await page.goto(GRAPHICS_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
  );
  await expect(page.locator('canvas')).toBeVisible();
  const snapshot = () =>
    page.evaluate(() => window.__FLIXEL_PIXI_GRAPHICS__?.snapshot?.());
  await expect.poll(snapshot).toMatchObject({
    backgroundCommands: 5,
    night: false,
  });

  const initial = await snapshot();
  await page.waitForTimeout(180);
  const animated = await snapshot();
  expect(animated?.backgroundRevision).toBe(initial?.backgroundRevision);
  expect(animated?.hudRevision).toBe(initial?.hudRevision);
  expect(animated?.pickupRevision).toBe(initial?.pickupRevision);

  const sample = () =>
    page.evaluate(() => {
      const app = window.__FLIXEL_PIXI_GRAPHICS__?.app;
      if (!app) throw new Error('Missing vector quest application.');
      const output = app.app.renderer.extract.pixels(app.app.stage);
      const at = (x: number, y: number): number[] => {
        const pixelX = Math.floor((x / 640) * output.width);
        const pixelY = Math.floor((y / 360) * output.height);
        const index = (pixelY * output.width + pixelX) * 4;
        return [...output.pixels.slice(index, index + 4)];
      };
      return { skyTop: at(100, 30), skyBottom: at(100, 170) };
    });
  const day = await sample();
  expect(day.skyTop).not.toEqual(day.skyBottom);

  await page.locator('[data-action="theme"]').click();
  await expect.poll(snapshot).toMatchObject({ night: true });
  expect((await snapshot())?.backgroundRevision).toBeGreaterThan(
    initial?.backgroundRevision ?? 0,
  );
  await page.waitForTimeout(60);
  const night = await sample();
  expect(night.skyTop).not.toEqual(day.skyTop);

  await page.locator('[data-action="destroy"]').click();
  await expect(page.locator('canvas')).not.toBeAttached();
});
