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

function numericAttribute(
  element: Element,
  name: string,
  fallback: number,
): number {
  const value = Number(element.getAttribute(name) ?? fallback);
  if (!Number.isFinite(value)) {
    throw new RangeError(`BMFont XML ${name} must be finite.`);
  }
  return value;
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
    throw new Error(
      `BMFont XML parse error: ${parseError.textContent ?? 'unknown'}`,
    );
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

  const fontSize = numericAttribute(info, 'size', 0);
  const lineHeight = numericAttribute(common, 'lineHeight', 0);
  if (fontSize <= 0 || lineHeight <= 0) {
    throw new RangeError('BMFont XML size and lineHeight must be positive.');
  }

  const distanceFieldEl = doc.querySelector('distanceField');
  let distanceField: FlxBmFontData['distanceField'];
  if (distanceFieldEl !== null) {
    const fieldType = distanceFieldEl.getAttribute('fieldType') ?? 'none';
    distanceField = {
      type: fieldType === 'sdf' || fieldType === 'msdf' ? fieldType : 'none',
      range: numericAttribute(distanceFieldEl, 'distanceRange', 0),
    };
    if (distanceField.range < 0) {
      throw new RangeError('BMFont XML distanceRange must be non-negative.');
    }
  }

  const pages: FlxBmFontData['pages'] = [];
  for (const pageEl of doc.querySelectorAll('page')) {
    const file = pageEl.getAttribute('file');
    if (file === null || file.length === 0) {
      throw new Error('BMFont XML <page> must include a file attribute.');
    }
    const id = numericAttribute(pageEl, 'id', 0);
    if (!Number.isInteger(id) || id < 0) {
      throw new RangeError(
        'BMFont XML <page> id must be a non-negative integer.',
      );
    }
    if (pages.some((page) => page.id === id)) {
      throw new Error(`BMFont XML contains duplicate page id ${id}.`);
    }
    pages.push({ id, file });
  }
  if (pages.length === 0) {
    throw new Error('BMFont XML must contain at least one <page> element.');
  }

  const chars: FlxBmFontData['chars'] = {};
  const idToLetter: Record<number, string> = {};
  for (const charEl of doc.querySelectorAll('char')) {
    const id = numericAttribute(charEl, 'id', -1);
    if (!Number.isInteger(id) || id < 0 || id > 0x10ffff) {
      throw new RangeError(
        'BMFont XML <char> id must be a valid Unicode code point.',
      );
    }
    let letter =
      charEl.getAttribute('letter') ??
      charEl.getAttribute('char') ??
      String.fromCodePoint(id);
    if (letter === 'space') letter = ' ';
    idToLetter[id] = letter;
    const page = numericAttribute(charEl, 'page', 0);
    if (!Number.isInteger(page) || !pages.some((entry) => entry.id === page)) {
      throw new RangeError(
        'BMFont XML <char> page must reference a declared page id.',
      );
    }
    chars[letter] = {
      id,
      kerning: {},
      letter,
      page,
      width: numericAttribute(charEl, 'width', 0),
      height: numericAttribute(charEl, 'height', 0),
      x: numericAttribute(charEl, 'x', 0),
      xAdvance: numericAttribute(charEl, 'xadvance', 0),
      xOffset: numericAttribute(charEl, 'xoffset', 0),
      y: numericAttribute(charEl, 'y', 0),
      yOffset: numericAttribute(charEl, 'yoffset', 0),
    };
  }
  if (Object.keys(chars).length === 0) {
    throw new Error('BMFont XML must contain at least one <char> element.');
  }

  for (const kerningEl of doc.querySelectorAll('kerning')) {
    const first = numericAttribute(kerningEl, 'first', -1);
    const second = numericAttribute(kerningEl, 'second', -1);
    const amount = numericAttribute(kerningEl, 'amount', 0);
    const secondLetter = idToLetter[second];
    const firstLetter = idToLetter[first];
    const secondChar =
      secondLetter !== undefined ? chars[secondLetter] : undefined;
    if (secondChar !== undefined && firstLetter !== undefined) {
      secondChar.kerning[firstLetter] = amount;
    }
  }

  const base = numericAttribute(common, 'base', lineHeight);
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
