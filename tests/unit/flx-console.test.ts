import { describe, expect, it, vi } from 'vitest';

import { FlxConsole } from '../../src/debugger/flx-console';

describe('FlxConsole', () => {
  it('executes explicitly registered commands with parsed arguments', async () => {
    const console = new FlxConsole();
    const execute = vi.fn(({ args }) => args.join('|'));
    console.register({ aliases: ['say'], execute, name: 'echo' });

    await expect(console.execute('say "hello world" plain')).resolves.toEqual({
      command: 'echo',
      ok: true,
      output: 'hello world|plain',
    });
    expect(execute).toHaveBeenCalledWith({
      args: ['hello world', 'plain'],
      command: 'echo',
      input: 'say "hello world" plain',
    });
  });

  it('never evaluates unknown input and normalizes command failures', async () => {
    const console = new FlxConsole();
    await expect(console.execute('window.alert(1)')).resolves.toMatchObject({
      ok: false,
      output: 'Unknown command: window.alert(1)',
    });
    console.register({
      execute: () => {
        throw new Error('Mutation rejected');
      },
      name: 'set-health',
    });
    await expect(console.execute('set-health 10')).resolves.toEqual({
      command: 'set-health',
      ok: false,
      output: 'Mutation rejected',
    });
  });

  it('retains bounded, consecutively deduplicated history', async () => {
    const console = new FlxConsole({ maxHistory: 2 });
    await console.execute('missing one');
    await console.execute('missing one');
    await console.execute('missing two');
    await console.execute('missing three');
    expect(console.history).toEqual(['missing two', 'missing three']);
    console.clearHistory();
    expect(console.history).toEqual([]);
  });

  it('completes registered command names and aliases', () => {
    const console = new FlxConsole();
    console.register({
      aliases: ['tele'],
      execute: () => 'done',
      name: 'teleport',
    });
    console.register({ execute: () => 'done', name: 'time-scale' });
    expect(console.complete('te')).toEqual(['tele', 'teleport']);
    expect(console.complete('tele ')).toEqual([]);
  });

  it('rejects invalid or conflicting command names', () => {
    const console = new FlxConsole();
    console.register({
      aliases: ['r'],
      execute: () => 'done',
      name: 'reset',
    });
    expect(() =>
      console.register({ execute: () => 'done', name: 'R' }),
    ).toThrow('already registered');
    expect(() =>
      console.register({ execute: () => 'done', name: 'bad name' }),
    ).toThrow('Invalid console command name');
  });

  it('reports malformed quoted input without invoking a command', async () => {
    const console = new FlxConsole();
    const execute = vi.fn();
    console.register({ execute, name: 'echo' });
    await expect(console.execute('echo "unfinished')).resolves.toMatchObject({
      ok: false,
      output: 'Command contains an unterminated quote.',
    });
    expect(execute).not.toHaveBeenCalled();
  });
});
