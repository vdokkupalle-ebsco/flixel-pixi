// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';

import { FlxAudioManager } from '../../src/audio/flx-audio-manager';
import { NullAudioBackend } from '../../src/audio/null-audio-backend';
import { FlxAudioControls } from '../../src/browser/flx-audio-controls';
import { FlxContext } from '../../src/core/flx-context';

describe('FlxAudioControls', () => {
  beforeEach(() => localStorage.clear());

  it('restores, controls, persists, and tears down master audio settings', () => {
    localStorage.setItem(
      'test-audio',
      JSON.stringify({ mute: true, volume: 0.7 }),
    );
    const host = document.createElement('div');
    document.body.appendChild(host);
    const context = new FlxContext(320, 240);
    const manager = new FlxAudioManager(context, new NullAudioBackend());
    const controls = new FlxAudioControls(manager, {
      container: host,
      persist: 'test-audio',
      placement: 'host',
    });

    const root = host.querySelector<HTMLElement>(
      '[data-testid="flx-audio-controls"]',
    );
    const mute = host.querySelector<HTMLButtonElement>(
      '[data-testid="flx-audio-mute"]',
    );
    const volume = host.querySelector<HTMLInputElement>(
      '[data-testid="flx-audio-volume"]',
    );
    expect(manager.mute).toBe(true);
    expect(manager.volume).toBe(0.7);
    expect(root?.getAttribute('role')).toBe('group');
    expect(mute?.textContent).toBe('Unmute');
    expect(volume?.value).toBe('0.7');

    mute?.click();
    expect(manager.mute).toBe(false);
    if (volume) {
      volume.value = '0.35';
      volume.dispatchEvent(new Event('input'));
    }
    expect(manager.volume).toBe(0.35);
    expect(JSON.parse(localStorage.getItem('test-audio') ?? '')).toEqual({
      mute: false,
      volume: 0.35,
    });

    manager.mute = true;
    expect(mute?.getAttribute('aria-pressed')).toBe('true');
    controls.destroy();
    expect(root?.isConnected).toBe(false);
    manager.destroy();
    host.remove();
  });
});
