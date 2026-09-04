import { icon } from './icons';
import type { AssetDefinition } from '@flixel-pixi/schemas';
import type { LevelEditorSnapshot } from './model';
import { terrainSets } from './terrain';
import type { TileRegion } from './tiles';

const html = (value: unknown): string =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function tileImage(asset: AssetDefinition, tile: TileRegion): string {
  return `<span class="terrain-art"><img alt="" draggable="false" src="${html(asset.src)}" style="width:${(Number(asset.metadata?.width) / tile.width) * 100}%;height:${(Number(asset.metadata?.height) / tile.height) * 100}%;left:${(-tile.x / tile.width) * 100}%;top:${(-tile.y / tile.height) * 100}%"/></span>`;
}

export function terrainPanel(
  asset: AssetDefinition | undefined,
  snapshot: LevelEditorSnapshot,
  mask: number,
  tile?: TileRegion,
  editing = false,
  sourcePalette = '',
): string {
  const sets = asset ? terrainSets(asset) : [];
  const set = sets.find(
    (set) =>
      set.id === snapshot.terrain?.setId &&
      asset?.id === snapshot.terrain.assetId,
  );
  const rule = set?.rules.find((rule) => rule.mask === mask);
  const variants = rule ? [rule, ...(rule.variants ?? [])] : [];
  const totalWeight = variants.reduce(
    (total, variant) => total + (variant.weight ?? 1),
    0,
  );
  const variantRows =
    asset && rule
      ? `<div class="terrain-variants"><strong>Pattern ${mask} variants</strong><p class="field-help">Higher weights appear more often. Changes affect new terrain; existing matching tiles stay in place.</p>${variants.map((variant, index) => `<div class="terrain-variant-row"><span class="terrain-variant-preview">${tileImage(asset, variant.tile)}</span><label>Weight <small>${Math.round(((variant.weight ?? 1) / totalWeight) * 100)}%</small><input type="number" aria-label="Variant ${index + 1} weight" data-terrain-weight="${index}" min="0.01" max="1000" step="0.1" value="${variant.weight ?? 1}" /></label>${index ? `<button type="button" class="icon-button" data-terrain-variant-remove="${index - 1}" aria-label="Remove variant ${index + 1}" title="Remove variant">${icon('delete')}</button>` : '<span title="Primary tile">Base</span>'}</div>`).join('')}</div>`
      : '';
  return `<div class="terrain-panel" style="--terrain-color:${set?.color ?? '#72a854'}">
    <div class="terrain-heading"><strong>Terrain sets</strong><button class="button ghost compact" type="button" data-terrain-add ${!asset || sets.length >= 64 ? 'disabled' : ''}>+ New set</button></div>
    ${sets.length ? `<label class="tileset-label">Active terrain<select aria-label="Active terrain" data-terrain-set><option value="" disabled ${!set ? 'selected' : ''}>Choose a set…</option>${sets.map((s) => `<option value="${html(s.id)}" ${set?.id === s.id ? 'selected' : ''}>${html(s.name)}</option>`).join('')}</select></label>` : '<p class="field-help">Define corner transitions for your sheet, or try the complete sample below.</p>'}
    ${
      set
        ? `<div class="terrain-tools" role="toolbar" aria-label="Terrain tools"><button type="button" data-tool="terrain" aria-pressed="${snapshot.tool === 'terrain'}"><span class="terrain-swatch" style="background:${set.color}"></span>Paint ${html(set.name)}</button><button type="button" data-tool="terrain-erase" aria-pressed="${snapshot.tool === 'terrain-erase'}">Erase terrain</button></div>
      <p class="field-help">Paint a cell to shape its corners and connect neighboring tiles.</p>
      <details class="terrain-rules" ${editing ? 'open' : ''}><summary>Terrain rules <span>${set.rules.length}/15 patterns</span></summary>
        <div class="field-pair"><label>Name<input aria-label="Terrain name" data-terrain-name value="${html(set.name)}" maxlength="80"/></label><label>Color<input aria-label="Terrain color" data-terrain-color type="color" value="${set.color}"/></label></div>
        <p class="field-help">1. Choose a source tile.<br/>2. Mark corners covered by terrain.<br/>3. Assign the tile to this pattern.</p>
        ${sourcePalette}<div class="terrain-rule-editor"><div class="terrain-tile-preview">${asset && tile ? tileImage(asset, tile) : '<span>Choose a tile</span>'}${['Top left', 'Top right', 'Bottom right', 'Bottom left'].map((label, index) => `<button type="button" class="terrain-corner corner-${index}" data-terrain-corner="${index}" aria-label="${label} terrain corner" aria-pressed="${Boolean(mask & (1 << index))}" title="${label}"></button>`).join('')}</div><div><strong>Pattern ${mask}</strong><p class="field-help">${mask === 0 ? 'All empty: clears the cell.' : `${[0, 1, 2, 3].filter((i) => mask & (1 << i)).length} filled corners`}</p><button class="button ghost compact" type="button" data-terrain-assign ${!tile || mask === 0 ? 'disabled' : ''}>Assign tile</button><button class="button ghost compact" type="button" data-terrain-variant-add ${!tile || !rule || variants.length >= 16 || variants.some((v) => v.tile.x === tile.x && v.tile.y === tile.y && v.tile.width === tile.width && v.tile.height === tile.height) ? 'disabled' : ''}>Add variant</button></div></div>${variantRows}
        <div class="terrain-patterns" role="group" aria-label="Terrain patterns">${Array.from(
          { length: 16 },
          (_, pattern) => {
            const rule = set.rules.find((rule) => rule.mask === pattern);
            return `<button type="button" class="terrain-pattern ${pattern !== 0 && !rule ? 'is-missing' : ''}" data-terrain-pattern="${pattern}" aria-label="Pattern ${pattern}: ${pattern === 0 ? 'empty' : rule ? 'assigned' : 'missing'}" aria-pressed="${pattern === mask}" title="Pattern ${pattern}: ${pattern === 0 ? 'empty' : rule ? 'assigned' : 'missing'}">${asset && rule ? tileImage(asset, rule.tile) : `<span class="pattern-number">${pattern}</span>`}${[0, 1, 2, 3].map((i) => `<i class="terrain-dot corner-${i} ${pattern & (1 << i) ? 'is-filled' : ''}"></i>`).join('')}</button>`;
          },
        ).join('')}</div>
        <p class="field-help">Dashed patterns need a tile. Empty always clears a cell. One terrain per set, transitioning to empty. Assign tile replaces the primary tile. Add variant keeps it and adds another choice. A source tile can belong to only one pattern.</p>
        <div class="terrain-tools"><button type="button" data-terrain-clear ${!set.rules.some((r) => r.mask === mask) ? 'disabled' : ''}>Clear pattern ${mask}</button><button type="button" data-terrain-remove>Remove set</button></div>
      </details>`
        : ''
    }
    <button class="button ghost full terrain-sample" type="button" data-terrain-sample>Add sample terrain</button>
  </div>`;
}
