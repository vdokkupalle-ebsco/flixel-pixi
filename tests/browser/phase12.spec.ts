import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Phase 12 — Hello sample', () => {
  test('boots, enters play, moves on arrow keys, destroys cleanly', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/hello/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 10_000 },
    );

    await page.evaluate(() => {
      window.__FLIXEL_PIXI_HELLO__?.startPlay?.();
    });
    await page.waitForTimeout(200);

    const before = await page.evaluate(() => ({
      x: window.__FLIXEL_PIXI_HELLO__?.playerX?.() ?? NaN,
      y: window.__FLIXEL_PIXI_HELLO__?.playerY?.() ?? NaN,
    }));
    expect(Number.isFinite(before.x)).toBe(true);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');

    const after = await page.evaluate(() => ({
      x: window.__FLIXEL_PIXI_HELLO__?.playerX?.() ?? NaN,
    }));
    expect(after.x).toBeGreaterThan(before.x);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});

test.describe('Phase 12 — Platformer sample', () => {
  test('boots, lands on floor after settle, destroys cleanly', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/platformer/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 10_000 },
    );

    // Let gravity settle the player onto the floor tiles
    await page.waitForTimeout(1200);
    const grounded = await page.evaluate(() => {
      return window.__FLIXEL_PIXI_PLATFORMER__?.onFloor?.() ?? false;
    });
    expect(grounded).toBe(true);

    const y = await page.evaluate(
      () => window.__FLIXEL_PIXI_PLATFORMER__?.playerY?.() ?? NaN,
    );
    expect(y).toBeGreaterThan(100);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});

test.describe('Phase 12 — Action sample', () => {
  test('boots with two cameras, burst increments, VCR record/stop, destroys', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/action/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 10_000 },
    );

    const cams = await page.evaluate(
      () => window.__FLIXEL_PIXI_ACTION__?.cameraCount?.() ?? 0,
    );
    expect(cams).toBeGreaterThanOrEqual(2);

    const before = await page.evaluate(
      () => window.__FLIXEL_PIXI_ACTION__?.bursts?.() ?? 0,
    );
    await page.locator('[data-action="burst"]').click();
    await page.waitForTimeout(100);
    const after = await page.evaluate(
      () => window.__FLIXEL_PIXI_ACTION__?.bursts?.() ?? 0,
    );
    expect(after).toBeGreaterThan(before);

    await page.locator('[data-action="record"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-action="stop-record"]').click();

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});

test.describe('Phase 12 — External Mode Lite', () => {
  test('boots menu, enters play via hook, destroys cleanly', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/external/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 10_000 },
    );

    await page.evaluate(() => {
      window.__FLIXEL_PIXI_EXTERNAL__?.startPlay?.();
    });
    await page.waitForTimeout(300);
    const score = await page.evaluate(
      () => window.__FLIXEL_PIXI_EXTERNAL__?.score?.() ?? -1,
    );
    expect(score).toBe(0);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});
