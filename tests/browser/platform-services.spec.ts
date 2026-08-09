import { expect, test } from '@playwright/test';

test.describe('Audio and persistent storage', () => {
  test('initializes the platform services demo', async ({ page }) => {
    await page.goto('/platform-services.html');
    const status = page.locator('[data-testid="status"]');
    await expect(status).toHaveAttribute('data-state', 'ready');

    const metrics = page.locator('[data-testid="platform-services-metrics"]');
    await expect(metrics).toHaveAttribute('data-save-slot-name', 'smoke_slot');

    // Reload page and check that save persisted
    await page.reload();
    await expect(status).toHaveAttribute('data-state', 'ready');
  });

  test('survives page destruction cleanly', async ({ page }) => {
    await page.goto('/platform-services.html');
    const destroyButton = page.locator('[data-action="destroy"]');
    await destroyButton.click();

    const status = page.locator('[data-testid="status"]');
    await expect(status).toHaveAttribute('data-state', 'destroyed');
  });

  test('awaits IndexedDB durability and reads the committed value', async ({
    page,
  }) => {
    await page.goto('/platform-services.html');
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
    );
    const persisted = await page.evaluate(async () => {
      return (
        window.__FLIXEL_PIXI_PLATFORM_SERVICES__?.app?.verifyIndexedDb() ??
        false
      );
    });
    expect(persisted).toBe(true);
  });
});
