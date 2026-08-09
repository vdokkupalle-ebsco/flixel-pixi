import { FlxState, FlxText } from '../../../src';
import {
  KenneyValueBar,
  KENNEY_BUTTON_W,
  makeKenneyButton,
  makeKenneyPanelInset,
  requireKenneyUiAtlas,
} from './kenney-ui';

export interface UiDemoSnapshot {
  damageDisabled: boolean;
  healDisabled: boolean;
  health: number;
  mana: number;
  percent: number;
}

const PANEL_W = 380;
const PANEL_H = 228;
const PANEL_LEFT = 130;
const PANEL_TOP = 48;
const PANEL_PAD = 16;
const BUTTON_GAP = 8;
const BAR_WIDTH = 300;
const BAR_X = PANEL_LEFT + (PANEL_W - BAR_WIDTH) * 0.5;
const DAMAGE_BUTTON_X = PANEL_LEFT + PANEL_PAD;
const HEAL_BUTTON_X = DAMAGE_BUTTON_X + KENNEY_BUTTON_W + BUTTON_GAP;

export class UiDemoState extends FlxState {
  health = 65;
  mana = 40;

  readonly #healthText = new FlxText(0, 0, BAR_WIDTH, '', true, 'bitmap');
  readonly #manaText = new FlxText(0, 0, BAR_WIDTH, '', true, 'bitmap');
  readonly #healthBar = new KenneyValueBar(
    requireKenneyUiAtlas(),
    BAR_X,
    108,
    BAR_WIDTH,
    this,
    'health',
    'barGreen',
  );
  readonly #manaBar = new KenneyValueBar(
    requireKenneyUiAtlas(),
    BAR_X,
    142,
    BAR_WIDTH,
    this,
    'mana',
    'barBlue',
  );
  readonly #damageButton = makeKenneyButton(
    requireKenneyUiAtlas(),
    DAMAGE_BUTTON_X,
    182,
    'Damage',
    () => {
      this.health = Math.max(0, this.health - 15);
    },
    'beige',
  );
  readonly #healButton = makeKenneyButton(
    requireKenneyUiAtlas(),
    HEAL_BUTTON_X,
    182,
    'Heal',
    () => {
      this.health = Math.min(100, this.health + 15);
    },
    'blue',
  );

  override create(): void {
    super.create();
    const atlas = requireKenneyUiAtlas();
    const panel = makeKenneyPanelInset(
      atlas,
      PANEL_LEFT,
      PANEL_TOP,
      PANEL_W,
      PANEL_H,
    );
    panel.scrollFactor.make(0, 0);

    const title = new FlxText(
      PANEL_LEFT + 16,
      PANEL_TOP + 12,
      PANEL_W - 32,
      'RPG UI PACK',
      true,
      'bitmap',
    );
    title.setFormat('Arial', 22, 0x3d2f24, 'center');
    title.scrollFactor.make(0, 0);

    this.#healthText.setFormat('Arial', 14, 0x4a3b30, 'left');
    this.#healthText.x = BAR_X;
    this.#healthText.y = 88;
    this.#healthText.scrollFactor.make(0, 0);

    this.#manaText.setFormat('Arial', 14, 0x4a3b30, 'left');
    this.#manaText.x = BAR_X;
    this.#manaText.y = 126;
    this.#manaText.scrollFactor.make(0, 0);

    for (const sprite of [
      ...this.#healthBar.sprites,
      ...this.#manaBar.sprites,
    ]) {
      sprite.scrollFactor.make(0, 0);
    }
    this.#healthBar.bar.scrollFactor.make(0, 0);
    this.#manaBar.bar.scrollFactor.make(0, 0);
    this.#damageButton.scrollFactor.make(0, 0);
    this.#healButton.scrollFactor.make(0, 0);

    this.#damageButton.accessibleLabel = 'Damage health by 15';
    this.#damageButton.tabIndex = 0;
    this.#healButton.accessibleLabel = 'Heal health by 15';
    this.#healButton.tabIndex = 0;

    this.add(panel);
    this.add(title);
    this.add(this.#healthText);
    this.add(this.#manaText);
    for (const sprite of this.#healthBar.sprites) this.add(sprite);
    for (const sprite of this.#manaBar.sprites) this.add(sprite);
    this.add(this.#damageButton);
    this.add(this.#healButton);
    this.add(this.#healthBar.bar);
    this.add(this.#manaBar.bar);
    this.#syncUi();
  }

  override update(): void {
    super.update();
    this.#syncUi();
  }

  snapshot(): UiDemoSnapshot {
    return {
      damageDisabled: !this.#damageButton.enabled,
      healDisabled: !this.#healButton.enabled,
      health: this.health,
      mana: this.mana,
      percent: this.#healthBar.bar.percent,
    };
  }

  #syncUi(): void {
    this.#damageButton.enabled = this.health > 0;
    this.#healButton.enabled = this.health < 100;
    this.#healthText.text = `Health ${this.health}`;
    this.#manaText.text = `Mana ${this.mana}`;
    this.#healthBar.syncFill();
    this.#manaBar.syncFill();
  }
}
