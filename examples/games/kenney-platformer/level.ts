export const TILE = 64;
export const MAP_W = 100;
export const MAP_H = 16;
export const FLOOR = MAP_H - 2; // 14

/**
 * With TILE=64 and Paragon-like jump (~1–1.5 tiles), never step more than
 * one tile vertically from the local standing surface.
 */
export const PLAYER_SPAWN = { tx: 3, ty: FLOOR - 1 } as const;

export const COIN_SPOTS: readonly (readonly [number, number])[] = [
  [8, FLOOR - 2],
  [9, FLOOR - 2],
  [10, FLOOR - 2],
  [19, FLOOR - 2],
  [20, FLOOR - 2],
  [21, FLOOR - 2],
  [33, FLOOR - 3],
  [34, FLOOR - 3],
  [45, FLOOR - 2],
  [48, FLOOR - 3],
  [63, FLOOR - 2],
  [64, FLOOR - 2],
  [74, FLOOR - 2],
  [75, FLOOR - 2],
] as const;

export const SLIME_SPOTS: readonly {
  readonly tx: number;
  readonly ty: number;
  readonly left: number;
  readonly right: number;
}[] = [
  { tx: 12, ty: FLOOR - 1, left: 10 * TILE, right: 16 * TILE },
  { tx: 34, ty: FLOOR - 2, left: 32 * TILE, right: 36 * TILE },
  { tx: 56, ty: FLOOR - 1, left: 52 * TILE, right: 66 * TILE },
  { tx: 82, ty: FLOOR - 1, left: 80 * TILE, right: 90 * TILE },
] as const;

export const FLY_SPOTS: readonly {
  readonly tx: number;
  readonly ty: number;
  readonly amp: number;
}[] = [
  { tx: 20, ty: FLOOR - 3, amp: 28 },
  { tx: 46, ty: FLOOR - 4, amp: 32 },
  { tx: 74, ty: FLOOR - 3, amp: 28 },
] as const;

export const FLAG_SPOT = { tx: 94, ty: FLOOR - 1 } as const;

export function makeMapData(): number[] {
  const data = new Array<number>(MAP_W * MAP_H).fill(0);

  const setTile = (x: number, y: number, id: number) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) {
      data[y * MAP_W + x] = id;
    }
  };

  // Solid outer boundaries (left/right walls)
  for (let y = 0; y < MAP_H; y += 1) {
    setTile(0, y, 4);
    setTile(MAP_W - 1, y, 4);
  }

  // Primary ground terrain
  for (let x = 1; x < MAP_W - 1; x += 1) {
    setTile(x, FLOOR, 1);
    setTile(x, FLOOR + 1, 4);
  }

  // Hill 1: one-tile step (cols 7..11)
  for (let x = 7; x <= 11; x += 1) {
    setTile(x, FLOOR - 1, 1);
    setTile(x, FLOOR, 4);
  }
  setTile(7, FLOOR - 1, 2);
  setTile(11, FLOOR - 1, 3);

  // Pit 1: Columns 18..22 — bridge one tile above floor (reachable)
  for (let x = 18; x <= 22; x += 1) {
    setTile(x, FLOOR, 0);
    setTile(x, FLOOR + 1, 0);
  }
  setTile(17, FLOOR, 3);
  setTile(23, FLOOR, 2);
  for (let x = 19; x <= 21; x += 1) setTile(x, FLOOR - 1, 5);

  // Raised ledge (cols 31..37): floor → +1 → +2 with a step
  for (let x = 31; x <= 33; x += 1) {
    setTile(x, FLOOR - 1, 1);
    setTile(x, FLOOR, 4);
  }
  setTile(31, FLOOR - 1, 2);
  setTile(33, FLOOR - 1, 3);
  for (let x = 34; x <= 37; x += 1) {
    setTile(x, FLOOR - 1, 4);
    setTile(x, FLOOR - 2, 1);
  }
  setTile(34, FLOOR - 2, 2);
  setTile(37, FLOOR - 2, 3);

  // Pit 2: Columns 44..49 — stepping stones (+1 then +2)
  for (let x = 44; x <= 49; x += 1) {
    setTile(x, FLOOR, 0);
    setTile(x, FLOOR + 1, 0);
  }
  setTile(43, FLOOR, 3);
  setTile(50, FLOOR, 2);
  setTile(45, FLOOR - 1, 5);
  setTile(47, FLOOR - 1, 5);
  setTile(48, FLOOR - 2, 5);

  // Hill 2: one-tile plateau (cols 62..68)
  for (let x = 62; x <= 68; x += 1) {
    setTile(x, FLOOR - 1, 1);
    setTile(x, FLOOR, 4);
  }
  setTile(62, FLOOR - 1, 2);
  setTile(68, FLOOR - 1, 3);

  // Pit 3: Columns 72..77 — bridge one tile above floor
  for (let x = 72; x <= 77; x += 1) {
    setTile(x, FLOOR, 0);
    setTile(x, FLOOR + 1, 0);
  }
  setTile(71, FLOOR, 3);
  setTile(78, FLOOR, 2);
  for (let x = 73; x <= 76; x += 1) setTile(x, FLOOR - 1, 5);

  // Final Victory Plateau
  for (let x = 91; x <= 97; x += 1) {
    setTile(x, FLOOR, 1);
    setTile(x, FLOOR + 1, 4);
  }

  return data;
}
