import { expect, test } from '@playwright/test';

test('renders one world through two isolated cameras and tears it down', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/phase1.html');

  const status = page.getByTestId('status');
  const host = page.getByTestId('phase1-canvas-host');
  const canvas = host.locator('canvas');
  const metrics = page.getByTestId('metrics');

  await expect(status).toHaveText(
    'C1 spike running: one world, two isolated camera passes',
  );
  await expect(canvas).toHaveCount(1);
  await expect(metrics).toHaveAttribute('data-camera-passes', '2');
  await expect(metrics).toHaveAttribute('data-shared-handle-parent-count', '1');
  await expect(metrics).toHaveAttribute('data-renderer', 'webgl');
  await expect(metrics).toHaveAttribute('data-visual-isolation', 'true');
  await expect(metrics).toHaveAttribute('data-follow-forbidden-pixels', '0');
  await expect(metrics).toHaveAttribute('data-overview-forbidden-pixels', '0');
  await expect(metrics).toHaveAttribute('data-composite-gap', '17,23,34,255');

  const measurements = await metrics.evaluate((element) => ({
    direct: Number(element.dataset.directPassMilliseconds),
    readback: Number(element.dataset.readbackMilliseconds),
    renderTargetBytes: Number(element.dataset.renderTargetBytes),
    renderTexture: Number(element.dataset.renderTexturePassMilliseconds),
  }));
  expect(measurements.direct).toBeGreaterThanOrEqual(0);
  expect(measurements.readback).toBeGreaterThanOrEqual(0);
  expect([748_800, 2_995_200]).toContain(measurements.renderTargetBytes);
  expect(measurements.renderTexture).toBeGreaterThanOrEqual(0);

  const renderedPixels = await metrics.evaluate((element) => ({
    followCameraOnly: Number(element.dataset.followCameraOnlyPixels),
    followShared: Number(element.dataset.followSharedPixels),
    overviewCameraOnly: Number(element.dataset.overviewCameraOnlyPixels),
    overviewShared: Number(element.dataset.overviewSharedPixels),
  }));
  expect(renderedPixels.followCameraOnly).toBeGreaterThan(100);
  expect(renderedPixels.followShared).toBeGreaterThan(100);
  expect(renderedPixels.overviewCameraOnly).toBeGreaterThan(100);
  expect(renderedPixels.overviewShared).toBeGreaterThan(100);

  await page.waitForTimeout(250);
  expect(pageErrors).toEqual([]);

  await page.getByRole('button', { name: 'Destroy application' }).click();
  await expect(status).toHaveText('Destroyed cleanly');
  await expect(canvas).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__FLIXEL_PIXI_PHASE1__?.destroyed))
    .toBe(true);
});

test('resizes camera targets across high-DPI and narrow layouts', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/phase1.html');
  await expect(page.getByTestId('status')).toContainText('C1 spike running');

  const highDpi = await page.evaluate(() =>
    window.__FLIXEL_PIXI_PHASE1__?.resize?.(720, 650, 2),
  );
  expect(highDpi).toEqual({
    canvasPixelHeight: 1_300,
    canvasPixelWidth: 1_440,
    logicalHeight: 650,
    logicalWidth: 720,
    overviewViewportY: 360,
    renderTargetBytes: 2_995_200,
    renderTargetPixelHeight: 480,
    renderTargetPixelWidth: 780,
    resolution: 2,
  });

  const restored = await page.evaluate(() =>
    window.__FLIXEL_PIXI_PHASE1__?.resize?.(900, 380, 1),
  );
  expect(restored).toEqual({
    canvasPixelHeight: 380,
    canvasPixelWidth: 900,
    logicalHeight: 380,
    logicalWidth: 900,
    overviewViewportY: 70,
    renderTargetBytes: 748_800,
    renderTargetPixelHeight: 240,
    renderTargetPixelWidth: 390,
    resolution: 1,
  });

  await page.waitForTimeout(250);
  expect(pageErrors).toEqual([]);

  await page.getByRole('button', { name: 'Destroy application' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('status')).toContainText('C1 spike running');
  await expect(
    page.getByTestId('phase1-canvas-host').locator('canvas'),
  ).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});
