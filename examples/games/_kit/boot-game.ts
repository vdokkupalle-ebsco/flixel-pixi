import {
  createBrowserGame,
  type BrowserGameApplication,
  type CreateBrowserGameOptions,
} from '../../../src';

export type BootGameOptions = CreateBrowserGameOptions;
export type GameApplication = BrowserGameApplication;

export const bootGame = createBrowserGame;
