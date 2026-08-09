import { expect, test } from '@playwright/test';

test('renders isolated multi-camera passes and releases their resources', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/cameras.html');

  const status = page.getByTestId('status');
  const metrics = page.getByTestId('cameras-metrics');
  const canvas = page.getByTestId('cameras-canvas-host').locator('canvas');
  await expect(status).toHaveText('Multi-camera demo ready');
  await page.evaluate(() => window.__FLIXEL_PIXI_CAMERAS__?.seekAnimation?.(0));
  await expect(canvas).toHaveCount(1);
  await expect(metrics).toHaveAttribute('data-renderer', 'webgl');
  await expect(metrics).toHaveAttribute('data-camera-count', '2');
  await expect(metrics).toHaveAttribute('data-registered-objects', '10');
  await expect(metrics).toHaveAttribute(
    'data-follow-exclusive-visible',
    'true',
  );
  await expect(metrics).toHaveAttribute(
    'data-overview-exclusive-visible',
    'true',
  );
  await expect(metrics).toHaveAttribute('data-coordinate-round-trip', 'true');
  await expect(metrics).toHaveAttribute(
    'data-render-transform-matches-coordinates',
    'true',
  );
  await expect(metrics).toHaveAttribute(
    'data-single-multi-coordinates-stable',
    'true',
  );
  await expect(metrics).toHaveAttribute(
    'data-temporary-target-destroyed',
    'true',
  );
  await expect(metrics).toHaveAttribute('data-effects-independent', 'true');
  expect(pageErrors).toEqual([]);

  const targetMetrics = await metrics.evaluate((element) => ({
    bytes: Number(element.dataset.renderTargetBytes),
    followHeight: Number(element.dataset.followTargetPixelHeight),
    followWidth: Number(element.dataset.followTargetPixelWidth),
    overviewHeight: Number(element.dataset.overviewTargetPixelHeight),
    overviewWidth: Number(element.dataset.overviewTargetPixelWidth),
  }));
  const resolution = await page.evaluate(() =>
    Math.min(window.devicePixelRatio, 2),
  );
  expect(targetMetrics).toEqual({
    bytes: 2 * 360 * resolution * 240 * resolution * 4,
    followHeight: 240 * resolution,
    followWidth: 360 * resolution,
    overviewHeight: 240 * resolution,
    overviewWidth: 360 * resolution,
  });

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
  await expect
    .poll(() => page.evaluate(() => window.__FLIXEL_PIXI_CAMERAS__?.destroyed))
    .toBe(true);
});

test('keeps pointer conversion and render targets correct after resize', async ({
  page,
}) => {
  await page.goto('/cameras.html');
  await expect(page.getByTestId('status')).toHaveText(
    'Multi-camera demo ready',
  );
  await page.evaluate(() => window.__FLIXEL_PIXI_CAMERAS__?.seekAnimation?.(0));

  const worldPoint = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_CAMERAS__?.pointerToWorld?.(
      'overview',
      420 + 180,
      20 + 120,
    );
  });
  expect(worldPoint?.x).toBeCloseTo(400, 5);
  expect(worldPoint?.y).toBeCloseTo(225, 5);

  const resized = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_CAMERAS__?.resize?.(820, 300, 2);
  });
  expect(resized).toEqual({
    canvasPixelHeight: 600,
    canvasPixelWidth: 1640,
    followTargetPixelHeight: 480,
    followTargetPixelWidth: 720,
    overviewTargetPixelHeight: 480,
    overviewTargetPixelWidth: 720,
    resolution: 2,
  });
});

test('animates the follow target and camera on deterministic fixed steps', async ({
  page,
}) => {
  await page.goto('/cameras.html');
  await expect(page.getByTestId('status')).toHaveText(
    'Multi-camera demo ready',
  );

  const initial = await page.evaluate(() =>
    window.__FLIXEL_PIXI_CAMERAS__?.seekAnimation?.(0),
  );
  const advanced = await page.evaluate(() =>
    window.__FLIXEL_PIXI_CAMERAS__?.advanceAnimation?.(120),
  );
  expect(initial?.paused).toBe(true);
  expect(advanced?.simulationSeconds).toBeCloseTo(2, 8);
  expect(advanced?.targetX).not.toBeCloseTo(initial?.targetX ?? 0, 3);
  expect(advanced?.cameraScrollX).not.toBeCloseTo(
    initial?.cameraScrollX ?? 0,
    3,
  );

  await page.evaluate(() =>
    window.__FLIXEL_PIXI_CAMERAS__?.resumeAnimation?.(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__FLIXEL_PIXI_CAMERAS__?.animationState?.()
            .simulationSeconds ?? 0,
      ),
    )
    .toBeGreaterThan((advanced?.simulationSeconds ?? 0) + 0.05);
  await page.evaluate(() => window.__FLIXEL_PIXI_CAMERAS__?.pauseAnimation?.());
});
