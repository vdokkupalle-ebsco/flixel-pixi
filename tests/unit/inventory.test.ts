import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

interface As3ClassEntry {
  readonly publicMembers: readonly As3MemberEntry[];
  readonly qualifiedName: string;
}

interface As3MemberEntry {
  readonly name: string;
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
      const heading = `### \`${entry.qualifiedName}\``;
      const sectionStart = ledger.indexOf(heading);
      expect(
        sectionStart,
        `missing ledger section for ${entry.qualifiedName}`,
      ).toBeGreaterThanOrEqual(0);

      const nextSection = ledger.indexOf(
        '\n### `',
        sectionStart + heading.length,
      );
      const section = ledger.slice(
        sectionStart,
        nextSection === -1 ? undefined : nextSection,
      );
      const apiLine = section.match(/^- Public API \((\d+)\): (.+)$/m);
      expect(
        apiLine,
        `missing Public API row for ${entry.qualifiedName}`,
      ).not.toBeNull();

      const declaredCount = Number(apiLine?.[1]);
      const listedMembers = (apiLine?.[2] ?? '').split(', ').map((member) =>
        member
          .replaceAll('`', '')
          .replace(/^static /, '')
          .replace(/ \(get(?:\/set)?\)$/, ''),
      );
      const manifestMembers = entry.publicMembers.map((member) => member.name);

      expect(declaredCount, `${entry.qualifiedName} declared API count`).toBe(
        entry.publicMembers.length,
      );
      expect(listedMembers, `${entry.qualifiedName} member ledger`).toEqual(
        manifestMembers,
      );
      expect(section, `${entry.qualifiedName} final classification`).toMatch(
        /- Phase [^\n]+ status: (?:Exact|Adapted|Emulated|Deprecated|Unsupported)\b/,
      );
    }
  });
});
