import type { EditorTool } from './model';

// A white halo keeps these 32px cursors legible on both light and dark tiles.
// The top-left cross marks the precise tile-tool hotspot.
function tileCursor(shape: string): string {
  const paths = `<path d="M1 5h8M5 1v8"/>${shape}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="white" stroke-width="4">${paths}</g><g stroke="#17212b" stroke-width="2">${paths}</g></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 5 5, crosshair`;
}

export const TOOL_CURSORS: Record<EditorTool | 'capture', string> = {
  select: 'default',
  pan: 'grab',
  move: 'move',
  scale: 'nwse-resize',
  rotate: tileCursor('<path d="M12 21a8 8 0 1 1 9 7M12 21v-7m0 7h7"/>'),
  brush: tileCursor('<path d="m12 24 3-8L25 6l4 4-10 10-7 4Zm3-8 4 4"/>'),
  eraser: tileCursor(
    '<path d="m11 22 11-13 8 7-10 12h-3l-6-6Zm5-6 8 7M20 28h10"/>',
  ),
  fill: tileCursor(
    '<path d="m10 19 9-10 10 10-9 9-10-9Zm6-12 8 12H10m19 4v5"/>',
  ),
  rectangle: tileCursor('<path d="M12 13h17v15H12zM16 17h9v7h-9z"/>'),
  eyedropper: tileCursor('<path d="m12 26 2-7L25 8l4 4-11 11-6 3Zm8-15 7 7"/>'),
  'tile-select': tileCursor(
    '<path stroke-dasharray="3 3" d="M12 13h17v15H12z"/>',
  ),
  paste: tileCursor('<path d="M13 15h12v14H13zM18 15v-5h11v14h-4"/>'),
  terrain: tileCursor('<path d="m10 27 6-13 5 8 4-6 6 11H10Zm4-8h5"/>'),
  'terrain-erase': tileCursor(
    '<path d="m10 27 6-13 5 8 4-6 6 11H10M13 11l16 18"/>',
  ),
  capture: tileCursor(
    '<path d="M11 17v-5h5m8 0h5v5m0 7v5h-5m-8 0h-5v-5M16 17h8v7h-8z"/>',
  ),
};
