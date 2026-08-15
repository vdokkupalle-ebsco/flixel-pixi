import { expect, test } from '@playwright/test';

const AMBIENT_AUDIO_DEMO = 'http://127.0.0.1:4174/ambient-audio/';

test('demonstrates viewport-gated spatial attenuation and panning @cross-browser', async ({
  page,
}) => {
  await page.goto(AMBIENT_AUDIO_DEMO);
  await expect(page.locator('[data-testid="status"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 20_000 },
  );
  await page.locator('canvas').click();

  const snapshot = () =>
    page.evaluate(() => window.__FLIXEL_PIXI_AMBIENT_AUDIO__?.snapshot?.());
  const moveTo = async (x: number): Promise<void> => {
    await page.evaluate((nextX) => {
      window.__FLIXEL_PIXI_AMBIENT_AUDIO__?.setPlayerX?.(nextX);
    }, x);
  };

  await moveTo(100);
  await expect.poll(snapshot).toMatchObject({
    autoTour: false,
    sources: [
      { name: 'Waterfall', visible: true },
      { name: 'Clock Tower', visible: false },
      { name: 'Alarm Beacon', visible: false },
    ],
  });
  await expect
    .poll(async () => (await snapshot())?.sources[0]?.gain ?? 0)
    .toBeGreaterThan(0);
  const nearStream = await snapshot();
  expect(nearStream?.sources[0]?.gain ?? 0).toBeGreaterThan(0);
  expect(nearStream?.sources[0]?.pan ?? 0).toBeGreaterThan(0);
  expect(nearStream?.sources[1]?.gain).toBe(0);

  await moveTo(980);
  await expect
    .poll(async () => {
      const current = await snapshot();
      return {
        generatorName: current?.sources[1]?.name,
        generatorVisible: current?.sources[1]?.visible,
        streamGain: current?.sources[0]?.gain,
        streamVisible: current?.sources[0]?.visible,
      };
    })
    .toEqual({
      generatorName: 'Clock Tower',
      generatorVisible: true,
      streamGain: 0,
      streamVisible: false,
    });
  await expect
    .poll(async () => (await snapshot())?.sources[1]?.gain ?? 0)
    .toBeGreaterThan(0);
  const pastGenerator = await snapshot();
  expect(pastGenerator?.sources[1]?.gain ?? 0).toBeGreaterThan(0);
  expect(pastGenerator?.sources[1]?.pan ?? 0).toBeLessThan(0);

  await moveTo(1_300);
  await expect
    .poll(async () => {
      const current = await snapshot();
      return {
        alarmGain: current?.sources[2]?.gain,
        alarmVisible: current?.sources[2]?.visible,
        clockGain: current?.sources[1]?.gain,
        clockVisible: current?.sources[1]?.visible,
      };
    })
    .toMatchObject({
      alarmVisible: true,
      clockGain: 0,
      clockVisible: false,
    });
  await expect
    .poll(async () => (await snapshot())?.sources[2]?.gain ?? 0)
    .toBeGreaterThan(0);
  const nearAlarm = await snapshot();
  expect(nearAlarm?.sources[2]?.gain ?? 0).toBeGreaterThan(0);
  expect(nearAlarm?.sources[2]?.pan ?? 0).toBeGreaterThan(0);

  await page.locator('[data-testid="flx-audio-volume"]').evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = '0.25';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect
    .poll(async () => (await snapshot())?.sources[2]?.gain ?? 1)
    .toBeLessThan(nearAlarm?.sources[2]?.gain ?? 0);

  await page.locator('[data-testid="flx-audio-mute"]').click();
  await expect.poll(snapshot).toMatchObject({ masterMuted: true });
  await expect.poll(async () => (await snapshot())?.sources[2]?.gain).toBe(0);

  await page.locator('[data-testid="flx-audio-mute"]').click();
  await expect.poll(snapshot).toMatchObject({ masterMuted: false });

  await page.locator('[data-action="mute"]').click();
  await expect.poll(snapshot).toMatchObject({ ambientMuted: true });
  await expect.poll(async () => (await snapshot())?.sources[2]?.gain).toBe(0);

  await page.evaluate(() => {
    window.__FLIXEL_PIXI_AMBIENT_AUDIO__?.setOffscreen?.('stop');
  });
  await expect.poll(snapshot).toMatchObject({ offscreen: 'stop' });
});
