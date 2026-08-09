export interface RenderFrameTiming {
  /** Synthetic interval used only to maintain the requested render cadence. */
  readonly pacingElapsedMS: number;
  readonly previousRenderTime: number;
}

export function validateFramerate(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

/** Internal timing helper for a requestAnimationFrame-driven render cap. */
export function getRenderFrameTiming(
  now: number,
  previousRenderTime: number,
  renderFramerate?: number,
): RenderFrameTiming | null {
  const elapsedMS = Math.max(0, now - previousRenderTime);
  if (renderFramerate === undefined) {
    return { pacingElapsedMS: elapsedMS, previousRenderTime: now };
  }

  const intervalMS = 1000 / renderFramerate;
  // RAF timestamps commonly land a fraction of a millisecond before the ideal
  // boundary. A small tolerance avoids unintentionally halving the requested
  // rate while still rejecting genuinely early callbacks.
  if (elapsedMS + 0.1 < intervalMS) return null;

  return {
    pacingElapsedMS: elapsedMS,
    previousRenderTime:
      elapsedMS < intervalMS ? now : now - (elapsedMS % intervalMS),
  };
}
