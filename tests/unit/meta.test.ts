import { describe, expect, it } from 'vitest';

import { libraryName, upstreamBaseline } from '../../src';

describe('source metadata', () => {
  it('pins the original Flixel master baseline', () => {
    expect(libraryName).toBe('flixel-pixi');
    expect(upstreamBaseline).toEqual({
      classCount: 43,
      commit: '8989e5044be072c4abbbaa1317c9854786f6447f',
      publicMemberCount: 766,
      sourceLineCount: 14_928,
      sourceUrl: 'https://github.com/AdamAtomic/flixel/tree/master/org/flixel',
    });
    expect(Object.isFrozen(upstreamBaseline)).toBe(true);
  });
});
