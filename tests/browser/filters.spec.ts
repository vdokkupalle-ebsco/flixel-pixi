import { expect, test } from '@playwright/test';

const FILTER_DEMO = 'http://127.0.0.1:4174/filters/';

test('renders neutral sprite/composite filters and replaces chains', async ({
  page,
}) => {
  await page.goto(FILTER_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
  );
  await expect(page.locator('canvas')).toBeVisible();

  const snapshot = () =>
    page.evaluate(() => window.__FLIXEL_PIXI_FILTERS__?.snapshot?.());
  await expect.poll(snapshot).toMatchObject({
    blurEnabled: true,
    compositeFilters: 1,
    grayscaleFilters: 1,
  });

  const pixels = await page.evaluate(() => {
    const app = window.__FLIXEL_PIXI_FILTERS__?.app;
    if (!app) throw new Error('Missing filter showcase application.');
    const output = app.app.renderer.extract.pixels(app.app.stage);
    const sample = (x: number, y: number): number[] => {
      const pixelX = Math.floor((x / 640) * output.width);
      const pixelY = Math.floor((y / 360) * output.height);
      const index = (pixelY * output.width + pixelX) * 4;
      return [...output.pixels.slice(index, index + 4)];
    };
    return {
      grayscale: sample(260, 156),
      original: sample(110, 156),
    };
  });
  expect(pixels.original[0] ?? 0).toBeGreaterThan(
    (pixels.original[1] ?? 0) * 2,
  );
  const grayscaleChannels = pixels.grayscale.slice(0, 3);
  const originalChannels = pixels.original.slice(0, 3);
  const grayscaleSpread =
    Math.max(...grayscaleChannels) - Math.min(...grayscaleChannels);
  const originalSpread =
    Math.max(...originalChannels) - Math.min(...originalChannels);
  expect(grayscaleSpread).toBeLessThan(originalSpread / 4);

  await page.locator('[data-action="blur"]').click();
  await expect.poll(snapshot).toMatchObject({ blurEnabled: false });
  await page.locator('[data-action="destroy"]').click();
  await expect(page.locator('canvas')).not.toBeAttached();
});
