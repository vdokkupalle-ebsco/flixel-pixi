import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const LEVEL_EDITOR_URL = 'http://127.0.0.1:4176';

test.describe('Level Editor', () => {
  test('authors and previews a portable scene @cross-browser', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(LEVEL_EDITOR_URL);
    await expect(page).toHaveTitle(/Level Editor/);
    await page.getByRole('button', { name: 'Add first sprite' }).click();
    await expect(page.locator('.tree-row')).toHaveCount(1);
    await expect(
      page.getByRole('textbox', { name: 'Name', exact: true }),
    ).toHaveValue('Sprite 1');
    await page.getByLabel('Frame width').fill('64');
    await page.getByLabel('Frame height').fill('64');
    await page.getByLabel('Column').fill('1');
    await page.getByRole('spinbutton', { name: 'Row', exact: true }).fill('1');

    await page.getByRole('button', { name: 'Add physics body' }).click();
    await expect(page.getByLabel('Body type')).toHaveValue('dynamic');
    await page.getByRole('tab', { name: 'Assets' }).click();
    await page.getByRole('button', { name: /Place Neon sparks/ }).click();
    await page.getByRole('tab', { name: 'Scene' }).click();
    await expect(page.locator('.tree-row')).toHaveCount(2);

    await page.getByRole('button', { name: 'Preview' }).click();
    const preview = page.frameLocator('[data-preview-frame]');
    await expect(preview.getByRole('status')).toContainText(
      'Main scene · 0 tiles · 2 objects',
      {
        timeout: 15_000,
      },
    );
    expect(errors).toEqual([]);
  });

  test('supports keyboard transforms and non-drag layer controls', async ({
    page,
  }) => {
    await page.goto(LEVEL_EDITOR_URL);
    await page.getByRole('button', { name: 'Add first sprite' }).click();
    await page.getByRole('button', { name: 'Add sprite' }).click();
    await page.getByRole('button', { name: /Sprite 1 sprite/ }).click();
    const canvas = page.getByLabel(/Scene canvas/);
    await canvas.focus();
    await canvas.press('ArrowRight');
    await expect(
      page.getByRole('spinbutton', { name: 'X', exact: true }),
    ).toHaveValue('153.0');
    await page.getByRole('button', { name: /Move Sprite 1 forward/ }).click();
    await expect(page.getByLabel('Order within layer')).toHaveValue('2');
  });

  test('imports XML spritesheet frames, places them, and duplicates them', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(LEVEL_EDITOR_URL);
    await page.getByRole('tab', { name: 'Assets' }).click();
    await page.locator('[data-asset-input]').setInputFiles([
      {
        buffer: readFileSync('examples/games/atlas/atlas.png'),
        mimeType: 'image/png',
        name: 'atlas.png',
      },
      {
        buffer: Buffer.from(
          `<TextureAtlas image="atlas.png"><sprite n="player-idle" x="0" y="0" w="64" h="64"/><sprite n="platform" x="64" y="0" w="96" h="32"/></TextureAtlas>`,
        ),
        mimeType: 'application/xml',
        name: 'atlas.xml',
      },
    ]);
    await expect(page.getByText('2 frames', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Place platform in scene' }).click();
    await page.getByRole('tab', { name: 'Scene' }).click();
    await expect(page.locator('.tree-row')).toHaveCount(1);
    await expect(page.getByLabel('Frame width')).toHaveValue('96');
    await expect(page.getByLabel('Pixel X')).toHaveValue('64');
    await page.getByRole('button', { name: 'Duplicate selection' }).click();
    await expect(page.locator('.tree-row')).toHaveCount(2);
    await expect(page.getByLabel('Purpose layer')).toHaveValue(
      'layer-gameplay',
    );
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(
      page.frameLocator('[data-preview-frame]').getByRole('status'),
    ).toContainText('Main scene · 0 tiles · 2 objects', {
      timeout: 15_000,
    });
    expect(errors).toEqual([]);
  });

  test('keeps the stage visible while a large atlas scrolls in Assets', async ({
    page,
  }) => {
    await page.goto(LEVEL_EDITOR_URL);
    const stage = page.getByLabel('Scene workspace');
    const heightBefore = await stage.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await page.getByRole('tab', { name: 'Assets' }).click();
    await page
      .locator('[data-asset-input]')
      .setInputFiles([
        'examples/games/kenney-platformer/assets/spritesheet_ground.png',
        'examples/games/kenney-platformer/assets/spritesheet_ground.xml',
      ]);
    await expect(page.getByText(/frames$/).first()).toBeVisible();
    const layout = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(
        '[data-panel="assets"]',
      );
      const stageElement = document.querySelector<HTMLElement>('.stage');
      if (panel === null || stageElement === null)
        throw new Error('Level Editor layout is missing.');
      return {
        panelClientHeight: panel.clientHeight,
        panelScrollHeight: panel.scrollHeight,
        stageHeight: stageElement.getBoundingClientRect().height,
      };
    });
    expect(layout.stageHeight).toBeCloseTo(heightBefore, 0);
    expect(layout.panelScrollHeight).toBeGreaterThan(layout.panelClientHeight);
    await expect(stage).toBeVisible();
  });

  test('authors a joint between two hierarchy selections', async ({ page }) => {
    await page.goto(LEVEL_EDITOR_URL);
    await page.getByRole('button', { name: 'Add first sprite' }).click();
    await page.getByRole('button', { name: 'Add physics body' }).click();
    await page.getByRole('button', { name: 'Add sprite' }).click();
    await page.getByRole('button', { name: 'Add physics body' }).click();

    await page.getByRole('button', { name: /Sprite 1 sprite/ }).click();
    await page
      .getByRole('button', { name: /Sprite 2 sprite/ })
      .click({ modifiers: ['Shift'] });
    await expect(page.getByLabel('Connect selected')).toBeVisible();
    await page.getByRole('button', { name: 'Create joint' }).click();
    await expect(page.locator('.joint-row')).toContainText('distance');
  });

  test('adapts to a narrow viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto(LEVEL_EDITOR_URL);
    await expect(page.getByLabel('Flixel-Pixi Level Editor')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('provides named controls and a keyboard focus path', async ({
    page,
  }) => {
    await page.goto(LEVEL_EDITOR_URL);
    const unnamedControls = await page
      .locator('button, a, input, select')
      .evaluateAll((controls) =>
        controls
          .filter((control) => {
            const element = control as HTMLElement;
            if (element.closest('[hidden]') !== null) return false;
            const label = element.closest('label')?.textContent?.trim() ?? '';
            return !(
              element.getAttribute('aria-label') ||
              element.getAttribute('title') ||
              element.textContent?.trim() ||
              label
            );
          })
          .map((control) => control.outerHTML),
      );
    expect(unnamedControls).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).not.toHaveJSProperty(
      'tagName',
      'BODY',
    );
    await expect(page.locator('[data-status]')).toContainText('Project ready');
  });

  test('loads and renders a 300-object project within the editor budget', async ({
    page,
  }) => {
    await page.goto(LEVEL_EDITOR_URL);
    const entities = Array.from({ length: 300 }, (_, index) => ({
      id: `sprite-${String(index)}`,
      name: `Sprite ${String(index + 1)}`,
      position: {
        x: 32 + (index % 20) * 44,
        y: 32 + Math.floor(index / 20) * 30,
      },
      properties: {
        assetId: 'missing-performance-placeholder',
        height: 24,
        locked: false,
        originX: 0.5,
        originY: 0.5,
        visible: true,
        width: 24,
        zIndex: index,
      },
      rotation: 0,
      scale: { x: 1, y: 1 },
      type: 'sprite',
    }));
    const project = {
      assets: [],
      extensions: {
        flixelPixiLevelEditor: {
          activeSceneId: 'scene-main',
          scenes: {
            'scene-main': {
              background: '#0b1320',
              gridSize: 16,
              height: 540,
              physics: {
                bodies: [],
                gravity: { x: 0, y: 900 },
                id: 'scene-main-physics',
                joints: [],
                kind: 'flixel-pixi-physics-world',
                schemaVersion: 1,
              },
              width: 960,
            },
          },
          version: 1,
        },
      },
      project: { id: 'performance-project', name: 'Performance project' },
      scenes: [{ entities, id: 'scene-main', name: 'Main scene' }],
      schemaVersion: 1,
    };
    const startedAt = Date.now();
    await page.locator('[data-project-input]').setInputFiles({
      buffer: Buffer.from(JSON.stringify(project)),
      mimeType: 'application/json',
      name: 'performance-project.json',
    });
    await expect(page.getByText('300 objects', { exact: true })).toBeVisible();
    expect(Date.now() - startedAt).toBeLessThan(5_000);
  });
});
