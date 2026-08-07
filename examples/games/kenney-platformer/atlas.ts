export interface AtlasFrame {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function parseKenneyAtlasXml(xmlText: string): Map<string, AtlasFrame> {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const nodes = doc.querySelectorAll('SubTexture');
  if (nodes.length === 0) {
    throw new Error('Kenney atlas XML contains no SubTexture entries.');
  }

  const result = new Map<string, AtlasFrame>();
  for (const node of nodes) {
    const name = node.getAttribute('name');
    const x = Number.parseInt(node.getAttribute('x') ?? '0', 10);
    const y = Number.parseInt(node.getAttribute('y') ?? '0', 10);
    const width = Number.parseInt(node.getAttribute('width') ?? '0', 10);
    const height = Number.parseInt(node.getAttribute('height') ?? '0', 10);

    if (name && Number.isFinite(width) && Number.isFinite(height)) {
      result.set(name, { name, x, y, width, height });
    }
  }

  return result;
}
