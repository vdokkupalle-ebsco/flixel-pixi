import { expect, test } from '@playwright/test';

const UI_DEMO = 'http://127.0.0.1:4174/ui/';

test('operates rendered UI through native keyboard accessibility controls', async ({
  page,
}) => {
  await page.goto(UI_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );
  const controls = page.locator('[data-flx-accessible-button]');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__FLIXEL_PIXI_UI__?.snapshot?.()?.multiPageFontFamily ?? null,
      ),
    )
    .toBe('UiMultiPage24');
  await expect(controls).toHaveCount(2);
  await expect(controls.nth(0)).toHaveAttribute(
    'aria-label',
    'Damage health by 15',
  );
  const alignment = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const button = document.querySelector<HTMLElement>(
      '[data-flx-accessible-button]',
    );
    if (!canvas || !button) return null;
    const canvasBounds = canvas.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    const scale = Math.min(canvasBounds.width / 640, canvasBounds.height / 320);
    const contentTop =
      canvasBounds.top + (canvasBounds.height - 320 * scale) / 2;
    return {
      actual: {
        height: buttonBounds.height,
        left: buttonBounds.left,
        top: buttonBounds.top,
        width: buttonBounds.width,
      },
      expected: {
        height: 49 * scale,
        left: canvasBounds.left + 146 * scale,
        top: contentTop + 182 * scale,
        width: 170 * scale,
      },
    };
  });
  expect(alignment).not.toBeNull();
  expect(alignment?.actual.left).toBeCloseTo(alignment?.expected.left ?? 0, 0);
  expect(alignment?.actual.top).toBeCloseTo(alignment?.expected.top ?? 0, 0);
  expect(alignment?.actual.width).toBeCloseTo(
    alignment?.expected.width ?? 0,
    0,
  );
  expect(alignment?.actual.height).toBeCloseTo(
    alignment?.expected.height ?? 0,
    0,
  );
  const nameInput = page.locator('[data-flx-input-text]');
  await expect(nameInput).toHaveCount(1);
  await expect(nameInput).toHaveAttribute('aria-label', 'Player name');
  await nameInput.fill('Miyu');
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.playerName),
    )
    .toBe('Miyu');
  await nameInput.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true, data: '' }),
    );
    input.value = 'Miyu 勇';
    input.setSelectionRange(input.value.length, input.value.length);
    input.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        data: '勇',
        inputType: 'insertCompositionText',
        isComposing: true,
      }),
    );
    input.dispatchEvent(
      new CompositionEvent('compositionend', {
        bubbles: true,
        data: '勇',
      }),
    );
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.playerName),
    )
    .toBe('Miyu 勇');
  await nameInput.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.submittedName,
      ),
    )
    .toBe('Miyu 勇');

  const before = await page.evaluate(() =>
    window.__FLIXEL_PIXI_UI__?.snapshot?.(),
  );
  expect(before).toMatchObject({ health: 65, percent: 65 });

  await controls.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.health),
    )
    .toBe(50);

  await controls.nth(1).focus();
  await page.keyboard.press('Space');
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.health),
    )
    .toBe(65);

  await page.locator('[data-action="destroy"]').click();
  await expect(controls).toHaveCount(0);
  await expect(nameInput).toHaveCount(0);
});

test('keeps native UI aligned while changing browser scale modes', async ({
  page,
}) => {
  await page.goto(UI_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 10_000 },
  );

  const fit = await page.evaluate(() => {
    const host = document.querySelector<HTMLElement>(
      '[data-testid="canvas-host"]',
    );
    const viewport = window.__FLIXEL_PIXI_UI__?.app?.viewport;
    if (!host || !viewport) return null;
    host.style.width = '900px';
    host.style.height = '300px';
    return {
      hostHeight: host.clientHeight,
      hostWidth: host.clientWidth,
      snapshot: viewport.setMode('fit'),
    };
  });
  expect(fit?.snapshot).toMatchObject({
    displayHeight: fit?.hostHeight,
    displayWidth: (fit?.hostHeight ?? 0) * 2,
    left: ((fit?.hostWidth ?? 0) - (fit?.hostHeight ?? 0) * 2) / 2,
    scale: (fit?.hostHeight ?? 0) / 320,
    top: 0,
  });

  const damage = page.locator('[data-flx-accessible-button]').first();
  await expect(damage).toBeVisible();
  await damage.focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(() => window.__FLIXEL_PIXI_UI__?.snapshot?.()?.health),
    )
    .toBe(50);

  const integer = await page.evaluate(() => {
    const host = document.querySelector<HTMLElement>(
      '[data-testid="canvas-host"]',
    );
    const snapshot =
      window.__FLIXEL_PIXI_UI__?.app?.viewport.setMode('integer');
    return host && snapshot
      ? { hostHeight: host.clientHeight, hostWidth: host.clientWidth, snapshot }
      : null;
  });
  expect(integer?.snapshot).toMatchObject({
    displayHeight: 320,
    displayWidth: 640,
    left: ((integer?.hostWidth ?? 0) - 640) / 2,
    scale: 1,
    top: ((integer?.hostHeight ?? 0) - 320) / 2,
  });
  await expect(damage).toBeVisible();
});
