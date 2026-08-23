import { expect, test } from '@playwright/test';

const PARTICLE_EFFECT = 'http://127.0.0.1:4174/particle-effect/';

test('loads and controls an exported multi-emitter effect', async ({
  page,
}) => {
  await page.goto(PARTICLE_EFFECT);
  const status = page.locator('[data-testid="status"]');
  await expect(status).toHaveAttribute('data-state', 'ready', {
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid="canvas-host"] canvas')).toHaveCount(
    1,
  );

  await expect
    .poll(async () =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.snapshot?.() ?? null,
      ),
    )
    .toMatchObject({
      emitting: true,
      layerCount: 3,
      paused: false,
      x: 320,
      y: 304,
    });
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.snapshot?.()?.emittedCount ??
          0,
      ),
    )
    .toBeGreaterThan(0);

  await page.locator('[data-action="pause"]').click();
  await expect(page.locator('[data-action="pause"]')).toHaveText('Resume');
  const paused = await page.evaluate(
    () => window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.snapshot?.() ?? null,
  );
  await page.waitForTimeout(200);
  const stillPaused = await page.evaluate(
    () => window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.snapshot?.() ?? null,
  );
  expect(paused?.paused).toBe(true);
  expect(stillPaused?.emittedCount).toBe(paused?.emittedCount);

  await page.locator('[data-action="pause"]').click();
  await expect(page.locator('[data-action="pause"]')).toHaveText('Pause');
  await page
    .locator('[data-testid="canvas-host"] canvas')
    .click({ position: { x: 160, y: 180 } });
  await expect
    .poll(async () =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.snapshot?.()?.x ?? 0,
      ),
    )
    .toBeLessThan(200);

  await page.locator('[data-action="reset"]').click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          window.__FLIXEL_PIXI_PARTICLE_EFFECT__?.snapshot?.()?.paused ?? true,
      ),
    )
    .toBe(false);

  await page.locator('[data-action="destroy"]').click();
  await expect(status).toHaveAttribute('data-state', 'destroyed');
  await expect(page.locator('[data-testid="canvas-host"] canvas')).toHaveCount(
    0,
  );
});
