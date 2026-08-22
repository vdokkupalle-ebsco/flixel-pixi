import { createBrowserGame, type BrowserGameApplication } from 'flixel-pixi';
import { HeroRunnerState } from './game';

export function startHeroRunner(
  host: HTMLElement,
  signal: AbortSignal,
): Promise<BrowserGameApplication> {
  return createBrowserGame({
    backgroundColor: 0x090d16,
    height: 180,
    host,
    initialState: HeroRunnerState,
    preloader: false,
    signal,
    width: 320,
  });
}

export function jumpHeroRunner(game?: BrowserGameApplication): void {
  const state = game?.game.state;
  if (state instanceof HeroRunnerState) state.requestJump();
}
