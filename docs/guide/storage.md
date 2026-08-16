# Save Data & Replays

Flixel-Pixi supports local persistence via `FlxSave` (with LocalStorage and IndexedDB backends) and deterministic game recording/playback via `FlxReplay`.

---

## 1. Saving Game Data with `FlxSave`

```ts
import { FlxSave } from 'flixel-pixi';

const save = new FlxSave();
save.bind('my_adventure_save');

// Save high score and unlocked levels
save.data.highScore = 45000;
save.data.unlockedLevel = 4;
save.flush(); // Commit to LocalStorage or IndexedDB

// Load saved data on next launch
if (save.data.highScore !== undefined) {
  console.log(`Welcome back! High score: ${save.data.highScore}`);
}
```

---

## 2. Deterministic Replay Recording (`FlxReplay`)

Because Flixel-Pixi runs on a deterministic fixed step, recording player inputs reproduces gameplay:

```ts
import { FlxReplay } from 'flixel-pixi';

// Record inputs during gameplay
const replay = new FlxReplay();
replay.create(1337); // Seed with current RNG seed

// Later: Playback recorded run
replay.load(replayString);
replay.playNextFrameRecord();
```
