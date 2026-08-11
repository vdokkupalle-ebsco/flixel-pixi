import { expect, test } from '@playwright/test';

const VIEWPORT_DEMO = 'http://127.0.0.1:4174/viewport/';

test('publishes visible and safe logical bounds across viewport changes', async ({
  page,
}) => {
  await page.goto(VIEWPORT_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_VIEWPORT__?.latest?.mode),
    )
    .toBe('fit');

  await page.locator('[data-testid="canvas-host"]').evaluate((host) => {
    host.style.transition = 'none';
  });
  await page.locator('[data-scale-mode]').selectOption('fill');
  await page.locator('[data-host-width="360px"]').click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const latest = window.__FLIXEL_PIXI_VIEWPORT__?.latest;
        if (!latest || latest.mode !== 'fill') return null;
        return latest.hostHeight > latest.hostWidth ? latest : null;
      }),
    )
    .not.toBeNull();
  const layout = await page.evaluate(
    () => window.__FLIXEL_PIXI_VIEWPORT__?.latest ?? null,
  );
  expect(layout).not.toBeNull();
  expect(layout?.visibleRect.width).toBeLessThan(640);
  expect(layout?.visibleRect.height).toBe(360);
  expect(layout?.safeRect.left).toBeGreaterThan(layout?.visibleRect.left ?? 0);
  expect(layout?.safeRect.right).toBeLessThan(layout?.visibleRect.right ?? 640);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const snapshot = window.__FLIXEL_PIXI_VIEWPORT__?.snapshot?.();
        if (!snapshot?.visibleRect) return false;
        return (
          snapshot.targetX >= snapshot.visibleRect.left &&
          snapshot.targetY >= snapshot.visibleRect.top &&
          snapshot.targetX + 24 <= snapshot.visibleRect.right &&
          snapshot.targetY + 24 <= snapshot.visibleRect.bottom
        );
      }),
    )
    .toBe(true);

  const hostBounds = await page
    .locator('[data-testid="canvas-host"]')
    .boundingBox();
  const canvasBounds = await page.locator('canvas').boundingBox();
  expect(hostBounds).not.toBeNull();
  expect(canvasBounds).not.toBeNull();
  if (!hostBounds || !canvasBounds || !layout) return;
  const clientX = hostBounds.x + hostBounds.width / 2;
  const clientY = hostBounds.y + hostBounds.height / 2;
  await page.locator('canvas').evaluate(
    (canvas, point) => {
      canvas.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: point.clientX,
          clientY: point.clientY,
          isPrimary: true,
          pointerId: 1,
          pointerType: 'mouse',
        }),
      );
    },
    { clientX, clientY },
  );
  const expectedX = (clientX - canvasBounds.x) / layout.scale;
  const expectedY = (clientY - canvasBounds.y) / layout.scale;
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_VIEWPORT__?.snapshot?.()),
    )
    .toMatchObject({
      pointerLocalX: expect.closeTo(expectedX - layout.visibleRect.left, 0),
      pointerX: expect.closeTo(expectedX, 0),
    });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_VIEWPORT__?.snapshot?.()?.pointerY,
      ),
    )
    .toBeCloseTo(expectedY, 0);
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_VIEWPORT__?.snapshot?.()?.pointerLocalY,
      ),
    )
    .toBeCloseTo(expectedY - layout.visibleRect.top, 0);

  const previousSafeWidth = layout.safeRect.width;
  await page.locator('[data-safe-padding]').evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = '32';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_VIEWPORT__?.latest?.safePadding.left,
      ),
    )
    .toBe(32);
  const padded = await page.evaluate(
    () => window.__FLIXEL_PIXI_VIEWPORT__?.latest ?? null,
  );
  expect(padded?.safeRect.width).toBeCloseTo(previousSafeWidth - 32, 4);

  await page.locator('[data-align-x]').selectOption('0');
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_VIEWPORT__?.latest?.visibleRect.left,
      ),
    )
    .toBe(0);

  await page.waitForFunction(() => {
    const latest = window.__FLIXEL_PIXI_VIEWPORT__?.latest;
    const applied = window.__FLIXEL_PIXI_VIEWPORT__?.snapshot?.()?.safeRect;
    return (
      latest !== undefined &&
      applied !== undefined &&
      applied !== null &&
      applied.x === latest.safeRect.x &&
      applied.width === latest.safeRect.width
    );
  });

  const safeButton = page.locator(
    '[data-flx-accessible-button][aria-label="Safe area test button"]',
  );
  await expect(safeButton).toBeVisible();
  const safeButtonBounds = await safeButton.boundingBox();
  const latestCanvasBounds = await page.locator('canvas').boundingBox();
  const latest = await page.evaluate(
    () => window.__FLIXEL_PIXI_VIEWPORT__?.latest ?? null,
  );
  expect(safeButtonBounds).not.toBeNull();
  expect(latestCanvasBounds).not.toBeNull();
  if (safeButtonBounds && latestCanvasBounds && latest) {
    const logicalCenter =
      (safeButtonBounds.x + safeButtonBounds.width / 2 - latestCanvasBounds.x) /
      latest.scale;
    expect(logicalCenter).toBeCloseTo(
      latest.safeRect.left + latest.safeRect.width / 2,
      1,
    );
  }
});
