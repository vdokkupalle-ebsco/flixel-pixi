import type {
  FlxAudioService,
  FlxAudioState,
} from '../audio/flx-audio-manager';

/** Corner used by the optional browser audio controls. @public */
export type FlxAudioControlsPosition =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Options for {@link FlxAudioControls}. @public */
export interface FlxAudioControlsOptions {
  /** Accessible label for the control group. */
  ariaLabel?: string;
  /** Optional CSS class names applied to the root. */
  className?: string;
  /** Overlay host. Defaults to document.body. */
  container?: HTMLElement;
  /** Whether positioning is relative to the host or viewport. */
  placement?: 'host' | 'viewport';
  /** Persist preferences in localStorage. `true` uses a default key. */
  persist?: boolean | string;
  /** Screen corner. Defaults to bottom-right. */
  position?: FlxAudioControlsPosition;
}

/** Accessible, dependency-free DOM controls for master game audio. @public */
export class FlxAudioControls {
  readonly #audio: FlxAudioService;
  readonly #container: HTMLElement;
  readonly #muteButton: HTMLButtonElement;
  readonly #originalContainerPosition: string;
  readonly #persistKey: string | null;
  readonly #root: HTMLDivElement;
  readonly #volume: HTMLInputElement;
  #changedContainerPosition = false;
  #unsubscribe: (() => void) | undefined;

  constructor(audio: FlxAudioService, options: FlxAudioControlsOptions = {}) {
    const {
      ariaLabel = 'Game audio',
      className,
      container = document.body,
      persist = false,
      placement = container === document.body ? 'viewport' : 'host',
      position = 'bottom-right',
    } = options;
    this.#audio = audio;
    this.#container = container;
    this.#originalContainerPosition = container.style.position;
    this.#persistKey = persist === true ? 'flixel-pixi:audio' : persist || null;
    this.#restore();

    this.#root = document.createElement('div');
    this.#root.className = `flx-audio-controls flx-audio-controls--${position}`;
    if (className) {
      this.#root.classList.add(
        ...className.split(/\s+/).filter((part) => part.length > 0),
      );
    }
    this.#root.setAttribute('role', 'group');
    this.#root.setAttribute('aria-label', ariaLabel);
    this.#root.setAttribute('data-testid', 'flx-audio-controls');
    this.#root.style.cssText = [
      `position:${placement === 'viewport' ? 'fixed' : 'absolute'}`,
      ...positionStyles(position),
      'z-index:1001',
      'display:flex',
      'align-items:center',
      'gap:0.4rem',
      'padding:0.35rem',
      'border-radius:0.4rem',
      'background:rgba(2,6,23,0.86)',
      'color:#e2e8f0',
      'font:600 0.75rem/1 system-ui,sans-serif',
    ].join(';');

    this.#muteButton = document.createElement('button');
    this.#muteButton.type = 'button';
    this.#muteButton.setAttribute('data-testid', 'flx-audio-mute');
    this.#muteButton.addEventListener('click', this.#toggleMute);

    this.#volume = document.createElement('input');
    this.#volume.type = 'range';
    this.#volume.min = '0';
    this.#volume.max = '1';
    this.#volume.step = '0.05';
    this.#volume.setAttribute('aria-label', 'Master volume');
    this.#volume.setAttribute('data-testid', 'flx-audio-volume');
    this.#volume.style.width = '6rem';
    this.#volume.addEventListener('input', this.#setVolume);

    this.#root.append(this.#muteButton, this.#volume);
    const containerPosition = getComputedStyle(container).position;
    if (
      placement === 'host' &&
      (containerPosition === '' || containerPosition === 'static')
    ) {
      container.style.position = 'relative';
      this.#changedContainerPosition = true;
    }
    container.appendChild(this.#root);
    this.#unsubscribe = audio.onChange?.((state) => {
      this.#sync(state);
      this.#save(state);
    });
    this.#sync({ mute: audio.mute, volume: audio.volume });
  }

  /** Remove controls, subscriptions, and browser event listeners. */
  destroy(): void {
    this.#unsubscribe?.();
    this.#muteButton.removeEventListener('click', this.#toggleMute);
    this.#volume.removeEventListener('input', this.#setVolume);
    this.#root.remove();
    if (this.#changedContainerPosition) {
      this.#container.style.position = this.#originalContainerPosition;
    }
  }

  readonly #toggleMute = (): void => {
    this.#audio.mute = !this.#audio.mute;
    this.#commitWithoutSubscription();
  };

  readonly #setVolume = (): void => {
    this.#audio.volume = Number(this.#volume.value);
    this.#commitWithoutSubscription();
  };

  #commitWithoutSubscription(): void {
    if (this.#unsubscribe) return;
    const state = { mute: this.#audio.mute, volume: this.#audio.volume };
    this.#sync(state);
    this.#save(state);
  }

  #sync(state: FlxAudioState): void {
    this.#volume.value = String(state.volume);
    this.#volume.setAttribute(
      'aria-valuetext',
      `${Math.round(state.volume * 100)}%`,
    );
    this.#muteButton.textContent = state.mute ? 'Unmute' : 'Mute';
    this.#muteButton.setAttribute('aria-pressed', String(state.mute));
    this.#root.dataset.muted = String(state.mute);
  }

  #restore(): void {
    if (!this.#persistKey) return;
    try {
      const value = localStorage.getItem(this.#persistKey);
      if (!value) return;
      const state = JSON.parse(value) as Partial<FlxAudioState>;
      if (typeof state.volume === 'number' && Number.isFinite(state.volume)) {
        this.#audio.volume = state.volume;
      }
      if (typeof state.mute === 'boolean') this.#audio.mute = state.mute;
    } catch {
      // Storage is optional; invalid or unavailable data must not block boot.
    }
  }

  #save(state: FlxAudioState): void {
    if (!this.#persistKey) return;
    try {
      localStorage.setItem(this.#persistKey, JSON.stringify(state));
    } catch {
      // Storage is optional and may be unavailable or full.
    }
  }
}

function positionStyles(position: FlxAudioControlsPosition): string[] {
  const vertical = position.startsWith('top') ? 'top:0.5rem' : 'bottom:0.5rem';
  const horizontal = position.endsWith('right')
    ? 'right:0.5rem'
    : 'left:0.5rem';
  return [vertical, horizontal];
}
