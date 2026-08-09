import { expect, test } from '@playwright/test';

test('renders the sprite/text scene and releases adapter handles', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/sprites-text.html');

  const status = page.getByTestId('status');
  const metrics = page.getByTestId('sprites-text-metrics');
  const canvas = page.getByTestId('sprites-text-canvas-host').locator('canvas');
  await expect(status).toHaveText('Sprites and text demo ready');
  await expect(canvas).toHaveCount(1);
  await expect(metrics).toHaveAttribute('data-renderer', 'webgl');
  await expect(metrics).toHaveAttribute(
    'data-renderer-resolution',
    String(await page.evaluate(() => Math.min(window.devicePixelRatio, 2))),
  );
  await expect(metrics).toHaveAttribute(
    'data-text-resolution',
    String(await page.evaluate(() => Math.min(window.devicePixelRatio, 2))),
  );
  await expect(metrics).toHaveAttribute('data-asset-cache-shared', 'true');
  await expect(metrics).toHaveAttribute('data-recovered-failed-alias', 'true');
  await expect(metrics).toHaveAttribute('data-retained-handles', '4');

  const values = await metrics.evaluate((element) => ({
    callbacks: Number(element.dataset.animationCallbacks),
    frames: Number(element.dataset.cachedFrameTextures),
  }));
  expect(values.callbacks).toBeGreaterThanOrEqual(4);
  expect(values.frames).toBeGreaterThanOrEqual(3);
  expect(pageErrors).toEqual([]);
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) throw new Error('Canvas has no browser bounds.');
  await expect(page).toHaveScreenshot('scene.png', {
    clip: {
      height: 150,
      width: canvasBox.width,
      x: canvasBox.x,
      y: canvasBox.y,
    },
    maxDiffPixelRatio: 0.01,
  });

  await page.getByRole('button', { name: 'Destroy application' }).click();
  await expect(status).toHaveText('Destroyed cleanly');
  await expect(canvas).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_SPRITES_TEXT__?.destroyed),
    )
    .toBe(true);
});

test('uses a HiDPI backing store for crisp canvas text', async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 600, width: 800 },
  });

  try {
    const page = await context.newPage();
    await page.goto('/sprites-text.html');
    await expect(page.getByTestId('status')).toHaveText(
      'Sprites and text demo ready',
    );

    const density = await page
      .getByTestId('sprites-text-canvas-host')
      .locator('canvas')
      .evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        return {
          cssHeight: canvas.getBoundingClientRect().height,
          cssWidth: canvas.getBoundingClientRect().width,
          pixelHeight: canvas.height,
          pixelWidth: canvas.width,
        };
      });
    expect(density).toEqual({
      cssHeight: 240,
      cssWidth: 480,
      pixelHeight: 480,
      pixelWidth: 960,
    });
    await expect(page.getByTestId('sprites-text-metrics')).toHaveAttribute(
      'data-text-resolution',
      '2',
    );
  } finally {
    await context.close();
  }
});
