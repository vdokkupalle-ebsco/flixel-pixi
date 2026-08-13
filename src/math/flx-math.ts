/** Restricts a number to an inclusive, ordered range. @public */
export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Restricts a number to the inclusive unit range from 0 to 1. @public */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
