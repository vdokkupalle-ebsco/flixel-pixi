import type { Texture } from 'pixi.js';
import { BitmapFont, Cache } from 'pixi.js';

import type { FlxAtlas } from '../../../src';
import {
  FlxBar,
  FlxBitmapFont,
  FlxG,
  FlxNineSliceButton,
  FlxNineSliceSprite,
  FlxSprite,
} from '../../../src';

import sheetPngUrl from './assets/sheet.png';
import sheetXmlUrl from './assets/uipack_rpg_sheet.xml?raw';

const UI_ATLAS_KEY = 'kenney-ui';

const BAR_CAP = 9;
const BAR_BODY = 18;
/** Source frame size for Kenney `buttonLong_*` strips. */
const BUTTON_FRAME_W = 190;
const BUTTON_FRAME_H = 49;
/** Display width — two buttons + gap fit inside the demo panel inset. */
export const KENNEY_BUTTON_W = 170;
const BUTTON_H = 49;

/** Kenney `panel_beige` inset for 100×100 source tiles. */
const PANEL_BORDERS = { bottom: 20, left: 20, right: 20, top: 20 };
/** Kenney `buttonLong_*` rounded end caps (scaled for {@link KENNEY_BUTTON_W}). */
const BUTTON_BORDERS = { bottom: 14, left: 22, right: 22, top: 14 };

let preloadedAtlas: FlxAtlas | null = null;
let preloadedUiFont: FlxBitmapFont | null = null;

const UI_BITMAP_FONT_NAME = 'kenney-ui-label';

function buildUiBitmapFont(): FlxBitmapFont {
  const cacheKey = `${UI_BITMAP_FONT_NAME}-bitmap`;
  if (Cache.has(cacheKey)) {
    return new FlxBitmapFont(Cache.get(cacheKey) as BitmapFont, false);
  }
  BitmapFont.install({
    name: UI_BITMAP_FONT_NAME,
    chars: [
      ['A', 'Z'],
      ['a', 'z'],
      ['0', '9'],
      ' ',
    ],
    resolution: 2,
    style: {
      fontFamily: UI_BITMAP_FONT_NAME,
      fontSize: 16,
      fill: '#ffffff',
    },
    textureStyle: { scaleMode: 'nearest' },
  });
  return new FlxBitmapFont(Cache.get(cacheKey) as BitmapFont, false);
}

/** Flixel-style width stretch for 3-part horizontal bar mids. */
function stretchWidth(
  sprite: FlxSprite,
  width: number,
  frameWidth: number,
): void {
  sprite.width = width;
  sprite.scale.x = width / frameWidth;
}

export async function preloadKenneyUiAtlas(): Promise<FlxAtlas> {
  if (preloadedAtlas !== null) return preloadedAtlas;
  await FlxG.atlas.load(UI_ATLAS_KEY, sheetPngUrl, sheetXmlUrl);
  preloadedAtlas = FlxG.atlas.get(UI_ATLAS_KEY);
  if (preloadedUiFont === null) {
    preloadedUiFont = buildUiBitmapFont();
  }
  return preloadedAtlas;
}

export function requireKenneyUiFont(): FlxBitmapFont {
  if (preloadedUiFont === null) {
    throw new Error('Call preloadKenneyUiAtlas() before booting the UI demo.');
  }
  return preloadedUiFont;
}

export function requireKenneyUiAtlas(): FlxAtlas {
  if (preloadedAtlas === null) {
    throw new Error('Call preloadKenneyUiAtlas() before booting the UI demo.');
  }
  return preloadedAtlas;
}

function frameGraphic(
  atlas: FlxAtlas,
  name: string,
  width: number,
  height: number,
): Texture {
  return atlas.makeGraphic([atlas.getFrame(name)], width, height);
}

function buttonLongGraphic(atlas: FlxAtlas, color: 'blue' | 'beige'): Texture {
  return atlas.makeGraphic(
    [
      atlas.getFrame(`buttonLong_${color}`),
      atlas.getFrame(`buttonLong_${color}`),
      atlas.getFrame(`buttonLong_${color}_pressed`),
      atlas.getFrame('buttonLong_grey'),
    ],
    BUTTON_FRAME_W,
    BUTTON_H,
  );
}

function styleKenneyButtonLabel(
  button: FlxNineSliceButton,
  color: 'blue' | 'beige',
): void {
  if (button.label === null) return;
  button.label.width = KENNEY_BUTTON_W;
  button.label.height = BUTTON_H;
  button.label.frameHeight = BUTTON_H;
  button.label.origin.make(0, 0);
  const labelColor = color === 'blue' ? 0x1a3050 : 0x2b2118;
  button.label.setFormat('Arial', 18, labelColor, 'center');
  const labelY = Math.round((BUTTON_H - 18) * 0.5);
  const pressedY = labelY + 2;
  for (const [index, offset] of button.labelOffsets.entries()) {
    offset.make(0, index === 2 ? pressedY : labelY);
  }
}

export function makeKenneyButton(
  atlas: FlxAtlas,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  color: 'blue' | 'beige' = 'blue',
): FlxNineSliceButton {
  const button = new FlxNineSliceButton(x, y, label, onClick);
  button.loadNineSliceGraphic(
    buttonLongGraphic(atlas, color),
    true,
    false,
    BUTTON_FRAME_W,
    BUTTON_FRAME_H,
    BUTTON_BORDERS,
    KENNEY_BUTTON_W,
    BUTTON_H,
  );
  button.origin.make(0, 0);
  styleKenneyButtonLabel(button, color);
  return button;
}

