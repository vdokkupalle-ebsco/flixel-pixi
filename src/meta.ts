/** Metadata for the ActionScript 3 source baseline used by this port. @public */
export interface UpstreamBaseline {
  /** Number of ActionScript classes under `org/flixel`. */
  readonly classCount: number;
  /** Full Git commit used as the compatibility reference. */
  readonly commit: string;
  /** Number of public constructors, fields, accessors, constants, and methods. */
  readonly publicMemberCount: number;
  /** Number of ActionScript source lines under `org/flixel`. */
  readonly sourceLineCount: number;
  /** Canonical source directory URL. */
  readonly sourceUrl: string;
}

/** The immutable upstream source baseline for compatibility work. @public */
export const upstreamBaseline: Readonly<UpstreamBaseline> = Object.freeze({
  classCount: 43,
  commit: '8989e5044be072c4abbbaa1317c9854786f6447f',
  publicMemberCount: 766,
  sourceLineCount: 14_928,
  sourceUrl: 'https://github.com/AdamAtomic/flixel/tree/master/org/flixel',
});

/** Current library name. @public */
export const libraryName = 'flixel-pixi';
