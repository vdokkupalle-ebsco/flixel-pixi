import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

interface As3ClassEntry {
  readonly publicMembers: readonly unknown[];
  readonly qualifiedName: string;
}

interface As3ApiManifest {
  readonly classCount: number;
  readonly classes: readonly As3ClassEntry[];
  readonly commit: string;
  readonly sourceLineCount: number;
}

describe('upstream compatibility inventory', () => {
  it('accounts for every pinned class and public member in the ledger', async () => {
    const manifest = JSON.parse(
      await readFile(
        new URL('../../upstream/as3-api-manifest.json', import.meta.url),
        'utf8',
      ),
    ) as As3ApiManifest;
    const ledger = await readFile(
      new URL('../../docs/compatibility.md', import.meta.url),
      'utf8',
    );

    expect(manifest.commit).toBe('8989e5044be072c4abbbaa1317c9854786f6447f');
    expect(manifest.classCount).toBe(43);
    expect(manifest.classes).toHaveLength(43);
    expect(manifest.sourceLineCount).toBe(14_928);
    expect(
      manifest.classes.reduce(
        (total, entry) => total + entry.publicMembers.length,
        0,
      ),
    ).toBe(766);

    for (const entry of manifest.classes) {
      expect(ledger).toContain(`### \`${entry.qualifiedName}\``);
    }
  });
});
