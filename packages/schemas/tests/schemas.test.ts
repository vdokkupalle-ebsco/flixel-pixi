import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  LATEST_PROJECT_SCHEMA_VERSION,
  isProjectValidationError,
  migrateProjectDocument,
  parseProjectDocument,
  ProjectValidationError,
  serializeProjectDocument,
  validateProjectDocument,
  type ProjectDocumentV1,
} from '../src/index.js';

async function fixture(name: string): Promise<unknown> {
  return JSON.parse(
    await readFile(new URL(`fixtures/${name}`, import.meta.url), 'utf8'),
  );
}

describe('project schema', () => {
  it('validates a complete version 1 fixture', async () => {
    const result = validateProjectDocument(await fixture('project-v1.json'));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.id).toBe('runner');
      expect(result.data.assets[0]?.kind).toBe('image');
      expect(result.data.scenes[0]?.entities[0]?.position).toEqual({
        x: 32,
        y: 96,
      });
    }
  });

  it('reports actionable paths and duplicate identifiers', async () => {
    const result = validateProjectDocument(
      await fixture('project-invalid.json'),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'duplicate_id',
            path: '$.assets[1].id',
          }),
          expect.objectContaining({
            code: 'invalid_value',
            path: '$.assets[1].kind',
          }),
          expect.objectContaining({
            code: 'invalid_value',
            path: '$.assets[1].src',
          }),
        ]),
      );
    }
  });

  it('throws a structured error when parsing invalid input', () => {
    expect(() => parseProjectDocument({ schemaVersion: 1 })).toThrow(
      ProjectValidationError,
    );
    try {
      parseProjectDocument({ schemaVersion: 1 });
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectValidationError);
      expect((error as ProjectValidationError).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '$.project' }),
          expect.objectContaining({ path: '$.assets' }),
          expect.objectContaining({ path: '$.scenes' }),
        ]),
      );
    }
  });

  it('rejects non-JSON extension data and cycles', async () => {
    const document = (await fixture('project-v1.json')) as Record<
      string,
      unknown
    >;
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    document.extensions = {
      cyclic,
      missing: undefined,
    };

    const result = validateProjectDocument(document);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '$.extensions.cyclic.self' }),
          expect.objectContaining({ path: '$.extensions.missing' }),
        ]),
      );
    }
  });

  it('serializes deterministically with sorted keys', async () => {
    const document = parseProjectDocument(await fixture('project-v1.json'));
    const reordered = {
      scenes: document.scenes,
      project: { name: document.project.name, id: document.project.id },
      extensions: document.extensions,
      assets: document.assets,
      schemaVersion: 1,
    } as ProjectDocumentV1;

    const first = serializeProjectDocument(document);
    const second = serializeProjectDocument(reordered);

    expect(first).toBe(second);
    expect(first.endsWith('\n')).toBe(true);
    expect(first.indexOf('"assets"')).toBeLessThan(first.indexOf('"project"'));
    expect(serializeProjectDocument(document, { space: 99 })).toContain(
      '\n          "assets"',
    );
  });

  it('migrates a version 0 fixture to the latest schema', async () => {
    const migrated = migrateProjectDocument(await fixture('project-v0.json'));

    expect(LATEST_PROJECT_SCHEMA_VERSION).toBe(1);
    expect(migrated).toEqual({
      assets: [],
      project: { id: 'runner', name: 'Runner' },
      scenes: [],
      schemaVersion: 1,
    });
  });

  it('rejects missing and future schema versions', () => {
    for (const value of [{}, { schemaVersion: 2 }]) {
      const result = validateProjectDocument(value);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues[0]?.path).toBe('$.schemaVersion');
      }
    }
  });

  it('accepts optional entity transforms and nested JSON values', () => {
    const result = validateProjectDocument({
      assets: [],
      extensions: {
        values: [null, true, 'text', 3, { nested: false }],
      },
      project: { id: 'complete', name: 'Complete' },
      scenes: [
        {
          entities: [
            {
              id: 'hero',
              name: 'Hero',
              position: { x: 1, y: 2 },
              rotation: 0.5,
              scale: { x: 2, y: 2 },
              type: 'player',
            },
          ],
          id: 'scene',
          name: 'Scene',
        },
      ],
      schemaVersion: 1,
    });

    expect(result.success).toBe(true);
  });

  it('collects structural, transform, and duplicate entity issues', () => {
    const result = validateProjectDocument({
      assets: [
        null,
        {
          id: 'asset',
          kind: 'image',
          metadata: [],
          src: 'asset.png',
        },
      ],
      extensions: [],
      project: { id: '', name: 4 },
      scenes: [
        null,
        { entities: 'missing', id: 'broken', name: '' },
        { entities: [], id: 'duplicate', name: 'First' },
        {
          entities: [
            null,
            {
              id: 'entity',
              name: '',
              position: null,
              properties: [],
              rotation: Number.POSITIVE_INFINITY,
              scale: { x: 'wide', y: Number.NaN },
              type: '',
            },
            {
              id: 'entity',
              position: { x: 0, y: 0 },
              type: 'duplicate',
            },
          ],
          id: 'duplicate',
          name: 'Second',
        },
      ],
      schemaVersion: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.issues.map(({ path }) => path);
      expect(paths).toEqual(
        expect.arrayContaining([
          '$.assets[0]',
          '$.assets[1].metadata',
          '$.extensions',
          '$.project.id',
          '$.project.name',
          '$.scenes[1].entities',
          '$.scenes[3].entities[1].position',
          '$.scenes[3].entities[1].rotation',
          '$.scenes[3].entities[1].scale.x',
          '$.scenes[3].entities[2].id',
          '$.scenes[3].id',
        ]),
      );
    }
  });

  it('handles non-object input and identifies validation errors', () => {
    const result = validateProjectDocument(null);
    expect(result).toEqual({
      issues: [
        {
          code: 'invalid_type',
          message: 'Expected an object.',
          path: '$',
        },
      ],
      success: false,
    });

    let validationError: unknown;
    try {
      migrateProjectDocument('not a project');
    } catch (error) {
      validationError = error;
    }
    expect(isProjectValidationError(validationError)).toBe(true);
    expect(isProjectValidationError(new Error('different error'))).toBe(false);
  });

  it('preserves version 0 content while supplying missing collections', () => {
    const migrated = migrateProjectDocument({
      extensions: { tool: { open: true } },
      id: 'legacy',
      name: 'Legacy',
      schemaVersion: 0,
    });

    expect(migrated.extensions).toEqual({ tool: { open: true } });
    expect(migrateProjectDocument(migrated)).toBe(migrated);
  });
});
