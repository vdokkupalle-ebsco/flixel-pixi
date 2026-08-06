import { Application, Sprite, Texture } from 'pixi.js';

export interface SmokeApplication {
  readonly app: Application;
  destroy(): void;
}

export async function createSmokeApplication(
  host: HTMLElement,
): Promise<SmokeApplication> {
  const app = new Application();

  await app.init({
    antialias: false,
    autoDensity: true,
    background: '#171c26',
    preference: 'webgl',
    resolution: window.devicePixelRatio,
    resizeTo: host,
    sharedTicker: false,
  });

  host.append(app.canvas);

  const sprite = new Sprite(Texture.WHITE);
  sprite.anchor.set(0.5);
  sprite.height = 72;
  sprite.tint = 0x7bdff2;
  sprite.width = 72;
  app.stage.addChild(sprite);

  let destroyed = false;
  let layoutFrame: number | undefined;

  const layout = (): void => {
    sprite.position.set(app.screen.width / 2, app.screen.height / 2);
  };

  const queueLayout = (): void => {
    if (layoutFrame !== undefined) {
      window.cancelAnimationFrame(layoutFrame);
    }

    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = undefined;
      layout();
    });
  };

  layout();
  window.addEventListener('resize', queueLayout);

  return {
    app,
    destroy(): void {
      if (destroyed) {
        return;
      }

      destroyed = true;
      window.removeEventListener('resize', queueLayout);

      if (layoutFrame !== undefined) {
        window.cancelAnimationFrame(layoutFrame);
      }

      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true },
      );
    },
  };
}
