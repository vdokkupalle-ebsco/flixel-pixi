import { expect, test } from '@playwright/test';

test('renders the effects lab and verifies effects contracts', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/effects.html');

  const status = page.getByTestId('status');
  const metrics = page.getByTestId('effects-metrics');
  const canvas = page.getByTestId('effects-canvas-host').locator('canvas');
  await expect(status).toHaveText('Effects demo ready');
  await expect(canvas).toHaveCount(1);
  await expect(metrics).toHaveAttribute('data-renderer', 'webgl');
  await expect(metrics).toHaveAttribute('data-seeded-repeatability', 'true');
  await expect(metrics).toHaveAttribute('data-timer-catch-up', 'true');
  await expect(metrics).toHaveAttribute('data-plugin-removal-safe', 'true');
  await expect(metrics).toHaveAttribute('data-allocation-plateau', 'true');
  await expect(metrics).toHaveAttribute('data-optimized-projection', 'true');
  await expect(metrics).toHaveAttribute('data-debug-path-layer', 'true');
  expect(pageErrors).toEqual([]);

  await page.evaluate(() => {
    window.__FLIXEL_PIXI_EFFECTS__?.pause?.();
    window.__FLIXEL_PIXI_EFFECTS__?.reset?.();
  });
  const state = await page.evaluate(() => {
    return window.__FLIXEL_PIXI_EFFECTS__?.advance?.(240);
  });
  expect(state?.simulationSteps).toBe(241);
  expect(state?.allocatedParticles).toBe(224);
  expect(state?.projectedParticles).toBe(224);
  expect(state?.burstCycles).toBeGreaterThan(4);
  expect(state?.timerCallbacks).toBeGreaterThan(3);
  expect(state?.activeStreamParticles).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);

  await page.getByRole('button', { name: 'Destroy application' }).click();
  await expect(status).toHaveText('Destroyed cleanly');
  await expect(canvas).toHaveCount(0);
});
