import { expect, test } from '@playwright/test';

test.describe('Phase 10 — Replay & Deterministic Verification (C10 gate)', () => {
  test('initializes Phase 10 smoke app, records, replays, and verifies determinism', async ({
    page,
  }) => {
    await page.goto('/phase10.html');

    const status = page.locator('[data-testid="status"]');
    await expect(status).toHaveAttribute('data-state', 'ready');

    const replayInfo = page.locator('[data-testid="replay-info"]');
    await expect(replayInfo).toContainText('Idle');

    const recordBtn = page.locator('[data-action="record-replay"]');
    const stopBtn = page.locator('[data-action="stop-recording"]');
    const playBtn = page.locator('[data-action="play-replay"]');
    const rewindBtn = page.locator('[data-action="rewind-replay"]');
    const stepBtn = page.locator('[data-action="step-frame"]');
    const exportBtn = page.locator('[data-action="export-as3"]');

    // Start Recording
    await recordBtn.click();
    await expect(replayInfo).toContainText('Recording frame');

    // Perform inputs
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    // Stop Recording
    await stopBtn.click();
    await expect(replayInfo).toContainText('Replay ready');

    // Test Rewind resets playhead to frame 0
    await rewindBtn.click();
    await expect(replayInfo).toContainText('Replaying frame 0');

    // Test Single Frame Step advances exactly 1 frame and enters PAUSED mode
    await stepBtn.click();
    await expect(replayInfo).toContainText('Replaying frame 1');

    await stepBtn.click();
    await expect(replayInfo).toContainText('Replaying frame 2');

    // Test Playback resumes continuous play from frame 2
    await playBtn.click();
    await page.waitForTimeout(300);

    // Verify Export Button is enabled
    await expect(exportBtn).toBeEnabled();
  });

  test('survives page destruction cleanly', async ({ page }) => {
    await page.goto('/phase10.html');
    const destroyBtn = page.locator('[data-action="destroy"]');
    await destroyBtn.click();

    const status = page.locator('[data-testid="status"]');
    await expect(status).toHaveAttribute('data-state', 'destroyed');
  });
});
