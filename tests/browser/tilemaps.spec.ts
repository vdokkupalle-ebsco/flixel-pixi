import { expect, test } from '@playwright/test';

test('renders the shared chunked map and verifies tilemap contracts', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/tilemaps.html');

  const status = page.getByTestId('status');
  const metrics = page.getByTestId('tilemaps-metrics');
  const canvas = page.getByTestId('tilemaps-canvas-host').locator('canvas');
  await expect(status).toHaveText('Tilemap demo ready');
  await page.evaluate(() => window.__FLIXEL_PIXI_TILEMAPS__?.seek?.(2));
  await expect(canvas).toHaveCount(1);
  await expect(metrics).toHaveAttribute('data-renderer', 'webgl');
  await expect(metrics).toHaveAttribute('data-camera-count', '2');
  await expect(metrics).toHaveAttribute('data-shared-map-handles', '1');
  await expect(metrics).toHaveAttribute('data-map-width-in-tiles', '96');
  await expect(metrics).toHaveAttribute('data-map-height-in-tiles', '48');
  await expect(metrics).toHaveAttribute('data-dirty-mutation-rebuilds', '1');
  await expect(metrics).toHaveAttribute('data-path-found', 'true');
  await expect(metrics).toHaveAttribute('data-path-segments-ray-safe', 'true');
  expect(pageErrors).toEqual([]);

  const chunkMetrics = await metrics.evaluate((element) => ({
    allocated: Number(element.dataset.allocatedChunks),
    visible: Number(element.dataset.visibleChunks),
  }));
  expect(chunkMetrics.allocated).toBeGreaterThan(0);
  expect(chunkMetrics.allocated).toBeLessThanOrEqual(18);
  expect(chunkMetrics.visible).toBeGreaterThan(0);

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) throw new Error('Canvas has no browser bounds.');
  await expect(page).toHaveScreenshot('scene.png', {
    clip: {
      height: canvasBox.height,
      width: canvasBox.width,
      x: canvasBox.x,
      y: canvasBox.y,
    },
    maxDiffPixelRatio: 0.015,
  });

  await page.getByRole('button', { name: 'Destroy application' }).click();
  await expect(status).toHaveText('Destroyed cleanly');
  await expect(canvas).toHaveCount(0);
});

test('moves the target and follow camera on deterministic fixed steps', async ({
  page,
}) => {
  await page.goto('/tilemaps.html');
  await expect(page.getByTestId('status')).toHaveText('Tilemap demo ready');
  const initial = await page.evaluate(() =>
    window.__FLIXEL_PIXI_TILEMAPS__?.seek?.(0),
  );
  const advanced = await page.evaluate(() =>
    window.__FLIXEL_PIXI_TILEMAPS__?.advance?.(120),
  );
  expect(advanced?.simulationSeconds).toBeCloseTo(2, 8);
  expect(advanced?.targetX).toBeGreaterThan(initial?.targetX ?? 0);
  expect(advanced?.cameraScrollX).not.toBeCloseTo(
    initial?.cameraScrollX ?? 0,
    3,
  );
  expect(advanced?.rebuildCount).toBeGreaterThanOrEqual(
    initial?.rebuildCount ?? 0,
  );
});
