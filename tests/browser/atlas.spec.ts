import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('TexturePacker atlas sample', () => {
  test('loads from a bundle, restores transformed frames, and destroys cleanly', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/atlas/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 10_000 },
    );
    await page.waitForFunction(() => window.__FLIXEL_PIXI_ATLAS__?.ready);

    const first = await page.evaluate(
      () => window.__FLIXEL_PIXI_ATLAS__?.snapshot?.() ?? null,
    );
    expect(first).toMatchObject({
      atlasFrames: 9,
      cellHeight: 512,
      cellWidth: 512,
      displayWidth: 260,
    });

    await page.waitForFunction(
      (frame) =>
        window.__FLIXEL_PIXI_ATLAS__?.snapshot?.()?.animationFrame !== frame,
      first?.animationFrame,
      { timeout: 2_000 },
    );
    await page.waitForFunction(
      ({ backgroundX, middlegroundX }) => {
        const snapshot = window.__FLIXEL_PIXI_ATLAS__?.snapshot?.();
        return (
          snapshot !== undefined &&
          snapshot !== null &&
          snapshot.backgroundX < backgroundX &&
          snapshot.middlegroundX < middlegroundX
        );
      },
      {
        backgroundX: first?.backgroundX ?? 0,
        middlegroundX: first?.middlegroundX ?? 0,
      },
      { timeout: 2_000 },
    );

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});
