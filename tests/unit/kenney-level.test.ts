import {
  COIN_SPOTS,
  FLAG_SPOT,
  FLOOR,
  FLY_SPOTS,
  MAP_H,
  MAP_W,
  PLAYER_SPAWN,
  SLIME_SPOTS,
  TILE,
  makeMapData,
} from '../../examples/games/kenney-platformer/level';
import { describe, expect, it } from 'vitest';

describe('kenney level', () => {
  it('has expected dimensions and spawn counts', () => {
    expect(TILE).toBe(64);
    expect(MAP_W).toBe(100);
    expect(MAP_H).toBe(16);
    const data = makeMapData();
    expect(data).toHaveLength(MAP_W * MAP_H);
    expect(data.every((v) => Number.isInteger(v) && v >= 0 && v <= 5)).toBe(true);
    expect(COIN_SPOTS).toHaveLength(14);
    expect(SLIME_SPOTS).toHaveLength(4);
    expect(FLY_SPOTS).toHaveLength(3);
    expect(PLAYER_SPAWN.tx).toBeGreaterThanOrEqual(1);
    expect(FLAG_SPOT.tx).toBeGreaterThan(PLAYER_SPAWN.tx);
  });

  it('has solid floor with at least one pit of air', () => {
    const data = makeMapData();
    const floorTiles = data.slice(FLOOR * MAP_W, FLOOR * MAP_W + MAP_W);
    expect(floorTiles.some((v) => v === 0)).toBe(true);
    expect(floorTiles.filter((v) => v > 0).length).toBeGreaterThan(50);
  });
});
