import { expect, test } from '@playwright/test';

test('initializes, renders, resizes, and destroys the Pixi application', async ({
  page,
}) => {
  await page.goto('/');

  const status = page.getByTestId('status');
  const host = page.getByTestId('canvas-host');
  const canvas = host.locator('canvas');

  await expect(status).toContainText('Ready:');
  await expect(canvas).toHaveCount(1);

  const initialSize = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;

    return {
      height: canvasElement.height,
      width: canvasElement.width,
    };
  });
  expect(initialSize.width).toBeGreaterThan(0);
  expect(initialSize.height).toBeGreaterThan(0);

  await page.setViewportSize({ height: 720, width: 720 });

  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;

        return {
          height: canvasElement.height,
          width: canvasElement.width,
        };
      }),
    )
    .not.toEqual(initialSize);

  await page.getByRole('button', { name: 'Destroy application' }).click();

  await expect(status).toHaveText('Destroyed cleanly');
  await expect(canvas).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__FLIXEL_PIXI_SMOKE__?.destroyed))
    .toBe(true);
});
