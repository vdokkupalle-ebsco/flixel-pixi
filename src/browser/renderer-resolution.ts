/** Resolve a bounded renderer resolution from the current browser DPR. @internal */
export function resolveRendererResolution(
  devicePixelRatio: number,
  maximum: number,
): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) {
    throw new RangeError(
      'Device pixel ratio must be a positive finite number.',
    );
  }
  if (!Number.isFinite(maximum) || maximum <= 0) {
    throw new RangeError(
      'Maximum device pixel ratio must be a positive finite number.',
    );
  }
  return Math.min(devicePixelRatio, maximum);
}
