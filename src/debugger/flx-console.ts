import { requireNonNegativeInteger } from '../math/flx-number';

/** Context passed to a registered debugger console command. @public */
export interface FlxConsoleCommandContext {
  readonly args: readonly string[];
  readonly command: string;
  readonly input: string;
}

/** A command explicitly exposed to the debugger console. @public */
export interface FlxConsoleCommand {
  readonly aliases?: readonly string[];
  readonly description?: string;
  readonly execute: (
    context: FlxConsoleCommandContext,
  ) => unknown | Promise<unknown>;
  readonly name: string;
  readonly usage?: string;
}

/** Normalized result returned by every debugger console execution. @public */
export interface FlxConsoleResult {
  readonly command: string;
  readonly ok: boolean;
  readonly output: string;
}

/** Configuration for the headless debugger console. @public */
export interface FlxConsoleOptions {
  /** Maximum number of submitted commands retained for navigation. */
  readonly maxHistory?: number;
}

/**
 * Headless, allow-listed debugger command registry with bounded history.
 * It never evaluates arbitrary JavaScript; consumers decide which operations
 * are safe by explicitly registering commands.
 * @public
 */
export class FlxConsole {
  readonly #commands = new Map<string, FlxConsoleCommand>();
  readonly #aliases = new Map<string, string>();
  readonly #history: string[] = [];
  readonly #maxHistory: number;

  constructor(options: FlxConsoleOptions = {}) {
    this.#maxHistory = requireNonNegativeInteger(
      options.maxHistory ?? 100,
      'maxHistory',
    );
  }

  get history(): readonly string[] {
    return [...this.#history];
  }

  get commands(): readonly FlxConsoleCommand[] {
    return [...this.#commands.values()];
  }

  register(command: FlxConsoleCommand): () => void {
    const name = normalizeName(command.name);
    const aliases = (command.aliases ?? []).map(normalizeName);
    const claimedNames = [name, ...aliases];
    if (new Set(claimedNames).size !== claimedNames.length) {
      throw new Error(`Command "${name}" contains a duplicate name or alias.`);
    }
    for (const claimedName of claimedNames) {
      if (this.#commands.has(claimedName) || this.#aliases.has(claimedName)) {
        throw new Error(
          `Console command name "${claimedName}" is already registered.`,
        );
      }
    }

    const registered: FlxConsoleCommand = {
      ...command,
      aliases,
      name,
    };
    this.#commands.set(name, registered);
    for (const alias of aliases) this.#aliases.set(alias, name);

    return () => {
      if (this.#commands.get(name) !== registered) return;
      this.#commands.delete(name);
      for (const alias of aliases) this.#aliases.delete(alias);
    };
  }

  unregister(nameOrAlias: string): boolean {
    const requestedName = normalizeName(nameOrAlias);
    const name = this.#aliases.get(requestedName) ?? requestedName;
    const command = this.#commands.get(name);
    if (command === undefined) return false;
    this.#commands.delete(name);
    for (const alias of command.aliases ?? []) this.#aliases.delete(alias);
    return true;
  }

  complete(input: string): readonly string[] {
    const candidate = input.trimStart();
    if (/\s/.test(candidate)) return [];
    const prefix = candidate.toLowerCase();
    return [...this.#commands.keys(), ...this.#aliases.keys()]
      .filter((name) => name.startsWith(prefix))
      .sort();
  }

  async execute(input: string): Promise<FlxConsoleResult> {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { command: '', ok: false, output: 'Enter a command.' };
    }
    this.#remember(trimmed);

    let tokens: string[];
    try {
      tokens = tokenize(trimmed);
    } catch (cause) {
      return {
        command: '',
        ok: false,
        output: cause instanceof Error ? cause.message : String(cause),
      };
    }

    const requestedName = tokens[0]?.toLowerCase() ?? '';
    const name = this.#aliases.get(requestedName) ?? requestedName;
    const command = this.#commands.get(name);
    if (command === undefined) {
      return {
        command: requestedName,
        ok: false,
        output: `Unknown command: ${requestedName}`,
      };
    }

    try {
      const value = await command.execute({
        args: tokens.slice(1),
        command: name,
        input: trimmed,
      });
      return { command: name, ok: true, output: formatOutput(value) };
    } catch (cause) {
      return {
        command: name,
        ok: false,
        output: cause instanceof Error ? cause.message : String(cause),
      };
    }
  }

  clearHistory(): void {
    this.#history.length = 0;
  }

  #remember(input: string): void {
    if (this.#maxHistory === 0) return;
    if (this.#history.at(-1) !== input) this.#history.push(input);
    if (this.#history.length > this.#maxHistory) {
      this.#history.splice(0, this.#history.length - this.#maxHistory);
    }
  }
}

function normalizeName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!/^[a-z][a-z0-9._-]*$/.test(normalized)) {
    throw new Error(
      `Invalid console command name "${name}". Use letters, numbers, dots, underscores, or hyphens.`,
    );
  }
  return normalized;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let token = '';
  let quote: '"' | "'" | null = null;
  let escaping = false;
  let tokenStarted = false;

  for (const character of input) {
    if (escaping) {
      token += character;
      escaping = false;
      tokenStarted = true;
      continue;
    }
    if (character === '\\') {
      escaping = true;
      tokenStarted = true;
      continue;
    }
    if (quote !== null) {
      if (character === quote) quote = null;
      else token += character;
      tokenStarted = true;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      tokenStarted = true;
      continue;
    }
    if (/\s/.test(character)) {
      if (tokenStarted) {
        tokens.push(token);
        token = '';
        tokenStarted = false;
      }
      continue;
    }
    token += character;
    tokenStarted = true;
  }

  if (escaping) throw new Error('Command cannot end with an escape character.');
  if (quote !== null)
    throw new Error('Command contains an unterminated quote.');
  if (tokenStarted) tokens.push(token);
  return tokens;
}

function formatOutput(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
