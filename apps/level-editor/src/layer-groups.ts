import type { SceneLayerDefinition } from './model';

/** Parent references keep older flat scenes compatible. */
export function validateLayerGroups(layers: SceneLayerDefinition[]): void {
  const ids = new Set(layers.map((l) => l.id));
  if (ids.size !== layers.length) throw new Error('Layer IDs must be unique.');
  if (!layers.some((l) => l.kind !== 'group'))
    throw new Error('Keep at least one content layer.');
  for (const layer of layers) {
    if (layer.kind === 'group' && (layer.tilemap || layer.tileCollision))
      throw new Error('Groups cannot contain tiles or collision settings.');
    const visited = new Set([layer.id]);
    let current = layer;
    while (current.parentId !== undefined) {
      const parent = layers.find((l) => l.id === current.parentId);
      if (!parent || parent.kind !== 'group')
        throw new Error('Layer parent must be a group.');
      if (visited.has(parent.id))
        throw new Error('Layer groups cannot contain cycles.');
      visited.add(parent.id);
      current = parent;
    }
  }
}

export function layerAncestors(
  layer: SceneLayerDefinition,
  layers: SceneLayerDefinition[],
): SceneLayerDefinition[] {
  const result: SceneLayerDefinition[] = [];
  let parent = layers.find((l) => l.id === layer.parentId);
  while (parent && !result.includes(parent)) {
    result.push(parent);
    parent = layers.find((l) => l.id === parent?.parentId);
  }
  return result;
}

export function layerSubtree(
  id: string,
  layers: SceneLayerDefinition[],
): Set<string> {
  return new Set(
    layers
      .filter(
        (l) =>
          l.id === id || layerAncestors(l, layers).some((p) => p.id === id),
      )
      .map((l) => l.id),
  );
}

/** Top-to-bottom hierarchy, preserving each sibling stack. Returns raw layers. */
export function flattenLayers(
  layers: SceneLayerDefinition[],
): SceneLayerDefinition[] {
  const visit = (parentId?: string): SceneLayerDefinition[] =>
    layers
      .filter((l) => l.parentId === parentId)
      .sort((a, b) => b.order - a.order)
      .flatMap((l) => [l, ...visit(l.id)]);
  return visit();
}

/** Read-only effective state; local child flags remain intact when a group changes. */
export function effectiveLayer(
  layer: SceneLayerDefinition,
  layers: SceneLayerDefinition[],
): SceneLayerDefinition {
  const ancestors = layerAncestors(layer, layers);
  return {
    ...layer,
    visible: layer.visible && ancestors.every((l) => l.visible),
    locked: layer.locked || ancestors.some((l) => l.locked),
    order:
      (layers.length -
        flattenLayers(layers).findIndex((l) => l.id === layer.id)) *
      100,
  };
}
export function effectiveLayers(
  layers: SceneLayerDefinition[],
): SceneLayerDefinition[] {
  return flattenLayers(layers).map((l) => effectiveLayer(l, layers));
}
