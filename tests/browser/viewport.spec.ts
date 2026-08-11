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

test('updates Pixi and camera backing resolution when browser DPR changes', async ({
  page,
}) => {
  await page.goto(VIEWPORT_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );

  const setDpr = async (value: number): Promise<void> => {
    await page.evaluate((nextDpr) => {
      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        value: nextDpr,
      });
      window.dispatchEvent(new Event('resize'));
    }, value);
  };
  const resolutions = async (): Promise<{
    camera: number;
    canvasHeight: number;
    canvasWidth: number;
    logicalHeight: number;
    logicalWidth: number;
    renderer: number;
  } | null> =>
    page.evaluate(() => {
      const application = window.__FLIXEL_PIXI_VIEWPORT__?.app;
      if (!application) return null;
      const camera = application.game.context.camera;
      const view = application.renderer.getCameraView(camera);
      if (!view) return null;
      return {
        camera: view.target.source.resolution,
        canvasHeight: application.app.canvas.height,
        canvasWidth: application.app.canvas.width,
        logicalHeight: application.app.renderer.height,
        logicalWidth: application.app.renderer.width,
        renderer: application.app.renderer.resolution,
      };
    });

  await setDpr(1.25);
  await expect.poll(resolutions).toEqual({
    camera: 1.25,
    canvasHeight: 450,
    canvasWidth: 800,
    logicalHeight: 360,
    logicalWidth: 640,
    renderer: 1.25,
  });

  await setDpr(3);
  await expect.poll(resolutions).toEqual({
    camera: 2,
    canvasHeight: 720,
    canvasWidth: 1_280,
    logicalHeight: 360,
    logicalWidth: 640,
    renderer: 2,
  });
});

test('pauses simulation on focus loss without a resume catch-up burst', async ({
  page,
}) => {
  await page.goto(VIEWPORT_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );

  const result = await page.evaluate(async () => {
    const application = window.__FLIXEL_PIXI_VIEWPORT__?.app;
    if (!application) return null;
    let pausedSteps = 0;
    let resumedSteps = 0;
    let phase: 'paused' | 'resumed' = 'paused';
    const unsubscribe = application.onFrame(({ simulationSteps }) => {
      if (phase === 'paused') pausedSteps += simulationSteps;
      else resumedSteps += simulationSteps;
    });

    window.dispatchEvent(new Event('blur'));
    const focusedWhileBlurred = application.focused;
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    phase = 'resumed';
    window.dispatchEvent(new Event('focus'));
    const focusedAfterReturn = application.focused;
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    unsubscribe();
    return {
      autoPause: application.autoPause,
      focusedAfterReturn,
      focusedWhileBlurred,
      pausedSteps,
      resumedSteps,
    };
  });

  expect(result).toEqual({
    autoPause: true,
    focusedAfterReturn: true,
    focusedWhileBlurred: false,
    pausedSteps: 0,
    resumedSteps: expect.any(Number),
  });
  expect(result?.resumedSteps ?? 0).toBeGreaterThan(0);
  expect(result?.resumedSteps ?? 0).toBeLessThan(12);
});
