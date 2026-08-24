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
    expect(isPhysicsValidationError(new Error('different error'))).toBe(false);
    expect(() => parsePhysicsBody(null)).toThrow(/Expected an object/);
  });

  it('accepts every portable shape and optional body property', () => {
    const result = validatePhysicsBody({
      kind: 'flixel-pixi-physics-body',
      schemaVersion: 1,
      id: 'all-shapes',
      entityId: 'entity',
      type: 'kinematic',
      gravityScale: 0,
      fixedRotation: false,
      continuousCollision: true,
      allowSleep: false,
      filter: { category: 1, mask: 0xffff, group: -1 },
      material: { density: 0, friction: 0.5, restitution: 1 },
      extensions: { nested: [null, true, 'portable', 3] },
      shapes: [
        { kind: 'box', id: 'box', width: 10, height: 20 },
        { kind: 'circle', id: 'circle', radius: 4 },
        { kind: 'capsule', id: 'capsule', radius: 3, length: 12, axis: 'y' },
        {
          kind: 'polygon',
          id: 'polygon',
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 0, y: 10 },
          ],
        },
        {
          kind: 'compound',
          id: 'compound',
          offset: { x: 2, y: 3 },
          angle: 15,
          sensor: true,
          shapes: [{ kind: 'circle', radius: 2 }],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('reports malformed filters, materials, vectors, and nested shapes', () => {
    const result = validatePhysicsWorld({
      kind: 'wrong-world',
      schemaVersion: 9,
      id: ' ',
      gravity: { x: Number.POSITIVE_INFINITY, y: 'down' },
      extensions: [],
      bodies: [
        null,
        {
          kind: 'flixel-pixi-physics-body',
          schemaVersion: 1,
          id: 'bad-body',
          entityId: 'bad-entity',
          type: 'dynamic',
          gravityScale: Number.NaN,
          fixedRotation: 'yes',
          continuousCollision: 1,
          allowSleep: null,
          filter: { category: -1, mask: 0x1_0000, group: 0x8000 },
          material: { density: -1, friction: Number.NaN, restitution: 2 },
          shapes: [
            'not-a-shape',
            { kind: 'box', id: 'duplicate', width: 0, height: -1 },
            { kind: 'circle', id: 'duplicate', radius: 0 },
            { kind: 'capsule', radius: -1, length: 0, axis: 'z' },
            { kind: 'polygon', vertices: [{ x: 0, y: 0 }] },
            { kind: 'compound', shapes: [] },
            {
              kind: 'compound',
              shapes: [{ kind: 'compound', shapes: [] }],
            },
            { kind: 'unknown', offset: { x: 'left', y: null } },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.issues.map(({ path }) => path);
      expect(paths).toEqual(
        expect.arrayContaining([
          '$.kind',
          '$.gravity.x',
          '$.bodies[0]',
          '$.bodies[1].filter.category',
          '$.bodies[1].material.restitution',
          '$.bodies[1].shapes[2].id',
          '$.bodies[1].shapes[5].shapes',
          '$.bodies[1].shapes[6].shapes[0].kind',
        ]),
      );
    }

    expect(
      validatePhysicsWorld({
        kind: 'flixel-pixi-physics-world',
        schemaVersion: 1,
        id: 'missing-bodies',
        gravity: { x: 0, y: 0 },
        bodies: {},
      }).success,
    ).toBe(false);
  });

  it('accepts every portable shape and optional body property', () => {
    const result = validatePhysicsBody({
      allowSleep: true,
      continuousCollision: true,
      entityId: 'shape-showcase',
      extensions: { tags: ['fixture', 1, true, null] },
      filter: { category: 1, group: -1, mask: 0xffff },
      fixedRotation: false,
      gravityScale: 0.5,
      id: 'shape-showcase-body',
      kind: 'flixel-pixi-physics-body',
      material: { density: 1, friction: 0.4, restitution: 0.25 },
      schemaVersion: 1,
      shapes: [
        { angle: 0.1, height: 10, id: 'box', kind: 'box', width: 20 },
        { kind: 'circle', offset: { x: 1, y: 2 }, radius: 5, sensor: true },
        { axis: 'x', kind: 'capsule', length: 12, radius: 3 },
        {
          kind: 'polygon',
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
        },
        {
          kind: 'compound',
          shapes: [
            { height: 2, kind: 'box', width: 4 },
            { kind: 'circle', radius: 1 },
          ],
        },
      ],
      type: 'dynamic',
    });

    expect(result.success).toBe(true);
  });

  it('reports malformed shape options, filters, and materials precisely', () => {
    const result = validatePhysicsBody({
      allowSleep: 'yes',
      continuousCollision: 1,
      entityId: 'invalid-options',
      filter: { category: -1, group: 0x8000, mask: 0x1_0000 },
      fixedRotation: 'no',
      gravityScale: Number.NaN,
      id: 'invalid-options-body',
      kind: 'flixel-pixi-physics-body',
      material: { density: -1, friction: Number.NaN, restitution: 2 },
      schemaVersion: 1,
      shapes: [
        null,
        { axis: 'z', kind: 'capsule', length: 0, radius: -1 },
        { kind: 'polygon', vertices: [{ x: 0, y: 0 }] },
        { kind: 'compound', shapes: [] },
        {
          id: 'duplicate-fixture',
          kind: 'compound',
          shapes: [{ kind: 'compound', shapes: [] }],
        },
        { id: 'duplicate-fixture', kind: 'triangle' },
      ],
      type: 'static',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          '$.allowSleep',
          '$.continuousCollision',
          '$.filter.category',
          '$.filter.group',
          '$.filter.mask',
          '$.fixedRotation',
          '$.gravityScale',
          '$.material.density',
          '$.material.friction',
          '$.material.restitution',
          '$.shapes[0]',
          '$.shapes[1].axis',
          '$.shapes[2].vertices',
          '$.shapes[3].shapes',
          '$.shapes[4].shapes[0].kind',
          '$.shapes[5].id',
          '$.shapes[5].kind',
        ]),
      );
    }

    expect(validatePhysicsBody(null).success).toBe(false);
    expect(
      validatePhysicsWorld({
        bodies: 'not-an-array',
        gravity: null,
        id: '',
        kind: 'flixel-pixi-physics-world',
        schemaVersion: 1,
      }).success,
    ).toBe(false);
    expect(isPhysicsValidationError(new Error('plain error'))).toBe(false);
  });
});

function firstBody(document: PhysicsWorldDocumentV1): PhysicsBodyDocumentV1 {
  const body = document.bodies[0];
  if (body === undefined) throw new Error('Fixture must contain a body.');
  return body;
}
