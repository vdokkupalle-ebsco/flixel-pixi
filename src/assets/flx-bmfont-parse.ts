/** Parsed AngelCode / BMFont XML payload for Pixi `BitmapFont`. @public */
export interface FlxBmFontData {
  baseLineOffset: number;
  chars: Record<
    string,
    {
      id: number;
      kerning: Record<string, number>;
      letter: string;
      page: number;
      width: number;
      height: number;
      x: number;
      xAdvance: number;
      xOffset: number;
      y: number;
      yOffset: number;
    }
  >;
  distanceField?: {
    range: number;
    type: 'none' | 'sdf' | 'msdf';
  };
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  pages: { id: number; file: string }[];
}

/**
 * Parse AngelCode BMFont XML into the structure expected by Pixi `BitmapFont`.
 * @public
 */
export function parseBmFontXml(xmlText: string): FlxBmFontData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError !== null) {
    throw new Error(`BMFont XML parse error: ${parseError.textContent ?? 'unknown'}`);
  }

  const info = doc.querySelector('info');
  const common = doc.querySelector('common');
  if (info === null || common === null) {
    throw new Error('BMFont XML must contain <info> and <common> elements.');
  }

  const face = info.getAttribute('face');
  if (face === null || face.length === 0) {
    throw new Error('BMFont XML <info> must include a face attribute.');
  }

  const fontSize = Number(info.getAttribute('size') ?? 0);
  const lineHeight = Number(common.getAttribute('lineHeight') ?? 0);
  if (fontSize <= 0 || lineHeight <= 0) {
    throw new RangeError('BMFont XML size and lineHeight must be positive.');
  }

  const distanceFieldEl = doc.querySelector('distanceField');
  let distanceField: FlxBmFontData['distanceField'];
  if (distanceFieldEl !== null) {
    const fieldType = distanceFieldEl.getAttribute('fieldType') ?? 'none';
    distanceField = {
      type:
        fieldType === 'sdf' || fieldType === 'msdf' ? fieldType : 'none',
      range: Number(distanceFieldEl.getAttribute('distanceRange') ?? 0),
    };
  }

  const pages: FlxBmFontData['pages'] = [];
  for (const pageEl of doc.querySelectorAll('page')) {
    const file = pageEl.getAttribute('file');
    if (file === null || file.length === 0) {
      throw new Error('BMFont XML <page> must include a file attribute.');
    }
    pages.push({
      id: Number(pageEl.getAttribute('id') ?? 0),
      file,
    });
  }
  if (pages.length === 0) {
    throw new Error('BMFont XML must contain at least one <page> element.');
  }

  const chars: FlxBmFontData['chars'] = {};
  const idToLetter: Record<number, string> = {};
  for (const charEl of doc.querySelectorAll('char')) {
    const id = Number(charEl.getAttribute('id') ?? -1);
    if (!Number.isInteger(id) || id < 0) {
      throw new RangeError('BMFont XML <char> id must be a non-negative integer.');
    }
    let letter =
      charEl.getAttribute('letter') ??
      charEl.getAttribute('char') ??
      String.fromCodePoint(id);
    if (letter === 'space') letter = ' ';
    idToLetter[id] = letter;
    chars[letter] = {
      id,
      kerning: {},
      letter,
      page: Number(charEl.getAttribute('page') ?? 0),
      width: Number(charEl.getAttribute('width') ?? 0),
      height: Number(charEl.getAttribute('height') ?? 0),
      x: Number(charEl.getAttribute('x') ?? 0),
      xAdvance: Number(charEl.getAttribute('xadvance') ?? 0),
      xOffset: Number(charEl.getAttribute('xoffset') ?? 0),
      y: Number(charEl.getAttribute('y') ?? 0),
      yOffset: Number(charEl.getAttribute('yoffset') ?? 0),
    };
  }
  if (Object.keys(chars).length === 0) {
    throw new Error('BMFont XML must contain at least one <char> element.');
  }

  for (const kerningEl of doc.querySelectorAll('kerning')) {
    const first = Number(kerningEl.getAttribute('first') ?? -1);
    const second = Number(kerningEl.getAttribute('second') ?? -1);
    const amount = Number(kerningEl.getAttribute('amount') ?? 0);
    const secondLetter = idToLetter[second];
    const firstLetter = idToLetter[first];
    const secondChar = secondLetter !== undefined ? chars[secondLetter] : undefined;
    if (secondChar !== undefined && firstLetter !== undefined) {
      secondChar.kerning[firstLetter] = amount;
    }
  }

  const base = Number(common.getAttribute('base') ?? lineHeight);
  const result: FlxBmFontData = {
    baseLineOffset: lineHeight - base,
    chars,
    fontFamily: face,
    fontSize,
    lineHeight,
    pages,
  };
  if (distanceField !== undefined) {
    result.distanceField = distanceField;
  }
  return result;
}
