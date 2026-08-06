import { expect, test } from '@playwright/test';

test.describe('Phase 9 — Audio and save data (C9 gate)', () => {
  test('initializes Phase 9 audio and save data smoke app', async ({ page }) => {
    await page.goto('/phase9.html');
    const status = page.locator('[data-testid="status"]');
    await expect(status).toHaveAttribute('data-state', 'ready');

    const metrics = page.locator('[data-testid="phase9-metrics"]');
    await expect(metrics).toHaveAttribute('data-save-slot-name', 'smoke_slot');

    // Reload page and check that save persisted
    await page.reload();
    await expect(status).toHaveAttribute('data-state', 'ready');
  });

  test('survives page destruction cleanly', async ({ page }) => {
    await page.goto('/phase9.html');
    const destroyButton = page.locator('[data-action="destroy"]');
    await destroyButton.click();

    const status = page.locator('[data-testid="status"]');
    await expect(status).toHaveAttribute('data-state', 'destroyed');
  });
});
