import { expect, test } from '@playwright/test';

const ACTION = 'http://127.0.0.1:4174/action/';

test('polls browser gamepads on steps and preserves reconnect identity', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.set(window, '__TEST_GAMEPADS__', []);
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => Reflect.get(window, '__TEST_GAMEPADS__') ?? [],
    });
  });
  await page.goto(ACTION);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );
  const initialBursts = await page.evaluate(
    () => window.__FLIXEL_PIXI_ACTION__?.bursts?.() ?? 0,
  );

  await page.evaluate(() => {
    Reflect.set(window, '__TEST_GAMEPADS__', [
      {
        axes: [1, 0],
        buttons: [{ pressed: true, touched: true, value: 1 }],
        connected: true,
        id: 'Synthetic Standard Pad',
        index: 0,
        mapping: 'standard',
        timestamp: 1,
      },
    ]);
  });

  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_ACTION__?.gamepad?.() ?? null),
    )
    .toMatchObject({ axis: 1, index: 0, pressed: true, uid: 0 });
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_ACTION__?.bursts?.() ?? 0),
    )
    .toBeGreaterThan(initialBursts);

  await page.evaluate(() => Reflect.set(window, '__TEST_GAMEPADS__', []));
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_ACTION__?.gamepad?.() ?? null),
    )
    .toBeNull();

  await page.evaluate(() => {
    Reflect.set(window, '__TEST_GAMEPADS__', [
      null,
      null,
      {
        axes: [-1, 0],
        buttons: [{ pressed: false, touched: false, value: 0 }],
        connected: true,
        id: 'Synthetic Standard Pad',
        index: 2,
        mapping: 'standard',
        timestamp: 2,
      },
    ]);
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_ACTION__?.gamepad?.() ?? null),
    )
    .toMatchObject({ axis: -1, index: 2, pressed: false, uid: 0 });
});