export function makeKenneyPanelInset(
  atlas: FlxAtlas,
  x: number,
  y: number,
  width = 100,
  height = 100,
): FlxNineSliceSprite {
  const panel = new FlxNineSliceSprite(x, y, width, height);
  panel.loadNineSliceFrame(atlas, 'panel_beige', width, height, PANEL_BORDERS);
  panel.origin.make(0, 0);
  return panel;
}

function makeBarCap(
  atlas: FlxAtlas,
  x: number,
  y: number,
  prefix: string,
  side: 'Left' | 'Right',
): FlxSprite {
  const sprite = new FlxSprite(x, y);
  sprite.loadGraphic(
    frameGraphic(atlas, `${prefix}_horizontal${side}`, BAR_CAP, BAR_BODY),
    false,
    false,
    BAR_CAP,
    BAR_BODY,
  );
  sprite.origin.make(0, 0);
  return sprite;
}

function horizontalMidFrameName(prefix: string): string {
  if (prefix === 'barBlue') return 'barBlue_horizontalBlue';
  return `${prefix}_horizontalMid`;
}

function makeBarMid(
  atlas: FlxAtlas,
  x: number,
  y: number,
  prefix: string,
  width: number,
): FlxSprite {
  const sprite = new FlxSprite(x, y);
  sprite.loadGraphic(
    frameGraphic(atlas, horizontalMidFrameName(prefix), BAR_BODY, BAR_BODY),
    false,
    false,
    BAR_BODY,
    BAR_BODY,
  );
  stretchWidth(sprite, width, BAR_BODY);
  sprite.origin.make(0, 0);
  return sprite;
}

/** Kenney bar frame + textured fill driven by an invisible {@link FlxBar}. */
export class KenneyValueBar {
  readonly sprites: FlxSprite[];
  readonly bar: FlxBar;
  readonly #fillLeft: FlxSprite;
  readonly #fillMid: FlxSprite;
  readonly #fillRight: FlxSprite;
  readonly #outerX: number;
  readonly #outerWidth: number;

  constructor(
    atlas: FlxAtlas,
    x: number,
    y: number,
    width: number,
    parent: object,
    variable: string,
    fillPrefix: 'barGreen' | 'barBlue',
  ) {
    this.#outerX = x;
    this.#outerWidth = width;
    const innerWidth = width - BAR_CAP * 2;
    const innerX = x + BAR_CAP;

    const backLeft = makeBarCap(atlas, x, y, 'barBack', 'Left');
    const backMid = makeBarMid(atlas, x + BAR_CAP, y, 'barBack', innerWidth);
    const backRight = makeBarCap(
      atlas,
      x + width - BAR_CAP,
      y,
      'barBack',
      'Right',
    );

    this.#fillLeft = makeBarCap(atlas, innerX, y, fillPrefix, 'Left');
    this.#fillMid = makeBarMid(atlas, innerX + BAR_CAP, y, fillPrefix, 0);
    this.#fillRight = makeBarCap(
      atlas,
      innerX + innerWidth - BAR_CAP,
      y,
      fillPrefix,
      'Right',
    );

    this.sprites = [
      backLeft,
      backMid,
      backRight,
      this.#fillLeft,
      this.#fillMid,
      this.#fillRight,
    ];

    this.bar = new FlxBar(
      innerX,
      y,
      FlxBar.LEFT_TO_RIGHT,
      innerWidth,
      BAR_BODY,
      parent,
      variable,
      0,
      100,
      false,
    );
    this.bar.origin.make(0, 0);
    this.bar.createFilledBar(0x00000000, 0x00000000);
    this.bar.alpha = 0;
    this.syncFill();
  }

  syncFill(): void {
    const innerWidth = this.#outerWidth - BAR_CAP * 2;
    const fillWidth = innerWidth * this.bar.fraction;
    const innerX = this.#outerX + BAR_CAP;
    const maxMid = innerWidth - BAR_CAP * 2;

    if (fillWidth <= 0) {
      this.#fillLeft.visible = false;
      this.#fillMid.visible = false;
      this.#fillRight.visible = false;
      return;
    }

    this.#fillLeft.visible = true;
    this.#fillLeft.x = innerX;

    if (fillWidth <= BAR_CAP) {
      this.#fillMid.visible = false;
      this.#fillRight.visible = false;
      return;
    }

    if (fillWidth < BAR_CAP * 2) {
      this.#fillMid.visible = false;
      this.#fillRight.visible = false;
      return;
    }

    if (fillWidth >= innerWidth) {
      this.#fillMid.visible = true;
      this.#fillMid.x = innerX + BAR_CAP;
      stretchWidth(this.#fillMid, maxMid, BAR_BODY);
      this.#fillRight.visible = true;
      this.#fillRight.x = innerX + innerWidth - BAR_CAP;
      return;
    }

    const midWidth = fillWidth - BAR_CAP * 2;
    this.#fillRight.visible = true;
    this.#fillRight.x = innerX + fillWidth - BAR_CAP;

    if (midWidth > 0) {
      this.#fillMid.visible = true;
      this.#fillMid.x = innerX + BAR_CAP;
      stretchWidth(this.#fillMid, midWidth, BAR_BODY);
    } else {
      this.#fillMid.visible = false;
    }
  }
}
