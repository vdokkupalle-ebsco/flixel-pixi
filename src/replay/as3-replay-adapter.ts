import { FlxReplay } from './flx-replay';

/** Converts legacy AS3 Flixel text replay data into a modern FlxReplay instance. @public */
export function convertAS3ReplayToFlxReplay(as3Text: string): FlxReplay {
  const replay = new FlxReplay();
  replay.load(as3Text);
  return replay;
}

/** Converts a modern FlxReplay instance into legacy AS3 Flixel plain-text format. @public */
export function convertFlxReplayToAS3Text(replay: FlxReplay): string {
  const lines: string[] = [`seed:${replay.seed}`];

  for (const f of replay.frames) {
    if (!f) continue;
    const m = f.mouse;
    const mouseStr = m ? ` ${m.x} ${m.y} ${m.button} ${m.wheel}` : ' 0 0 0 0';
    // Format: frameIndex [keys] [mouseX] [mouseY] [button] [wheel]
    lines.push(`${f.frame} []${mouseStr}`);
  }

  return lines.join('\n');
}
