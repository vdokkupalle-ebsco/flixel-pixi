import type { EntityDefinition } from '@flixel-pixi/schemas';
import { entityProperties } from './model';

export interface SelectionPoint {
  x: number;
  y: number;
}

/** Separating-axis test between the marquee and the object's rotated rectangle. */
export function intersectsMarquee(
  entity: EntityDefinition,
  width: number,
  height: number,
  start: SelectionPoint,
  end: SelectionPoint,
): boolean {
  const properties = entityProperties(entity);
  const left = -width * Number(properties.originX ?? 0.5);
  const top = -height * Number(properties.originY ?? 0.5);
  const angle = entity.rotation ?? 0;
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const object = [
    [left, top],
    [left + width, top],
    [left + width, top + height],
    [left, top + height],
  ].map(([x = 0, y = 0]) => ({
    x: entity.position.x + x * c - y * s,
    y: entity.position.y + x * s + y * c,
  }));
  const box = [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y },
  ];
  return [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: c, y: s },
    { x: -s, y: c },
  ].every((axis) => {
    const a = object.map((p) => p.x * axis.x + p.y * axis.y);
    const b = box.map((p) => p.x * axis.x + p.y * axis.y);
    return Math.max(...a) >= Math.min(...b) && Math.max(...b) >= Math.min(...a);
  });
}
