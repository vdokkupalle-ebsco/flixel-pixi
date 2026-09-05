import { icon } from './icons';
import type { AssetDefinition } from '@flixel-pixi/schemas';
import type { LevelEditorSnapshot } from './model';
import {
  terrainSets,
  terrainTypes,
  terrainPatternCount,
  terrainCoverage,
  terrainDiagnostics,
  terrainTile,
  patternValues,
} from './terrain';
import type { TileRegion } from './tiles';

const html = (value: unknown): string =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function tileImage(asset: AssetDefinition, tile: TileRegion): string {
  return `<span class="terrain-art"><span class="terrain-art-transform" style="transform:rotate(${(tile.rotation ?? 0) * 90}deg) scaleX(${tile.flipX ? -1 : 1})"><img alt="" draggable="false" src="${html(asset.src)}" style="width:${(Number(asset.metadata?.width) / tile.width) * 100}%;height:${(Number(asset.metadata?.height) / tile.height) * 100}%;left:${(-tile.x / tile.width) * 100}%;top:${(-tile.y / tile.height) * 100}%"/></span></span>`;
}

export function terrainPanel(
  asset: AssetDefinition | undefined,
  snapshot: LevelEditorSnapshot,
  mask: number,
  tile?: TileRegion,
  editing = false,
  sourcePalette = '',
  autoAssignCount = 1,
): string {
  const sets = asset ? terrainSets(asset) : [];
  const set = sets.find(
    (set) =>
      set.id === snapshot.terrain?.setId &&
      asset?.id === snapshot.terrain.assetId,
  );
  const types = set ? terrainTypes(set) : [];
  const paintedType =
    types[(snapshot.terrain?.terrainIndex ?? 1) - 1] ?? types[0];
  const values = set ? patternValues(set, mask) : [0, 0, 0, 0];
  const rule = set?.rules.find((rule) => rule.mask === mask);
  const variants = rule ? [rule, ...(rule.variants ?? [])] : [];
  const positions =
    set?.kind === 'edge'
      ? ['Top', 'Right', 'Bottom', 'Left']
      : ['Top left', 'Top right', 'Bottom right', 'Bottom left'];
  const positionName = set?.kind === 'edge' ? 'edge' : 'corner';
  const coverage = set ? terrainCoverage(set) : 0;
  const diagnostics = set ? terrainDiagnostics(set) : undefined;
  const totalWeight = variants.reduce(
    (total, variant) => total + (variant.weight ?? 1),
    0,
  );
  const variantRows =
    asset && rule
      ? `<div class="terrain-variants"><strong>Pattern ${mask} variants</strong><p class="field-help">Higher weights appear more often. Changes affect new terrain; existing matching tiles stay in place.</p>${variants.map((variant, index) => `<div class="terrain-variant-row"><span class="terrain-variant-preview">${tileImage(asset, variant.tile)}</span><label>Weight <small>${Math.round(((variant.weight ?? 1) / totalWeight) * 100)}%</small><input type="number" aria-label="Variant ${index + 1} weight" data-terrain-weight="${index}" min="0.01" max="1000" step="0.1" value="${variant.weight ?? 1}" /></label>${index ? `<button type="button" class="icon-button" data-terrain-variant-remove="${index - 1}" aria-label="Remove variant ${index + 1}" title="Remove variant">${icon('delete')}</button>` : '<span title="Primary tile">Base</span>'}</div>`).join('')}</div>`
      : '';
  return `<div class="terrain-panel ${set?.kind === 'edge' ? 'terrain-edge' : ''}" style="--terrain-color:${set?.color ?? '#72a854'}">
    <div class="terrain-heading"><strong>Terrain sets</strong><span><button class="button ghost compact" type="button" data-terrain-add ${!asset || sets.length >= 64 ? 'disabled' : ''}>+ Corner set</button><button class="button ghost compact" type="button" data-terrain-edge-add ${!asset || sets.length >= 64 ? 'disabled' : ''}>+ Edge set</button></span></div>
    ${sets.length ? `<label class="tileset-label">Active terrain<select aria-label="Active terrain" data-terrain-set><option value="" disabled ${!set ? 'selected' : ''}>Choose a set…</option>${sets.map((s) => `<option value="${html(s.id)}" ${set?.id === s.id ? 'selected' : ''}>${html(s.name)} · ${s.kind}</option>`).join('')}</select></label>` : '<p class="field-help">Define corner terrain or edge-connected roads and paths, or try a complete sample below.</p>'}
    ${
      set
        ? `<label class="tileset-label">Terrain to paint<select aria-label="Terrain to paint" data-terrain-brush>${types.map((type, index) => `<option value="${index + 1}" ${(snapshot.terrain?.terrainIndex ?? 1) === index + 1 ? 'selected' : ''}>${html(type.name)}</option>`).join('')}</select></label><div class="terrain-tools" role="toolbar" aria-label="Terrain tools"><button type="button" data-tool="terrain" aria-pressed="${snapshot.tool === 'terrain'}"><span class="terrain-swatch" style="background:${paintedType?.color ?? set.color}"></span>Paint ${html(paintedType?.name ?? set.name)}</button><button type="button" data-tool="terrain-erase" aria-pressed="${snapshot.tool === 'terrain-erase'}">Erase terrain</button></div>
      <p class="field-help">Paint a cell to shape its ${positionName}s and connect neighboring tiles.</p>
      <details class="terrain-rules" ${editing ? 'open' : ''}><summary>Terrain rules <span>${set.rules.length} assigned · ${coverage}/${terrainPatternCount(set) - 1} covered</span></summary>
        <div class="field-pair"><label>Name<input aria-label="Terrain name" data-terrain-name value="${html(set.name)}" maxlength="80"/></label><label>Color<input aria-label="Terrain color" data-terrain-color type="color" value="${set.color}"/></label></div>
        <fieldset class="terrain-transform-options"><legend>Automatic transforms</legend><label><input type="checkbox" data-terrain-allow-rotation ${set.allowRotation !== false ? 'checked' : ''}/> Rotate artwork</label><label><input type="checkbox" data-terrain-allow-flip ${set.allowFlip !== false ? 'checked' : ''}/> Reflect artwork</label></fieldset>
        <div class="terrain-diagnostics"><strong>Coverage diagnostics</strong><div>${(
          [
            ['assigned', 'Assigned'],
            ['derived', 'Derived'],
            ['missing', 'Missing'],
            ['duplicated', 'Duplicated'],
            ['unreachable', 'Unreachable'],
          ] as const
        )
          .map(([key, label]) => {
            const masks = diagnostics?.[key] ?? [];
            return `<button type="button" data-terrain-diagnostic="${key}" ${masks.length ? '' : 'disabled'} title="${masks.length ? `Go to ${label.toLowerCase()} pattern` : `No ${label.toLowerCase()} patterns`}"><span>${masks.length}</span>${label}</button>`;
          })
          .join(
            '',
          )}</div><p class="field-help">Choose a count to jump through its patterns. Missing rules block matching paint operations; malformed duplicate and unreachable rules are rejected during import.</p></div>
        <div class="terrain-types">${types.map((type, index) => `<div class="field-pair"><label>Terrain ${index + 1}<input aria-label="Terrain type ${index + 1} name" data-terrain-type-name="${index}" value="${html(type.name)}" maxlength="80"/></label><label>Color<input aria-label="Terrain type ${index + 1} color" data-terrain-type-color="${index}" type="color" value="${type.color}"/></label></div>`).join('')}<button class="button ghost compact" type="button" data-terrain-type-add ${types.length >= 3 ? 'disabled' : ''}>Add terrain type</button></div>
        <p class="field-help">1. Choose a source tile.<br/>2. Click ${positionName}s to cycle through empty and terrain types.<br/>3. Assign the tile to this pattern.</p>
        ${sourcePalette}<div class="terrain-auto-assign"><button class="button ghost full" type="button" data-terrain-auto-assign ${autoAssignCount < 2 || mask === 0 ? 'disabled' : ''}>Assign ${autoAssignCount} selected tiles from pattern ${mask}</button><p class="field-help">Click the first source tile, then Shift-click the last. Tiles map to consecutive pattern numbers in row-major order.</p></div><div class="terrain-rule-editor"><div class="terrain-tile-preview">${asset && tile ? tileImage(asset, tile) : '<span>Choose a tile</span>'}${positions.map((label, index) => `<button type="button" class="terrain-corner corner-${index}" data-terrain-corner="${index}" aria-label="${label} terrain ${positionName}" aria-pressed="${Boolean(values[index])}" style="${values[index] ? `background:${types[(values[index] ?? 1) - 1]?.color}` : ''}" title="${label}: ${html(types[(values[index] ?? 0) - 1]?.name ?? 'Empty')}"></button>`).join('')}</div><div><strong>Pattern ${mask}</strong><p class="field-help">${mask === 0 ? 'All empty: clears the cell.' : `${values.filter(Boolean).length} filled ${positionName}s`}</p><button class="button ghost compact" type="button" data-terrain-assign ${!tile || mask === 0 ? 'disabled' : ''}>Assign tile</button><button class="button ghost compact" type="button" data-terrain-variant-add ${!tile || !rule || variants.length >= 16 || variants.some((v) => v.tile.x === tile.x && v.tile.y === tile.y && v.tile.width === tile.width && v.tile.height === tile.height) ? 'disabled' : ''}>Add variant</button></div></div>${variantRows}
        <div class="terrain-patterns" role="group" aria-label="Terrain patterns">${Array.from(
          { length: terrainPatternCount(set) },
          (_, pattern) => {
            const rule = set.rules.find((rule) => rule.mask === pattern);
            const resolved = pattern
              ? terrainTile(set, pattern, { x: 0, y: 0 })
              : undefined;
            const state =
              pattern === 0
                ? 'empty'
                : rule
                  ? 'assigned'
                  : resolved
                    ? 'derived'
                    : 'missing';
            return `<button type="button" class="terrain-pattern ${state === 'missing' ? 'is-missing' : ''} ${state === 'derived' ? 'is-derived' : ''}" data-terrain-pattern="${pattern}" aria-label="Pattern ${pattern}: ${state}" aria-pressed="${pattern === mask}" title="Pattern ${pattern}: ${state}">${asset && resolved ? tileImage(asset, resolved) : `<span class="pattern-number">${pattern}</span>`}${[0, 1, 2, 3].map((i) => `<i class="terrain-dot corner-${i} ${patternValues(set, pattern)[i] ? 'is-filled' : ''}" style="${patternValues(set, pattern)[i] ? `background:${types[(patternValues(set, pattern)[i] ?? 1) - 1]?.color}` : ''}"></i>`).join('')}</button>`;
          },
        ).join('')}</div>
        <p class="field-help">Dashed patterns need a tile. Dotted patterns reuse assigned artwork through rotation or reflection; an explicit assignment replaces the derived result. Empty always clears a cell. ${set.kind === 'edge' ? 'Edges connect directly to adjacent cells.' : 'Corners can join any terrain types in this set.'} Assign tile replaces the primary tile. Add variant keeps it and adds another choice. A source tile can belong to only one pattern.</p>
        <div class="terrain-tools"><button type="button" data-terrain-clear ${!set.rules.some((r) => r.mask === mask) ? 'disabled' : ''}>Clear pattern ${mask}</button><button type="button" data-terrain-remove>Remove set</button></div>
      </details>`
        : ''
    }
    <button class="button ghost full terrain-sample" type="button" data-terrain-sample>Add sample terrain</button><button class="button ghost full terrain-sample" type="button" data-terrain-multi-sample>Add grass and dirt sample</button><button class="button ghost full terrain-sample" type="button" data-terrain-edge-sample>Add road sample</button>
  </div>`;
}
