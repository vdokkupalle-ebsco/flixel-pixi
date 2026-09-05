import type { LevelEditorStore } from './editor-store';
import type { TileRegion } from './tiles';
import {
  setTileShapes,
  shapePoints,
  sourceShapeEntry,
  validateShapes,
  type ShapePoint,
  type TileShape,
} from './tile-shapes';

const escapeHtml = (v: string): string =>
  v
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/** A modal draft: Apply saves all changes as one undoable operation. */
export function openTileShapeEditor(
  store: LevelEditorStore,
  tile: TileRegion,
): () => void {
  const asset = store.status.snapshot.document.assets.find(
    (a) => a.id === tile.assetId,
  );
  if (!asset) return () => undefined;
  const entry = sourceShapeEntry(asset, tile);
  let shapes: TileShape[] = structuredClone(entry?.shapes ?? []);
  let custom = entry !== undefined;
  let selected = shapes.length ? 0 : -1;
  let tool: 'rectangle' | 'polygon' = 'rectangle';
  let points: ShapePoint[] = [];
  let start: ShapePoint | undefined;
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'tile-shape-dialog';
  dialog.setAttribute('aria-labelledby', 'tile-shape-heading');
  dialog.innerHTML = `<header><div><small>Source tile (${tile.x}, ${tile.y}) · ${tile.width} × ${tile.height} px</small><h2 id="tile-shape-heading">Tile collision shapes</h2></div><button type="button" data-close aria-label="Close collision editor">×</button></header>
  <p class="field-help">Shapes apply to every placement of this source tile on collision-enabled layers. Flips and rotations follow the tile.</p>
  <div class="shape-toolbar" role="toolbar" aria-label="Collision drawing tools"><button type="button" data-tool="rectangle">Rectangle</button><button type="button" data-tool="polygon">Polygon</button><button type="button" data-finish>Finish polygon</button><button type="button" data-back>Undo point</button></div>
  <p data-instruction class="field-help"></p>
  <div class="shape-workspace"><div class="shape-stage" style="aspect-ratio:${tile.width}/${tile.height}"><img alt="" draggable="false" src="${escapeHtml(asset.src)}" style="width:${(Number(asset.metadata?.width ?? tile.width) / tile.width) * 100}%;height:${(Number(asset.metadata?.height ?? tile.height) / tile.height) * 100}%;left:${(-tile.x / tile.width) * 100}%;top:${(-tile.y / tile.height) * 100}%"/><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Collision shape drawing surface"></svg></div>
  <div class="shape-properties"><label>Shape<select aria-label="Collision shape" data-selection></select></label><div data-fields></div><button type="button" data-remove>Delete shape</button></div></div>
  <div class="shape-toolbar" role="group" aria-label="Collision presets"><button type="button" data-preset="full">Full tile</button><button type="button" data-preset="half">Lower half</button><button type="button" data-preset="up">Slope up</button><button type="button" data-preset="down">Slope down</button><button type="button" data-empty>No collision</button><button type="button" data-default>Use layer default</button></div>
  <p data-mode class="field-help"></p><p data-error role="alert"></p>
  <footer><button type="button" data-close>Cancel</button><button type="button" class="button primary" data-apply>Apply shapes</button></footer>`;
  document.body.append(dialog);
  const query = <T extends Element = HTMLElement>(selector: string): T => {
    const element = dialog.querySelector<T>(selector);
    if (!element)
      throw new Error(`Missing collision editor control: ${selector}`);
    return element;
  };
  const svg = query<SVGSVGElement>('svg');
  const error = query<HTMLElement>('[data-error]');
  const showError = (e: unknown): void => {
    error.textContent = e instanceof Error ? e.message : String(e);
  };
  const draw = (preview?: TileShape): void => {
    svg.innerHTML =
      [...shapes, ...(preview ? [preview] : [])]
        .map(
          (s, i) =>
            `<polygon points="${shapePoints(s)
              .map((p) => `${p.x * 100},${p.y * 100}`)
              .join(
                ' ',
              )}" fill="${i === selected ? '#ffbd6660' : '#ffbd6630'}" stroke="#ffbd66" stroke-width="2" vector-effect="non-scaling-stroke"/>`,
        )
        .join('') +
      (points.length
        ? `<polyline points="${points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}" fill="none" stroke="#74e5f0" stroke-width="2" vector-effect="non-scaling-stroke"/>${points.map((p) => `<circle cx="${p.x * 100}" cy="${p.y * 100}" r="1" fill="#fff"/>`).join('')}`
        : '');
  };
  const render = (): void => {
    for (const button of dialog.querySelectorAll<HTMLButtonElement>(
      '[data-tool]',
    ))
      button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
    query('[data-instruction]').textContent =
      tool === 'rectangle'
        ? 'Drag over the tile to draw a rectangle. Presets and pixel fields also work with the keyboard.'
        : 'Click 3–8 corners in order, then Finish polygon. Use convex shapes; combine shapes for concave areas.';
    const select = query<HTMLSelectElement>('[data-selection]');
    select.innerHTML = shapes.length
      ? shapes
          .map(
            (s, i) =>
              `<option value="${i}" ${selected === i ? 'selected' : ''}>${i + 1}. ${s.kind === 'rectangle' ? 'Rectangle' : 'Polygon'}</option>`,
          )
          .join('')
      : '<option>No custom shapes</option>';
    select.disabled = !shapes.length;
    query<HTMLButtonElement>('[data-remove]').disabled = selected < 0;
    query<HTMLButtonElement>('[data-finish]').disabled = points.length < 3;
    query<HTMLButtonElement>('[data-back]').disabled = !points.length;
    const shape = shapes[selected];
    const fields = query('[data-fields]');
    fields.innerHTML =
      shape?.kind === 'rectangle'
        ? ['x', 'y', 'width', 'height']
            .map((key) => {
              const value =
                shape[key as 'x' | 'y' | 'width' | 'height'] *
                (key === 'x' || key === 'width' ? tile.width : tile.height);
              return `<label>${key}<input type="number" step="any" aria-label="Shape ${key}" data-field="${key}" value="${Number(value.toFixed(4))}"/></label>`;
            })
            .join('')
        : shape?.kind === 'polygon'
          ? `<label>Vertices (x,y pixels; one per line)<textarea aria-label="Polygon vertices" data-vertices rows="6">${shape.points.map((p) => `${Number((p.x * tile.width).toFixed(4))},${Number((p.y * tile.height).toFixed(4))}`).join('\n')}</textarea></label>`
          : '';
    query('[data-mode]').textContent = !custom
      ? 'Layer default: a full solid cell when layer collision is enabled.'
      : shapes.length
        ? `${shapes.length}/16 shapes. Apply to save; Cancel discards this draft.`
        : 'No collision: this tile will be passable even on a collision-enabled layer.';
    draw();
  };
  const add = (shape: TileShape): void => {
    validateShapes([...shapes, shape]);
    shapes.push(shape);
    custom = true;
    selected = shapes.length - 1;
    points = [];
    error.textContent = '';
    render();
  };
  const close = (): void => {
    dialog.close();
    dialog.remove();
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
      previousFocus.focus();
  };
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      'button',
    );
    if (!button) return;
    try {
      if (button.hasAttribute('data-close')) {
        close();
        return;
      }
      if (button.dataset.tool) {
        tool = button.dataset.tool as typeof tool;
        points = [];
      }
      if (button.hasAttribute('data-back')) points.pop();
      if (button.hasAttribute('data-finish')) {
        add({ kind: 'polygon', points: structuredClone(points) });
        return;
      }
      if (button.hasAttribute('data-remove')) {
        shapes.splice(selected, 1);
        selected = Math.min(selected, shapes.length - 1);
        custom = true;
      }
      if (
        button.hasAttribute('data-empty') ||
        button.hasAttribute('data-default')
      ) {
        shapes = [];
        selected = -1;
        points = [];
        custom = button.hasAttribute('data-empty');
      }
      const preset = button.dataset.preset;
      if (preset === 'full' || preset === 'half') {
        add({
          kind: 'rectangle',
          x: 0,
          y: preset === 'half' ? 0.5 : 0,
          width: 1,
          height: preset === 'half' ? 0.5 : 1,
        });
        return;
      }
      if (preset === 'up' || preset === 'down') {
        add({
          kind: 'polygon',
          points:
            preset === 'up'
              ? [
                  { x: 0, y: 1 },
                  { x: 1, y: 0 },
                  { x: 1, y: 1 },
                ]
              : [
                  { x: 0, y: 0 },
                  { x: 1, y: 1 },
                  { x: 0, y: 1 },
                ],
        });
        return;
      }
      if (button.hasAttribute('data-apply')) {
        if (points.length || start)
          throw new Error(
            'Finish or cancel the current shape before applying. Choose a drawing tool to cancel it.',
          );
        validateShapes(shapes);
        store.update('Changed source tile collision shapes', (draft) => {
          const source = draft.document.assets.find(
            (a) => a.id === tile.assetId,
          );
          if (!source)
            throw new Error('The source image is no longer in this project.');
          setTileShapes(source, tile, custom ? shapes : undefined);
          draft.showTileCollisions = true;
        });
        close();
        return;
      }
      error.textContent = '';
      render();
    } catch (e) {
      showError(e);
    }
  });
  dialog.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.hasAttribute('data-selection')) {
      selected = Number(input.value);
      render();
      return;
    }
    const shape = shapes[selected];
    if (!shape) return;
    try {
      const next = structuredClone(shape);
      if (input.dataset.field && next.kind === 'rectangle') {
        if (!input.value.trim()) throw new Error('Enter a pixel value.');
        const key = input.dataset.field as 'x' | 'y' | 'width' | 'height';
        next[key] =
          Number(input.value) /
          (key === 'x' || key === 'width' ? tile.width : tile.height);
      } else if (
        input.hasAttribute('data-vertices') &&
        next.kind === 'polygon'
      ) {
        next.points = input.value
          .trim()
          .split('\n')
          .map((line) => {
            const values = line.split(',');
            if (values.length !== 2 || values.some((v) => !v.trim()))
              throw new Error('Enter one x,y pair per line.');
            return {
              x: Number(values[0]) / tile.width,
              y: Number(values[1]) / tile.height,
            };
          });
      } else return;
      validateShapes([next]);
      shapes[selected] = next;
      error.textContent = '';
      draw();
    } catch (e) {
      render();
      showError(e);
    }
  });
  const point = (event: PointerEvent): ShapePoint => {
    const rect = svg.getBoundingClientRect();
    return {
      x:
        Math.round(
          Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) *
            tile.width,
        ) / tile.width,
      y:
        Math.round(
          Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) *
            tile.height,
        ) / tile.height,
    };
  };
  const rectangle = (origin: ShapePoint, end: ShapePoint): TileShape => ({
    kind: 'rectangle',
    x: Math.min(origin.x, end.x),
    y: Math.min(origin.y, end.y),
    width: Math.abs(origin.x - end.x),
    height: Math.abs(origin.y - end.y),
  });
  svg.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    if (tool === 'polygon') {
      if (points.length >= 8) {
        showError(
          new Error('Finish this polygon before adding more vertices.'),
        );
        return;
      }
      points.push(point(event));
      render();
    } else {
      start = point(event);
      svg.setPointerCapture(event.pointerId);
    }
  });
  svg.addEventListener('pointermove', (event) => {
    if (start) draw(rectangle(start, point(event)));
  });
  svg.addEventListener('pointerup', (event) => {
    if (!start) return;
    const shape = rectangle(start, point(event));
    start = undefined;
    if (svg.hasPointerCapture(event.pointerId))
      svg.releasePointerCapture(event.pointerId);
    try {
      add(shape);
    } catch (e) {
      draw();
      showError(e);
    }
  });
  svg.addEventListener('pointercancel', () => {
    start = undefined;
    draw();
  });
  render();
  dialog.showModal();
  return close;
}
