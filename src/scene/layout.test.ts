import { describe, expect, it } from 'vitest';
import {
  BUILDINGS,
  ROAD_WIDTH,
  SQUARE_SIZE,
  TREES,
  plotBounds,
  plotsOverlap,
} from './layout';
import { WORLD } from '../config/tuning';

/**
 * These tests guard the town's arrangement, which is hand-placed data and
 * therefore easy to break by nudging one number. They check the things that
 * are tedious to verify by walking around: that nothing intersects, and that
 * nothing is standing in the road.
 */

const halfTown = WORLD.size / 2;
const halfRoad = ROAD_WIDTH / 2;
const halfSquare = SQUARE_SIZE / 2;

describe('building layout', () => {
  it('gives every building a unique id', () => {
    const ids = BUILDINGS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never overlaps two plots', () => {
    const collisions: string[] = [];

    for (let i = 0; i < BUILDINGS.length; i++) {
      for (let j = i + 1; j < BUILDINGS.length; j++) {
        const a = BUILDINGS[i];
        const b = BUILDINGS[j];
        if (!a || !b) continue;
        if (plotsOverlap(plotBounds(a), plotBounds(b))) collisions.push(`${a.id} / ${b.id}`);
      }
    }

    expect(collisions).toEqual([]);
  });

  it('keeps every building inside the town boundary', () => {
    for (const building of BUILDINGS) {
      const bounds = plotBounds(building);
      expect(bounds.minX, `${building.id} crosses the west edge`).toBeGreaterThan(-halfTown);
      expect(bounds.maxX, `${building.id} crosses the east edge`).toBeLessThan(halfTown);
      expect(bounds.minZ, `${building.id} crosses the north edge`).toBeGreaterThan(-halfTown);
      expect(bounds.maxZ, `${building.id} crosses the south edge`).toBeLessThan(halfTown);
    }
  });

  it('leaves both main roads clear', () => {
    for (const building of BUILDINGS) {
      const bounds = plotBounds(building);
      // High Street runs along z = 0, Mill Road along x = 0. A building is in
      // the way if its plot straddles either centre line's carriageway.
      const blocksHighStreet = bounds.minZ < halfRoad && bounds.maxZ > -halfRoad;
      const blocksMillRoad = bounds.minX < halfRoad && bounds.maxX > -halfRoad;

      expect(blocksHighStreet, `${building.id} is standing in High Street`).toBe(false);
      expect(blocksMillRoad, `${building.id} is standing in Mill Road`).toBe(false);
    }
  });

  it('leaves the central square clear', () => {
    for (const building of BUILDINGS) {
      const bounds = plotBounds(building);
      const inSquare =
        bounds.minX < halfSquare &&
        bounds.maxX > -halfSquare &&
        bounds.minZ < halfSquare &&
        bounds.maxZ > -halfSquare;

      expect(inSquare, `${building.id} is standing on the square`).toBe(false);
    }
  });

  it('points every building at a model file', () => {
    for (const building of BUILDINGS) {
      expect(building.model, `${building.id} has no model`).toMatch(/^buildings\/.+\.glb$/);
    }
  });
});

describe('tree layout', () => {
  it('gives every tree a unique id', () => {
    const ids = TREES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps trees out of the roads, where they would block the way', () => {
    for (const tree of TREES) {
      const [x, z] = tree.position;
      const inHighStreet = Math.abs(z) < halfRoad;
      const inMillRoad = Math.abs(x) < halfRoad;
      expect(inHighStreet && inMillRoad, `${tree.id} is in the crossroads`).toBe(false);
      expect(inHighStreet, `${tree.id} is in High Street`).toBe(false);
      expect(inMillRoad, `${tree.id} is in Mill Road`).toBe(false);
    }
  });

  it('keeps trees off any building plot', () => {
    for (const tree of TREES) {
      const [x, z] = tree.position;
      for (const building of BUILDINGS) {
        const b = plotBounds(building);
        const inside = x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;
        expect(inside, `${tree.id} is growing through ${building.id}`).toBe(false);
      }
    }
  });

  it('keeps trees inside the town', () => {
    for (const tree of TREES) {
      const [x, z] = tree.position;
      expect(Math.abs(x), `${tree.id} is outside the town`).toBeLessThan(halfTown);
      expect(Math.abs(z), `${tree.id} is outside the town`).toBeLessThan(halfTown);
    }
  });

  it('gives every tree a sensible height', () => {
    for (const tree of TREES) {
      expect(tree.height, `${tree.id} is the wrong size`).toBeGreaterThan(2);
      expect(tree.height, `${tree.id} is the wrong size`).toBeLessThan(15);
    }
  });
});
