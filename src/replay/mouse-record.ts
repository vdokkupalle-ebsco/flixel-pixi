/** Represents a mouse input snapshot within a single replay frame. @public */
export class MouseRecord {
  x: number;
  y: number;
  button: number;
  wheel: number;

  constructor(x = 0, y = 0, button = 0, wheel = 0) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.button = button;
    this.wheel = wheel;
  }
}
