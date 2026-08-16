# Web Audio & Sound Groups

Flixel-Pixi provides a Web Audio API architecture via `FlxAudioManager`, `FlxSound`, and `FlxSoundGroup`.

---

## 1. Playing Sound Effects & Music

```ts
// Play a one-shot sound effect
this.context.audio.play('assets/jump.ogg', 0.8);

// Stream looping background music
this.context.audio.playMusic('assets/bgm.ogg', 0.6, true);
```

---

## 2. Sound Groups (Volume Channels)

Organize audio into SFX and Music channels for user volume sliders:

```ts
import { FlxSoundGroup } from 'flixel-pixi';

const sfxGroup = new FlxSoundGroup();
const musicGroup = new FlxSoundGroup();

sfxGroup.volume = 0.7;
musicGroup.volume = 0.5;

// Attach sound to group
const laser = this.context.audio.load('assets/laser.ogg');
laser.group = sfxGroup;
laser.play();
```

---

## 3. Spatial Sound & Proximity Panning

Attach a sound to a world object (like an engine or waterfall). The volume and stereo pan adjust as the player moves relative to the emitter:

```ts
const waterfallSound = this.context.audio.load(
  'assets/waterfall.ogg',
  1.0,
  true,
);
waterfallSound.proximity(
  waterfallSprite.x,
  waterfallSprite.y,
  this.player,
  400,
);
waterfallSound.play();
```
