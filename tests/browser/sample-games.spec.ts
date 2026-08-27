import { expect, test } from '@playwright/test';

const GAMES = 'http://127.0.0.1:4174';

test.describe('Hello sample', () => {
  test('boots, enters play, moves on arrow keys, destroys cleanly @cross-browser', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/hello/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 20_000 },
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

test.describe('Rigid-body physics playground', () => {
  test('steps portable bodies, reports sensors and queries, then destroys @cross-browser', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/physics-playground/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 20_000 },
    );

    const initial = await page.evaluate(() =>
      window.__FLIXEL_PIXI_PHYSICS__?.snapshot?.(),
    );
    expect(initial?.bodies).toBe(12);
    expect(Number.isFinite(initial?.dynamicY)).toBe(true);

    await expect
      .poll(() =>
        page.evaluate(
          () => window.__FLIXEL_PIXI_PHYSICS__?.snapshot?.().sensorEntries ?? 0,
        ),
      )
      .toBeGreaterThan(0);

    const query = await page.evaluate(() =>
      window.__FLIXEL_PIXI_PHYSICS__?.queryAt?.(100, 440),
    );
    expect(query).toContain('floor');
    await expect(page.locator('[data-stat="query"]')).toContainText('floor');

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );
    expect(
      await page.evaluate(
        () => window.__FLIXEL_PIXI_PHYSICS__?.destroyed ?? false,
      ),
    ).toBe(true);
  });
});

test.describe('Portable physics joints showcase', () => {
  test('boots all five joints and demonstrates solver motion @cross-browser', async ({
    page,
  }) => {
    await page.goto(`${GAMES}/physics-joints/`);
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 20_000 },
    );

    const initial = await page.evaluate(() =>
      window.__FLIXEL_PIXI_JOINTS__?.snapshot?.(),
    );
    expect(initial?.jointCount).toBe(5);
    expect(initial?.draggableCount).toBe(5);
    expect(Number.isFinite(initial?.revoluteAngle)).toBe(true);

    const canvas = page.locator('canvas');
    const bounds = await canvas.boundingBox();
    if (bounds === null || initial === undefined) {
      throw new Error('Joint showcase canvas or snapshot is unavailable.');
    }
    const gameToPage = (x: number, y: number) => ({
      x: bounds.x + (x / 900) * bounds.width,
      y: bounds.y + (y / 540) * bounds.height,
    });
    let doorStart = gameToPage(initial.prismaticX + 21, 192);
    let draggingId: string | null | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await page.evaluate(() =>
        window.__FLIXEL_PIXI_JOINTS__?.snapshot?.(),
      );
      if (current === undefined) break;
      doorStart = gameToPage(current.prismaticX + 21, 192);
      await page.mouse.move(doorStart.x, doorStart.y);
      await page.mouse.down();
      await page.waitForTimeout(100);
      draggingId = await page.evaluate(
        () => window.__FLIXEL_PIXI_JOINTS__?.snapshot?.().draggingId,
      );
      if (draggingId === 'prismatic-door') break;
      await page.mouse.up();
    }
    expect(draggingId).toBe('prismatic-door');
    const beforeDragX = await page.evaluate(
      () => window.__FLIXEL_PIXI_JOINTS__?.snapshot?.().prismaticX,
    );
    const dragDirection = (beforeDragX ?? 730) < 730 ? 1 : -1;
    await page.mouse.move(doorStart.x + dragDirection * 70, doorStart.y, {
      steps: 8,
    });
    await expect
      .poll(async () => {
        const currentX = await page.evaluate(
          () => window.__FLIXEL_PIXI_JOINTS__?.snapshot?.().prismaticX,
        );
        return Math.abs((currentX ?? beforeDragX ?? 0) - (beforeDragX ?? 0));
      })
      .toBeGreaterThan(15);
    await page.mouse.up();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.__FLIXEL_PIXI_JOINTS__?.snapshot?.().draggingId,
        ),
      )
      .toBeNull();

    await expect
      .poll(() =>
        page.evaluate(() =>
          Math.abs(window.__FLIXEL_PIXI_JOINTS__?.snapshot?.().wheelAngle ?? 0),
        ),
      )
      .toBeGreaterThan(10);
    await expect(canvas).toBeVisible();
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

    const shotsBefore = await page.evaluate(
      () => window.__FLIXEL_PIXI_INVADERS__?.playerShotsFired?.() ?? 0,
    );
    await page.keyboard.press('Space');
    await page.waitForFunction(
      (previous) =>
        (window.__FLIXEL_PIXI_INVADERS__?.playerShotsFired?.() ?? 0) > previous,
      shotsBefore,
    );

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
