import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Hello sample', () => {
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
    await page.waitForFunction(() => {
      return Number.isFinite(window.__FLIXEL_PIXI_HELLO__?.playerX?.());
    });

    const before = await page.evaluate(() => ({
      x: window.__FLIXEL_PIXI_HELLO__?.playerX?.() ?? NaN,
      y: window.__FLIXEL_PIXI_HELLO__?.playerY?.() ?? NaN,
    }));
    expect(Number.isFinite(before.x)).toBe(true);

    await page.evaluate(() => {
      window.__FLIXEL_PIXI_HELLO__?.moveRight?.();
    });

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

  test('falls back from failed WebGPU initialization without changing gameplay', async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));
    await page.addInitScript(() => {
      let adapterRequests = 0;
      const supportAdapter = {
        requestDevice: async () => ({}),
      };
      Object.defineProperty(navigator, 'gpu', {
        configurable: true,
        value: {
          requestAdapter: async () => {
            adapterRequests += 1;
            return adapterRequests === 1 ? supportAdapter : null;
          },
        },
      });
    });
    await page.goto(`${GAMES}/hello/?renderer=webgpu`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 10_000 },
    );

    const renderer = await page.evaluate(() => ({
      backend: window.__FLIXEL_PIXI_HELLO__?.rendererBackend,
      fallback: window.__FLIXEL_PIXI_HELLO__?.rendererFallback,
    }));
    expect(renderer).toEqual({
      backend: 'webgl',
      fallback: expect.objectContaining({ from: 'webgpu', to: 'webgl' }),
    });

    await page.evaluate(() => window.__FLIXEL_PIXI_HELLO__?.startPlay?.());
    await page.waitForFunction(() =>
      Number.isFinite(window.__FLIXEL_PIXI_HELLO__?.playerX?.()),
    );
    const before = await page.evaluate(
      () => window.__FLIXEL_PIXI_HELLO__?.playerX?.() ?? Number.NaN,
    );
    await page.evaluate(() => window.__FLIXEL_PIXI_HELLO__?.moveRight?.());
    const after = await page.evaluate(
      () => window.__FLIXEL_PIXI_HELLO__?.playerX?.() ?? Number.NaN,
    );
    expect(after).toBe(before + 10);
    expect(pageErrors).toEqual([]);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});

test.describe('Platformer sample', () => {
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

test.describe('Action sample', () => {
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

test.describe('Mode Lite compatibility sample', () => {
  test('boots menu, enters play, spawns visible enemies, destroys', async ({
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

    // Enemies spawn every ~0.9s; wait for at least one and ensure it is
    // registered with the camera renderer (not just in the Flixel group).
    await page.waitForFunction(
      () => (window.__FLIXEL_PIXI_EXTERNAL__?.enemyCount?.() ?? 0) >= 1,
      { timeout: 5_000 },
    );
    const registered = await page.evaluate(
      () => window.__FLIXEL_PIXI_EXTERNAL__?.registeredCount?.() ?? 0,
    );
    // player + 12 bullets + hud text + ≥1 enemy
    expect(registered).toBeGreaterThan(12);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});

test.describe('Pinned Flx-Invaders source port', () => {
  test('boots, moves, fires a pooled bullet, and destroys', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/flx-invaders/?review=1`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 10_000 },
    );
    const canvas = page.locator('[data-testid="canvas-host"] canvas');
    await expect(canvas).toHaveCSS('image-rendering', 'pixelated');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox?.width).toBe(640);
    expect(canvasBox?.height).toBe(480);
    expect(
      await page.evaluate(
        () => window.__FLIXEL_PIXI_INVADERS__?.alienCount?.() ?? 0,
      ),
    ).toBe(50);

    const before = await page.evaluate(
      () => window.__FLIXEL_PIXI_INVADERS__?.playerX?.() ?? Number.NaN,
    );
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(150);
    await page.keyboard.up('ArrowRight');
    const after = await page.evaluate(
      () => window.__FLIXEL_PIXI_INVADERS__?.playerX?.() ?? Number.NaN,
    );
    expect(after).toBeGreaterThan(before);

    await page.keyboard.down('Space');
    await page.waitForFunction(
      () => (window.__FLIXEL_PIXI_INVADERS__?.activePlayerBullets?.() ?? 0) > 0,
    );
    await page.keyboard.up('Space');

    await page.evaluate(() => {
      window.__FLIXEL_PIXI_INVADERS__?.hitFirstAlien?.();
    });
    await page.waitForFunction(
      () => (window.__FLIXEL_PIXI_INVADERS__?.alienCount?.() ?? 50) === 49,
    );

    await page.locator('[data-action="validate-win"]').click();
    await page.waitForFunction(
      () => window.__FLIXEL_PIXI_INVADERS__?.statusText?.() === 'YOU WON',
    );
    expect(
      await page.evaluate(
        () => window.__FLIXEL_PIXI_INVADERS__?.alienCount?.() ?? 0,
      ),
    ).toBe(50);

    await page.locator('[data-action="validate-loss"]').click();
    await page.waitForFunction(
      () => window.__FLIXEL_PIXI_INVADERS__?.statusText?.() === 'YOU LOST',
    );
    expect(
      await page.evaluate(
        () => window.__FLIXEL_PIXI_INVADERS__?.alienCount?.() ?? 0,
      ),
    ).toBe(50);

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
  });
});
