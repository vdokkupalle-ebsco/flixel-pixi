import { expect, test } from '@playwright/test';

test('renders the C4 sprite/text scene and releases adapter handles', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/phase4.html');

  const status = page.getByTestId('status');
  const metrics = page.getByTestId('phase4-metrics');
  const canvas = page.getByTestId('phase4-canvas-host').locator('canvas');
  await expect(status).toHaveText('C4 sprite compatibility scene ready');
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
  await expect(page).toHaveScreenshot('phase4-sprites.png', {
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
    .poll(() => page.evaluate(() => window.__FLIXEL_PIXI_PHASE4__?.destroyed))
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
    await page.goto('/phase4.html');
    await expect(page.getByTestId('status')).toHaveText(
      'C4 sprite compatibility scene ready',
    );

    const density = await page
      .getByTestId('phase4-canvas-host')
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
    await expect(page.getByTestId('phase4-metrics')).toHaveAttribute(
      'data-text-resolution',
      '2',
    );
  } finally {
    await context.close();
  }
});
