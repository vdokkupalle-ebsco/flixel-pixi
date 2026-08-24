import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  isPhysicsValidationError,
  parsePhysicsBody,
  parsePhysicsWorld,
  serializePhysicsBody,
  serializePhysicsWorld,
  validatePhysicsBody,
  validatePhysicsWorld,
  type PhysicsWorldDocumentV1,
  type PhysicsBodyDocumentV1,
} from '../src/index.js';

async function fixture(): Promise<PhysicsWorldDocumentV1> {
  return JSON.parse(
    await readFile(
      new URL('fixtures/physics-world-v1.json', import.meta.url),
      'utf8',
    ),
  ) as PhysicsWorldDocumentV1;
}

describe('physics schemas', () => {
  it('validates and deterministically round-trips a portable world fixture', async () => {
    const document = await fixture();
    const serialized = serializePhysicsWorld(document);

    expect(parsePhysicsWorld(JSON.parse(serialized) as unknown)).toEqual(
      document,
    );
    expect(serializePhysicsWorld(document)).toBe(serialized);
    expect(serialized.endsWith('\n')).toBe(true);
    const body = firstBody(document);
    expect(parsePhysicsBody(body)).toEqual(body);
    expect(serializePhysicsBody(body)).toContain('player-body');
  });

  it('reports duplicate stable ids and actionable nested shape paths', async () => {
    const document = await fixture();
    const result = validatePhysicsWorld({
      ...document,
      bodies: [
        document.bodies[0],
        {
          ...document.bodies[1],
          id: 'player-body',
          entityId: 'player',
          shapes: [{ kind: 'box', width: 0, height: 10 }],
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.bodies[1].id',
          '$.bodies[1].entityId',
          '$.bodies[1].shapes[0].width',
        ]),
      );
    }
  });

  it('rejects unsupported versions, malformed bodies, and non-JSON extensions', () => {
    const body = validatePhysicsBody({
      entityId: '',
      extensions: { invalid: Number.NaN },
      id: '',
      kind: 'wrong',
      schemaVersion: 2,
      shapes: [],
      type: 'arcade',
    });
    expect(body.success).toBe(false);
    if (!body.success) {
      expect(body.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.kind',
          '$.schemaVersion',
          '$.id',
          '$.entityId',
          '$.type',
          '$.extensions',
          '$.shapes',
        ]),
      );
    }
    expect(validatePhysicsWorld(null).success).toBe(false);
    expect(() => parsePhysicsWorld({ schemaVersion: 2 })).toThrow();
    try {
      parsePhysicsWorld({ schemaVersion: 2 });
    } catch (error) {
      expect(isPhysicsValidationError(error)).toBe(true);
    }
  });
});

function firstBody(document: PhysicsWorldDocumentV1): PhysicsBodyDocumentV1 {
  const body = document.bodies[0];
  if (body === undefined) throw new Error('Fixture must contain a body.');
  return body;
}
