import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test('slices a deterministic fruit with a touch swipe and destroys cleanly', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto(`${GAMES}/swipe/`);
  const status = page.getByTestId('status');
  await expect(status).toHaveAttribute('data-state', 'ready', {
    timeout: 10_000,
  });

  const center = await page.evaluate(() =>
    window.__FLIXEL_PIXI_SWIPE__?.spawnTestFruit?.(),
  );
  const canvas = page.getByTestId('canvas-host').locator('canvas');
  const bounds = await canvas.boundingBox();
  if (center === null || center === undefined || bounds === null) {
    throw new Error('Swipe demo fruit or canvas bounds are unavailable.');
  }
  const toClientX = (logicalX: number): number =>
    bounds.x + (logicalX / 640) * bounds.width;
  const toClientY = (logicalY: number): number =>
    bounds.y + (logicalY / 480) * bounds.height;
  const startX = toClientX(center.x - 70);
  const middleX = toClientX(center.x);
  const endX = toClientX(center.x + 70);
  const clientY = toClientY(center.y);
  const dispatchTouch = async (
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    x: number,
  ): Promise<void> => {
    await canvas.evaluate(
      (element, event) => {
        element.dispatchEvent(
          new PointerEvent(event.type, {
            bubbles: true,
            button: event.type === 'pointerup' ? -1 : 0,
            clientX: event.x,
            clientY: event.y,
            isPrimary: true,
            pointerId: 31,
            pointerType: 'touch',
            pressure: event.type === 'pointerup' ? 0 : 0.5,
          }),
        );
      },
      { type, x, y: clientY },
    );
  };
  await dispatchTouch('pointerdown', startX);
  await dispatchTouch('pointermove', middleX);
  await page.waitForFunction(
    () => (window.__FLIXEL_PIXI_SWIPE__?.snapshot?.()?.trailSegments ?? 0) >= 1,
  );
  await dispatchTouch('pointermove', endX);
  await page.waitForFunction(
    () => (window.__FLIXEL_PIXI_SWIPE__?.snapshot?.()?.trailSegments ?? 0) >= 2,
  );
  const duringSwipe = await page.evaluate(() =>
    window.__FLIXEL_PIXI_SWIPE__?.snapshot?.(),
  );
  expect(duringSwipe).toEqual(
    expect.objectContaining({
      lastJuiceColor: 0xff4d6dff,
      score: 10,
      slicePieces: 2,
      slices: 1,
    }),
  );
  await dispatchTouch('pointerup', endX);

  await page.waitForFunction(
    () => window.__FLIXEL_PIXI_SWIPE__?.snapshot?.()?.lastDirection === 'right',
  );
  const result = await page.evaluate(() =>
    window.__FLIXEL_PIXI_SWIPE__?.snapshot?.(),
  );
  expect(result).toEqual(
    expect.objectContaining({ lastDirection: 'right', score: 10, slices: 1 }),
  );

  const bombCenter = await page.evaluate(() =>
    window.__FLIXEL_PIXI_SWIPE__?.spawnTestBomb?.(),
  );
  expect(bombCenter).toEqual(center);
  await dispatchTouch('pointerdown', startX);
  await dispatchTouch('pointermove', endX);
  await page.waitForFunction(
    () => (window.__FLIXEL_PIXI_SWIPE__?.snapshot?.()?.bombsHit ?? 0) >= 1,
  );
  const explosion = await page.evaluate(() =>
    window.__FLIXEL_PIXI_SWIPE__?.snapshot?.(),
  );
  expect(explosion).toEqual(
    expect.objectContaining({
      activeBombs: 0,
      bombsHit: 1,
      juiceParticles: expect.any(Number),
      score: 0,
    }),
  );
  expect(explosion?.juiceParticles ?? 0).toBeGreaterThanOrEqual(20);
  await dispatchTouch('pointerup', endX);
  expect(pageErrors).toEqual([]);

  await page.getByRole('button', { name: 'Destroy' }).click();
  await expect(status).toHaveAttribute('data-state', 'destroyed');
});
