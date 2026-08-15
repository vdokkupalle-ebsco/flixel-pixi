// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('supports unsubscribed audio services and default viewport placement', () => {
    const audio = { mute: false, volume: 0.5 };
    const controls = new FlxAudioControls(audio as never, {
      ariaLabel: 'Sound settings',
      className: 'compact  bright',
      position: 'top-left',
    });
    const root = document.body.querySelector<HTMLElement>(
      '[data-testid="flx-audio-controls"]',
    );
    const mute = root?.querySelector<HTMLButtonElement>(
      '[data-testid="flx-audio-mute"]',
    );
    const volume = root?.querySelector<HTMLInputElement>(
      '[data-testid="flx-audio-volume"]',
    );
    expect(root?.classList.contains('compact')).toBe(true);
    expect(root?.classList.contains('bright')).toBe(true);
    expect(root?.getAttribute('aria-label')).toBe('Sound settings');
    expect(root?.style.position).toBe('fixed');
    expect(root?.style.top).toBe('0.5rem');
    expect(root?.style.left).toBe('0.5rem');

    mute?.click();
    expect(audio.mute).toBe(true);
    expect(mute?.textContent).toBe('Unmute');
    if (volume) {
      volume.value = '0.25';
      volume.dispatchEvent(new Event('input'));
    }
    expect(audio.volume).toBe(0.25);
    expect(volume?.getAttribute('aria-valuetext')).toBe('25%');
    controls.destroy();
  });

  it('ignores invalid persisted state and unavailable storage', () => {
    localStorage.setItem('flixel-pixi:audio', '{invalid');
    const audio = { mute: false, volume: 1 };
    const invalidControls = new FlxAudioControls(audio as never, {
      persist: true,
      position: 'bottom-left',
    });
    expect(audio).toEqual({ mute: false, volume: 1 });
    invalidControls.destroy();

    localStorage.setItem(
      'typed-audio',
      JSON.stringify({ mute: 'yes', volume: 'loud' }),
    );
    const typedControls = new FlxAudioControls(audio as never, {
      persist: 'typed-audio',
    });
    expect(audio).toEqual({ mute: false, volume: 1 });
    typedControls.destroy();

    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const unavailableControls = new FlxAudioControls(audio as never, {
      persist: 'unavailable',
    });
    const mute = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="flx-audio-mute"]',
    );
    expect(() => mute?.click()).not.toThrow();
    expect(setItem).toHaveBeenCalled();
    unavailableControls.destroy();
    setItem.mockRestore();
  });
});
