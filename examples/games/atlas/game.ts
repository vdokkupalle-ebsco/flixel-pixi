import type { Texture } from 'pixi.js';

import {
  FlxAssets,
  FlxBackdrop,
  FlxG,
  FlxSprite,
  FlxState,
  FlxText,
} from '../../../src';

export const ATLAS_BACKGROUND_ASSET = 'texturepacker-demo-background';

const VIEW_WIDTH = 640;
const SOURCE_WIDTH = 1920;
const SOURCE_HEIGHT = 1080;
const SCENE_SCALE = VIEW_WIDTH / SOURCE_WIDTH;
const BACKGROUND_SPEED = 12;
const MIDDLEGROUND_SPEED = 42;
const ANIMATION_CELL_SIZE = 512;
const ANIMATION_DISPLAY_SIZE = 260;

export interface AtlasDemoSnapshot {
  animationFrame: number;
  atlasFrames: number;
  backgroundX: number;
  cellHeight: number;
  cellWidth: number;
  displayWidth: number;
  middlegroundX: number;
}

function label(
  state: FlxState,
  x: number,
  y: number,
  width: number,
  text: string,
  color = 0xffcbd5e1,
  size = 11,
): FlxText {
  const output = new FlxText(x, y, width, text).setFormat(
    undefined,
    size,
    color,
    'left',
  );
  state.add(output);
  return output;
}

/** TexturePacker bundle, trim, rotation, and strip-baking showcase. */
export class AtlasDemoState extends FlxState {
  animated!: FlxSprite;
  #animationTexture: Texture | null = null;
  #background!: FlxBackdrop;
  #middleground!: FlxBackdrop;
  #middlegroundTexture: Texture | null = null;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    FlxG.camera.antialiasing = true;
    const atlas = FlxG.atlas.get('texturepacker-demo');
    const backgroundGraphic = FlxAssets.fromContext(FlxG.context)?.getGraphic(
      ATLAS_BACKGROUND_ASSET,
    );
    if (!backgroundGraphic) {
      throw new Error('Atlas demo background was not loaded');
    }

    backgroundGraphic.texture.source.scaleMode = 'linear';
    this.#background = new FlxBackdrop(
      backgroundGraphic,
      0,
      0,
      VIEW_WIDTH,
      360,
    );
    this.#background.tileScale.make(SCENE_SCALE, SCENE_SCALE);
    this.#background.scrollVelocity.make(-BACKGROUND_SPEED, 0);
    this.#background.repeatY = false;
    this.#background.antialiasing = true;
    this.add(this.#background);

    this.#middlegroundTexture = atlas.makeGraphic(
      [atlas.getFrame('middleground')],
      SOURCE_WIDTH,
      SOURCE_HEIGHT,
    );
    this.#middlegroundTexture.source.scaleMode = 'linear';
    this.#middleground = new FlxBackdrop(
      this.#middlegroundTexture,
      0,
      0,
      VIEW_WIDTH,
      360,
    );
    this.#middleground.tileScale.make(SCENE_SCALE, SCENE_SCALE);
    this.#middleground.scrollVelocity.make(-MIDDLEGROUND_SPEED, 0);
    this.#middleground.repeatY = false;
    this.#middleground.antialiasing = true;
    this.add(this.#middleground);

    label(this, 20, 14, 600, 'TEXTUREPACKER + ASSET BUNDLES', 0xfff8fafc, 16);
    label(
      this,
      20,
      40,
      600,
      '8 ROTATED + TRIMMED WALK FRAMES — RESTORED TO STABLE 650×650 SOURCES',
      0xff0f172a,
      10,
    );

    this.animated = new FlxSprite(190, 68);
    this.animated.addAnimation(
      'walk',
      atlas.framesByPrefix('walk_', 1, 8, { padding: 2 }),
      {
        frameHeight: ANIMATION_CELL_SIZE,
        frameWidth: ANIMATION_CELL_SIZE,
      },
    );
    this.#animationTexture = this.animated.graphic?.texture ?? null;
    if (this.#animationTexture) {
      this.#animationTexture.source.scaleMode = 'linear';
    }
    this.animated.setOriginToCorner();
    this.animated.scale.make(
      ANIMATION_DISPLAY_SIZE / ANIMATION_CELL_SIZE,
      ANIMATION_DISPLAY_SIZE / ANIMATION_CELL_SIZE,
    );
    this.animated.antialiasing = true;
    this.animated.play('walk', { loop: true, speed: 0.12 });
    this.add(this.animated);
    label(
      this,
      20,
      330,
      600,
      'FLXBACKDROP · ONE TILING SPRITE PER LAYER · CONTINUOUS PARALLAX',
      0xfff8fafc,
      10,
    );
  }

  override destroy(): void {
    super.destroy();
    this.#animationTexture?.destroy(true);
    this.#animationTexture = null;
    this.#middlegroundTexture?.destroy(true);
    this.#middlegroundTexture = null;
  }

  snapshot(): AtlasDemoSnapshot {
    return {
      animationFrame: this.animated.animation.frameIndex,
      atlasFrames: FlxG.atlas.get('texturepacker-demo').frameCount,
      backgroundX: this.#background.tilePosition.x,
      cellHeight: this.animated.frameHeight,
      cellWidth: this.animated.frameWidth,
      displayWidth: this.animated.width * this.animated.scale.x,
      middlegroundX: this.#middleground.tilePosition.x,
    };
  }
}
