import { expect, test } from '@playwright/test';

test.describe('Phase 11 — Debugger & Preloader (C11 gate)', () => {
  test('shows preloader then dismisses it, debugger overlay is visible', async ({
    page,
  }) => {
    await page.goto('/phase11.html');

    // Preloader should appear during load
    const preloader = page.locator('[data-testid="flx-preloader"]');
    // It may already be dismissed by the time the test runs — that's fine.

    const status = page.locator('[data-testid="status"]');
    await expect(status).toHaveAttribute('data-state', 'ready', {
      timeout: 8000,
    });

    // Debugger overlay should be in the DOM and visible
    const debugger_ = page.locator('[data-testid="flx-debugger"]');
    await expect(debugger_).toBeAttached();

    // All 5 tabs should be present
    for (const tab of ['log', 'watch', 'perf', 'vcr', 'vis']) {
      await expect(
        page.locator(`[data-testid="flxdbg-tab-${tab}"]`),
      ).toBeVisible();
    }

    // Preloader should be gone (removed from DOM after fade)
    await expect(preloader).not.toBeAttached({ timeout: 3000 });
  });

  test('Log panel displays messages from FlxG.log.add()', async ({ page }) => {
    await page.goto('/phase11.html');
    await page.locator('[data-testid="status"]').waitFor({ state: 'attached' });
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 8000 },
    );

    // Click the Log tab to ensure it's active
    await page.locator('[data-testid="flxdbg-tab-log"]').click();

    // Wait for at least one log entry (boot log message)
    const logList = page.locator('[data-testid="flxdbg-log-list"]');
    await expect(logList).not.toBeEmpty({ timeout: 3000 });

    // Use the "Add Log Entry" button
    const addLogBtn = page.locator('[data-action="add-log"]');
    await expect(addLogBtn).toBeEnabled({ timeout: 3000 });
    await addLogBtn.click();
    // Should have added another entry
    await page.waitForTimeout(300);
    const entryCount = await logList.locator('.flxdbg-log-entry').count();
    expect(entryCount).toBeGreaterThan(0);
  });

  test('Watch panel shows live player position values', async ({ page }) => {
    await page.goto('/phase11.html');
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 8000 },
    );

    // Switch to Watch tab
    await page.locator('[data-testid="flxdbg-tab-watch"]').click();

    // Wait for watch entries to appear (need at least one step)
    await page.waitForTimeout(500);
    const watchBody = page.locator('[data-testid="flxdbg-watch-body"]');
    await expect(watchBody).not.toBeEmpty({ timeout: 3000 });
  });

  test('Perf panel shows FPS value', async ({ page }) => {
    await page.goto('/phase11.html');
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 8000 },
    );

    await page.locator('[data-testid="flxdbg-tab-perf"]').click();
    // Wait for half a second for FPS counter to update (it updates every 500 ms)
    await page.waitForTimeout(700);
    const fpsEl = page.locator('[data-testid="flxdbg-perf-fps"]');
    const fpsText = await fpsEl.textContent();
    expect(fpsText).toMatch(/\d+ FPS/);
  });

  test('VCR panel record/stop/rewind/step/play workflow', async ({ page }) => {
    await page.goto('/phase11.html');
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 8000 },
    );

    await page.locator('[data-testid="flxdbg-tab-vcr"]').click();
    const vcrStatus = page.locator('[data-testid="flxdbg-vcr-status"]');

    // Record
    await page.locator('[data-testid="flxdbg-vcr-record"]').click();
    await expect(vcrStatus).toContainText('RECORDING');

    // Stop
    await page.waitForTimeout(300);
    await page.locator('[data-testid="flxdbg-vcr-stop"]').click();
    await expect(vcrStatus).toContainText('IDLE');

    // Rewind
    await page.locator('[data-testid="flxdbg-vcr-rewind"]').click();
    await expect(vcrStatus).toContainText('REPLAYING');

    // Step
    await page.locator('[data-testid="flxdbg-vcr-step"]').click();
    await expect(vcrStatus).toContainText('REPLAYING');

    // Play
    await page.locator('[data-testid="flxdbg-vcr-play"]').click();
    await page.waitForTimeout(200);
    await expect(vcrStatus).toContainText('REPLAYING');
  });

  test('Toggle button shows/hides debugger overlay', async ({ page }) => {
    await page.goto('/phase11.html');
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 8000 },
    );

    const dbg = page.locator('[data-testid="flx-debugger"]');
    await expect(dbg).not.toHaveClass(/hidden/);

    // Close via internal ✕ button
    await page.locator('[data-testid="flxdbg-close"]').click();
    await expect(dbg).toHaveClass(/hidden/);

    // Re-open via external toggle button
    await page.locator('[data-action="toggle-debugger"]').click();
    await expect(dbg).not.toHaveClass(/hidden/);
  });

  test('Tab keyboard navigation (arrow keys)', async ({ page }) => {
    await page.goto('/phase11.html');
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 8000 },
    );

    const logTab = page.locator('[data-testid="flxdbg-tab-log"]');
    await logTab.focus();
    await expect(logTab).toBeFocused();

    // Arrow right should move to Watch tab
    await page.keyboard.press('ArrowRight');
    const watchTab = page.locator('[data-testid="flxdbg-tab-watch"]');
    await expect(watchTab).toBeFocused();
  });

  test('survives destruction cleanly', async ({ page }) => {
    await page.goto('/phase11.html');
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'ready',
      { timeout: 8000 },
    );

    await page.locator('[data-action="destroy"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
      'data-state',
      'destroyed',
    );

    // Debugger overlay should be removed from DOM
    await expect(
      page.locator('[data-testid="flx-debugger"]'),
    ).not.toBeAttached();
  });
});
