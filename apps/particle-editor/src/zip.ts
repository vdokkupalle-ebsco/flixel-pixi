export interface ZipFileEntry {
  data: Uint8Array | string;
  path: string;
}

function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let code = index;
    for (let bit = 0; bit < 8; bit += 1) {
      code = code & 1 ? 0xedb88320 ^ (code >>> 1) : code >>> 1;
    }
    table[index] = code >>> 0;
  }
  return table;
}

const crcTable = makeCrc32Table();

export function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ (crcTable[(crc ^ byte) & 0xff] ?? 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZipBlob(entries: readonly ZipFileEntry[]): Blob {
  const encoder = new TextEncoder();
  const fileRecords: {
    crc: number;
    dataBytes: Uint8Array;
    filenameBytes: Uint8Array;
    offset: number;
  }[] = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  for (const entry of entries) {
    const filenameBytes = encoder.encode(entry.path);
    const dataBytes =
      typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const crc = calculateCrc32(dataBytes);
    const offset = currentOffset;

    // Local file header (30 bytes)
    const header = new Uint8Array(30);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, dataBytes.length, true);
    view.setUint32(22, dataBytes.length, true);
    view.setUint16(26, filenameBytes.length, true);
    view.setUint16(28, 0, true);

    chunks.push(header, filenameBytes, dataBytes);
    currentOffset += 30 + filenameBytes.length + dataBytes.length;

    fileRecords.push({ crc, dataBytes, filenameBytes, offset });
  }

  const centralDirStart = currentOffset;

  // Central directory
  for (const record of fileRecords) {
    const cdHeader = new Uint8Array(46);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, record.crc, true);
    view.setUint32(20, record.dataBytes.length, true);
    view.setUint32(24, record.dataBytes.length, true);
    view.setUint16(28, record.filenameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, record.offset, true);

    chunks.push(cdHeader, record.filenameBytes);
    currentOffset += 46 + record.filenameBytes.length;
  }

  const centralDirSize = currentOffset - centralDirStart;

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, fileRecords.length, true);
  eocdView.setUint16(10, fileRecords.length, true);
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, centralDirStart, true);
  eocdView.setUint16(20, 0, true);

  chunks.push(eocd);

  return new Blob(chunks as BlobPart[], { type: 'application/zip' });
}
