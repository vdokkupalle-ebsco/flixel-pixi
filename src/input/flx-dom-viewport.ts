interface FlxDomViewport {
  readonly left: number;
  readonly top: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

/** Resolves the logical game viewport inside a potentially letterboxed element. */
export function getDomViewport(
  element: HTMLElement,
  logicalWidth: number,
  logicalHeight: number,
): FlxDomViewport {
  const bounds = element.getBoundingClientRect();
  const objectFit =
    typeof Element !== 'undefined' && element instanceof Element
      ? getComputedStyle(element).objectFit
      : '';

  if (objectFit !== 'contain') {
    return {
      left: bounds.left,
      top: bounds.top,
      scaleX: bounds.width / logicalWidth,
      scaleY: bounds.height / logicalHeight,
    };
  }

  const scale = Math.min(
    bounds.width / logicalWidth,
    bounds.height / logicalHeight,
  );
  const contentWidth = logicalWidth * scale;
  const contentHeight = logicalHeight * scale;
  return {
    left: bounds.left + (bounds.width - contentWidth) / 2,
    top: bounds.top + (bounds.height - contentHeight) / 2,
    scaleX: scale,
    scaleY: scale,
  };
}
