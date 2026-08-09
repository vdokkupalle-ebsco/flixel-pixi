import type { FlxCamera } from '../core/flx-camera';
import type { FlxObject } from '../objects/flx-object';

export function interpolateValue(
  previous: number,
  current: number,
  alpha: number,
): number {
  return previous + (current - previous) * alpha;
}

export function interpolateObjectX(object: FlxObject, alpha: number): number {
  return interpolateValue(object.last.x, object.x, alpha);
}

export function interpolateObjectY(object: FlxObject, alpha: number): number {
  return interpolateValue(object.last.y, object.y, alpha);
}

export function interpolateObjectAngle(
  object: FlxObject,
  alpha: number,
): number {
  const delta = ((object.angle - object.lastAngle + 540) % 360) - 180;
  return object.lastAngle + delta * alpha;
}

export function interpolateCameraScrollX(
  camera: FlxCamera,
  alpha: number,
): number {
  return interpolateValue(camera.lastScroll.x, camera.scroll.x, alpha);
}

export function interpolateCameraScrollY(
  camera: FlxCamera,
  alpha: number,
): number {
  return interpolateValue(camera.lastScroll.y, camera.scroll.y, alpha);
}
