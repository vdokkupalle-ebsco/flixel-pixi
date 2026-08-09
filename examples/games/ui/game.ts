import { FlxBar, FlxButton, FlxState, FlxText } from '../../../src';

export interface UiDemoSnapshot {
  damageDisabled: boolean;
  healDisabled: boolean;
  health: number;
  percent: number;
}

export class UiDemoState extends FlxState {
  health = 65;

  readonly #healthText = new FlxText(160, 82, 320, '', true, 'bitmap');
  readonly #healthBar = new FlxBar(
    170,
    128,
    FlxBar.LEFT_TO_RIGHT,
    300,
    28,
    this,
    'health',
    0,
    100,
    true,
  ).createFilledBar(0x172033ff, 0x22c55eff, true, 0xe2e8f0ff);
  readonly #damageButton = new FlxButton(220, 200, 'Damage', () => {
    this.health = Math.max(0, this.health - 15);
  });
  readonly #healButton = new FlxButton(340, 200, 'Heal', () => {
    this.health = Math.min(100, this.health + 15);
  });

  override create(): void {
    super.create();
    const title = new FlxText(80, 28, 480, 'UI AUTHORING', true, 'bitmap');
    title.setFormat('Arial', 28, 0xf8fafc, 'center');
    title.scrollFactor.make(0, 0);
    this.#healthText.setFormat('Arial', 18, 0xcbd5e1, 'center');
    this.#healthText.scrollFactor.make(0, 0);
    this.#healthBar.scrollFactor.make(0, 0);
    this.#damageButton.scrollFactor.make(0, 0);
    this.#damageButton.accessibleLabel = 'Damage health by 15';
    this.#damageButton.tabIndex = 0;
    this.#healButton.scrollFactor.make(0, 0);
    this.#healButton.accessibleLabel = 'Heal health by 15';
    this.#healButton.tabIndex = 0;

    this.add(title);
    this.add(this.#healthText);
    this.add(this.#damageButton);
    this.add(this.#healButton);
    this.add(this.#healthBar);
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
      percent: this.#healthBar.percent,
    };
  }

  #syncUi(): void {
    this.#damageButton.enabled = this.health > 0;
    this.#healButton.enabled = this.health < 100;
    this.#healthText.text = `HEALTH ${this.health} / 100`;
  }
}
