import { expect, test } from '@playwright/test';

const MESH_DEMO = 'http://127.0.0.1:4174/meshes/';

test('renders and animates camera-local triangle geometry', async ({
  page,
}) => {
  await page.goto(MESH_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
  );
  await expect(page.locator('canvas')).toBeVisible();

  const snapshot = () =>
    page.evaluate(() => window.__FLIXEL_PIXI_MESHES__?.snapshot?.());
  await expect.poll(snapshot).toMatchObject({
    animating: true,
    chainTopology: 'triangle-strip',
  });
  const initial = await snapshot();
  await expect
    .poll(async () => (await snapshot())?.waterRevision ?? 0)
    .toBeGreaterThan(initial?.waterRevision ?? 0);
  await expect
    .poll(async () => (await snapshot())?.chainRevision ?? 0)
    .toBeGreaterThan(initial?.chainRevision ?? 0);

  const renderedColor = await page.evaluate(() => {
    const app = window.__FLIXEL_PIXI_MESHES__?.app;
    if (!app) throw new Error('Missing mesh showcase application.');
    const output = app.app.renderer.extract.pixels(app.app.stage);
    let colorfulPixels = 0;
    for (let y = 90; y < 330; y += 4) {
      for (let x = 35; x < 605; x += 4) {
        const pixelX = Math.floor((x / 640) * output.width);
        const pixelY = Math.floor((y / 380) * output.height);
        const index = (pixelY * output.width + pixelX) * 4;
        const red = output.pixels[index] ?? 0;
        const green = output.pixels[index + 1] ?? 0;
        const blue = output.pixels[index + 2] ?? 0;
        if (Math.max(red, green, blue) - Math.min(red, green, blue) > 40) {
          colorfulPixels += 1;
        }
      }
    }
    return colorfulPixels;
  });
  expect(renderedColor).toBeGreaterThan(100);

  await page.locator('[data-action="animate"]').click();
  await expect.poll(snapshot).toMatchObject({ animating: false });
  await page.waitForTimeout(100);
  const paused = await snapshot();
  await page.waitForTimeout(150);
  expect((await snapshot())?.waterRevision).toBe(paused?.waterRevision);

  await page.locator('[data-action="destroy"]').click();
  await expect(page.locator('canvas')).not.toBeAttached();
});
