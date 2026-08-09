import { expect, test } from '@playwright/test';

const CONTAINERS = 'http://127.0.0.1:4174/containers/';

test('renders nested container branches with deterministic world coordinates', async ({
  page,
}) => {
  await page.goto(CONTAINERS);
  const status = page.locator('[data-testid="status"]');
  await expect(status).toHaveAttribute('data-state', 'ready', {
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid="canvas-host"] canvas')).toHaveCount(
    1,
  );

  const initial = await page.evaluate(
    () => window.__FLIXEL_PIXI_CONTAINERS__?.snapshot?.() ?? null,
  );
  expect(initial).toMatchObject({ localX: 0, memberCount: 3 });

  await expect
    .poll(async () => {
      const worldX = await page.evaluate(
        () => window.__FLIXEL_PIXI_CONTAINERS__?.snapshot?.()?.worldX ?? 0,
      );
      return Math.abs(worldX - (initial?.worldX ?? worldX));
    })
    .toBeGreaterThan(1);

  await expect
    .poll(async () => {
      return page.evaluate(
        () => window.__FLIXEL_PIXI_CONTAINERS__?.snapshot?.()?.collisions ?? 0,
      );
    })
    .toBeGreaterThan(0);

  const moved = await page.evaluate(
    () => window.__FLIXEL_PIXI_CONTAINERS__?.snapshot?.() ?? null,
  );
  expect(moved?.localX).toBe(0);
  expect(Math.abs(moved?.angle ?? 0)).toBeGreaterThan(0);
  expect(moved?.scale).not.toBe(1);

  await page.locator('[data-action="destroy"]').click();
  await expect(status).toHaveAttribute('data-state', 'destroyed');
  await expect(page.locator('[data-testid="canvas-host"] canvas')).toHaveCount(
    0,
  );
});
