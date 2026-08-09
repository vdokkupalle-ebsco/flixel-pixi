import { expect, test } from '@playwright/test';

test('renders the deterministic input lab and verifies input contracts', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/input.html');

  const status = page.getByTestId('status');
  const metrics = page.getByTestId('input-metrics');
  const canvas = page.getByTestId('input-canvas-host').locator('canvas');
  await expect(status).toHaveText('Input demo ready');
  await page.evaluate(() => window.__FLIXEL_PIXI_INPUT__?.reset?.());
  await expect(canvas).toHaveCount(1);
  await expect(metrics).toHaveAttribute('data-renderer', 'webgl');
  await expect(metrics).toHaveAttribute(
    'data-transition-steps',
    'press/release',
  );
  await expect(metrics).toHaveAttribute('data-aliases-mapped', 'true');
  await expect(metrics).toHaveAttribute('data-replay-parity', 'true');
  await expect(metrics).toHaveAttribute('data-camera-round-trip', 'true');
  await expect(metrics).toHaveAttribute('data-pointer-capture', 'true');
  expect(pageErrors).toEqual([]);

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) throw new Error('Canvas has no browser bounds.');
  await expect(page).toHaveScreenshot('scene.png', {
    clip: {
      height: canvasBox.height,
      width: canvasBox.width,
      x: canvasBox.x,
      y: canvasBox.y,
    },
    maxDiffPixelRatio: 0.015,
  });

  await page.getByRole('button', { name: 'Destroy application' }).click();
  await expect(status).toHaveText('Destroyed cleanly');
  await expect(canvas).toHaveCount(0);
});

test('publishes keys, blur releases, pointer capture, and cancellation on steps', async ({
  page,
}) => {
  await page.goto('/input.html');
  await expect(page.getByTestId('status')).toHaveText('Input demo ready');
  await page.evaluate(() => {
    window.__FLIXEL_PIXI_INPUT__?.pause?.();
    window.__FLIXEL_PIXI_INPUT__?.reset?.();
  });

  const initial = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.state?.(),
  );
  await page.keyboard.down('a');
  const pressed = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.advance?.(1),
  );
  expect(pressed?.keyDownSteps).toBe(1);
  expect(pressed?.keysPressed).toBe(true);
  expect(pressed?.playerX).toBeLessThan(initial?.playerX ?? 0);
  await page.keyboard.up('a');
  const released = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.advance?.(1),
  );
  expect(released?.keyUpSteps).toBe(1);
  expect(released?.keysPressed).toBe(false);

  await page.keyboard.down('d');
  await page.evaluate(() => window.__FLIXEL_PIXI_INPUT__?.advance?.(1));
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.advance?.(1),
  );
  expect(blurred?.keysPressed).toBe(false);
  await page.keyboard.up('d');

  const canvas = page.getByTestId('input-canvas-host').locator('canvas');
  const box = await canvas.boundingBox();
  const button = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.state?.(),
  );
  if (box === null || button === undefined) {
    throw new Error('Button screen position is unavailable.');
  }
  const pageX = box.x + (button.buttonScreenX / 800) * box.width;
  const pageY = box.y + (button.buttonScreenY / 420) * box.height;
  await page.mouse.move(pageX, pageY);
  await page.mouse.down();
  await page.mouse.up();
  const clicked = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.advance?.(2),
  );
  expect(clicked?.buttonActivations).toBe(1);
  expect(clicked?.buttonOn).toBe(false);

  await page.evaluate(() => window.__FLIXEL_PIXI_INPUT__?.reset?.());
  await page.mouse.move(pageX, pageY);
  await page.mouse.down();
  await page.evaluate(() => window.__FLIXEL_PIXI_INPUT__?.advance?.(1));
  await canvas.evaluate(
    (element, point) => {
      element.dispatchEvent(
        new PointerEvent('pointercancel', {
          bubbles: true,
          button: -1,
          clientX: point.x,
          clientY: point.y,
          pointerId: 1,
        }),
      );
    },
    { x: pageX, y: pageY },
  );
  const cancelled = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.advance?.(1),
  );
  expect(cancelled?.cancelledSteps).toBe(1);
  expect(cancelled?.buttonActivations).toBe(0);
  expect(cancelled?.buttonOn).toBe(true);
  await page.mouse.up();
});

test('tracks touch pointers and recognizes a swipe on fixed steps', async ({
  page,
}) => {
  await page.goto('/input.html');
  await expect(page.getByTestId('status')).toHaveText('Input demo ready');
  await page.evaluate(() => {
    window.__FLIXEL_PIXI_INPUT__?.pause?.();
    window.__FLIXEL_PIXI_INPUT__?.reset?.();
  });
  const canvas = page.getByTestId('input-canvas-host').locator('canvas');
  await canvas.evaluate((element) => {
    const dispatch = (type: string, x: number, pressure: number): void => {
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          button: type === 'pointerup' ? -1 : 0,
          clientX: x,
          clientY: 100,
          isPrimary: true,
          pointerId: 21,
          pointerType: 'touch',
          pressure,
        }),
      );
    };
    dispatch('pointerdown', 100, 0.5);
    dispatch('pointermove', 220, 0.5);
    dispatch('pointerup', 220, 0);
  });
  const pressed = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.advance?.(1),
  );
  expect(pressed?.touchCount).toBe(1);
  expect(pressed?.swipeDirection).toBeNull();
  const released = await page.evaluate(() =>
    window.__FLIXEL_PIXI_INPUT__?.advance?.(1),
  );
  expect(released?.touchCount).toBe(0);
  expect(released?.swipeDirection).toBe('right');
});
