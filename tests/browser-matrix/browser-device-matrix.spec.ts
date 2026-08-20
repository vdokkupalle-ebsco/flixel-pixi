import { expect, test, type Page } from '@playwright/test';

import budgets from '../../performance-budgets.json' with { type: 'json' };

const VIEWPORT_DEMO = 'http://127.0.0.1:4174/viewport/';
const matrix = budgets.browser.deviceMatrix;

async function openViewportDemo(page: Page): Promise<void> {
  await page.goto(VIEWPORT_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: matrix.readyTimeoutMs },
  );
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_VIEWPORT__?.latest ?? null),
    )
    .not.toBeNull();
}

async function waitForRenderedFrame(page: Page): Promise<void> {
  const before = await page.evaluate(
    () => window.__FLIXEL_PIXI_VIEWPORT__?.app?.frameCount ?? -1,
  );
  expect(before).toBeGreaterThanOrEqual(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_VIEWPORT__?.app?.frameCount ?? -1,
      ),
    )
    .toBeGreaterThan(before);
}

test('keeps layout, DPR, and semantic HUD controls valid across orientation changes', async ({
  page,
}) => {
  await openViewportDemo(page);

  for (const viewport of [
    { height: 844, width: 390 },
    { height: 390, width: 844 },
    { height: 600, width: 600 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() =>
      window.__FLIXEL_PIXI_VIEWPORT__?.app?.viewport.refresh(),
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          const bridge = window.__FLIXEL_PIXI_VIEWPORT__;
          const latest = bridge?.latest;
          const app = bridge?.app;
          if (!latest || !app) return null;
          return {
            canvasHeight: app.app.canvas.height,
            canvasWidth: app.app.canvas.width,
            devicePixelRatio: latest.devicePixelRatio,
            rendererResolution: app.app.renderer.resolution,
            safeInsideVisible:
              latest.safeRect.left >= latest.visibleRect.left &&
              latest.safeRect.top >= latest.visibleRect.top &&
              latest.safeRect.right <= latest.visibleRect.right &&
              latest.safeRect.bottom <= latest.visibleRect.bottom,
          };
        }),
      )
      .toMatchObject({ safeInsideVisible: true });
  }

  const dimensions = await page.evaluate(() => {
    const app = window.__FLIXEL_PIXI_VIEWPORT__?.app;
    if (!app) return null;
    const cameraView = app.renderer.getCameraView(app.game.context.camera);
    return {
      cameraResolution: cameraView?.target.source.resolution ?? Infinity,
      canvasHeight: app.app.canvas.height,
      canvasWidth: app.app.canvas.width,
      resolution: app.app.renderer.resolution,
    };
  });
  expect(dimensions).not.toBeNull();
  expect(dimensions?.resolution ?? Infinity).toBeLessThanOrEqual(
    matrix.maxDevicePixelRatio,
  );
  expect(dimensions?.cameraResolution ?? Infinity).toBeLessThanOrEqual(
    matrix.maxDevicePixelRatio,
  );
  expect(dimensions?.canvasWidth ?? Infinity).toBeLessThanOrEqual(
    640 * matrix.maxDevicePixelRatio,
  );
  expect(dimensions?.canvasHeight ?? Infinity).toBeLessThanOrEqual(
    360 * matrix.maxDevicePixelRatio,
  );

  const safeButton = page.getByRole('button', {
    name: 'Safe area test button',
  });
  await expect(safeButton).toBeVisible();
  await safeButton.focus();
  await expect(safeButton).toBeFocused();
  await expect(safeButton).toHaveAttribute('data-flx-accessible-button');
});

test('tracks fullscreen entry and exit through the browser contract', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let fullscreenElement: Element | null = null;
    Object.defineProperty(Document.prototype, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });
    HTMLElement.prototype.requestFullscreen = async function () {
      fullscreenElement = document.querySelector('[data-testid="canvas-host"]');
      document.dispatchEvent(new Event('fullscreenchange'));
    };
    Document.prototype.exitFullscreen = async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
  });
  await openViewportDemo(page);

  const fullscreenButton = page.locator('[data-action="fullscreen"]');
  await fullscreenButton.click();
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_VIEWPORT__?.latest?.fullscreen),
    )
    .toBe(true);
  await expect(fullscreenButton).toHaveText('Exit fullscreen');

  await fullscreenButton.click();
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_VIEWPORT__?.latest?.fullscreen),
    )
    .toBe(false);
  await expect(fullscreenButton).toHaveText('Fullscreen');
});

test('pauses for visibility loss and resumes without accumulated simulation debt', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let visibilityState: DocumentVisibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => visibilityState !== 'visible',
    });
    Object.defineProperty(document, 'hasFocus', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(window, '__setMatrixVisibility', {
      configurable: true,
      value: (next: DocumentVisibilityState) => {
        visibilityState = next;
        document.dispatchEvent(new Event('visibilitychange'));
      },
    });
  });
  await openViewportDemo(page);

  const result = await page.evaluate(async () => {
    const app = window.__FLIXEL_PIXI_VIEWPORT__?.app;
    const setVisibility = (
      window as Window & {
        __setMatrixVisibility?: (next: DocumentVisibilityState) => void;
      }
    ).__setMatrixVisibility;
    if (!app || !setVisibility) return null;

    let hiddenSteps = 0;
    let resumedSteps = 0;
    let phase: 'hidden' | 'resumed' = 'hidden';
    const unsubscribe = app.onFrame(({ simulationSteps }) => {
      if (phase === 'hidden') hiddenSteps += simulationSteps;
      else resumedSteps += simulationSteps;
    });
    setVisibility('hidden');
    const focusedWhileHidden = app.focused;
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    phase = 'resumed';
    setVisibility('visible');
    const focusedAfterReturn = app.focused;
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    unsubscribe();
    return {
      focusedAfterReturn,
      focusedWhileHidden,
      hiddenSteps,
      resumedSteps,
    };
  });

  expect(result).toMatchObject({
    focusedAfterReturn: true,
    focusedWhileHidden: false,
    hiddenSteps: 0,
  });
  expect(result?.resumedSteps ?? 0).toBeGreaterThan(0);
  expect(result?.resumedSteps ?? Infinity).toBeLessThanOrEqual(
    matrix.resumeSimulationStepsMax,
  );
});

test('survives repeated resize pressure and releases browser-owned surfaces', async ({
  page,
}) => {
  await openViewportDemo(page);
  for (let cycle = 0; cycle < matrix.pressureCycles; cycle++) {
    for (const viewport of [
      { height: 667, width: 375 },
      { height: 375, width: 667 },
      { height: 480, width: 320 },
    ]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() =>
        window.__FLIXEL_PIXI_VIEWPORT__?.app?.viewport.refresh(),
      );
      await waitForRenderedFrame(page);
    }
  }
  await page.locator('[data-action="destroy"]').click();
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'destroyed',
  );
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('[data-flx-accessible-button]')).toHaveCount(0);
});

test('survives an engine memory-pressure notification when automation exposes one', async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Firefox and WebKit do not expose memory-pressure simulation to Playwright.',
  );
  await openViewportDemo(page);
  const before = await page.evaluate(
    () => window.__FLIXEL_PIXI_VIEWPORT__?.app?.frameCount ?? 0,
  );
  const session = await page.context().newCDPSession(page);
  await session.send('Memory.simulatePressureNotification', {
    level: 'critical',
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_VIEWPORT__?.app?.frameCount ?? 0,
      ),
    )
    .toBeGreaterThan(before);
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.locator('[data-action="destroy"]').click();
  await expect(page.locator('canvas')).toHaveCount(0);
});
