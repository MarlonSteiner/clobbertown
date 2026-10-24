import { describe, expect, it } from 'vitest';
import { RESIDENTS } from './residents.ts';
import { walkHours, legsOf, lengthOf, type Waypoint } from './routine.ts';
import { BUILDINGS, TREES, plotBounds, type PlotBounds } from '../scene/layout.ts';
import { WORLD } from '../config/tuning.ts';

/**
 * Checks every resident's day, so hand-written routes cannot walk anyone
 * through a building, a tree, or the edge of town, and every walk finishes
 * before the block it belongs to ends.
 */

/** Extra room a walker keeps from a building wall, in metres. */
const WALL_MARGIN = 0.8;
/** Extra room a walker keeps from a tree trunk, in metres. */
const TREE_MARGIN = 1.2;
/** How finely routes are sampled when checking them against obstacles. */
const STEP = 0.2;

/** Whether a point is closer than `margin` to a building plot. */
function nearPlot(x: number, z: number, plot: PlotBounds, margin: number): boolean {
  const dx = Math.max(plot.minX - x, 0, x - plot.maxX);
  const dz = Math.max(plot.minZ - z, 0, z - plot.maxZ);
  return Math.hypot(dx, dz) < margin;
}

/** Every point along a polyline, sampled every STEP metres. */
function samplePath(legs: readonly Waypoint[]): Waypoint[] {
  const points: Waypoint[] = [];
  for (let i = 1; i < legs.length; i++) {
    const a = legs[i - 1];
    const b = legs[i];
    if (!a || !b) continue;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const count = Math.max(1, Math.ceil(length / STEP));
    for (let n = 0; n <= count; n++) {
      const t = n / count;
      points.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return points;
}

const plots = BUILDINGS.map((building) => ({ id: building.id, bounds: plotBounds(building) }));
const half = WORLD.size / 2;

describe.each(RESIDENTS.map((r) => [r.identity.id, r] as const))('%s’s day', (_id, resident) => {
  const day = resident.schedule;

  it('covers the whole day with no gaps and no overlaps', () => {
    expect(day[0]?.from).toBe(0);
    expect(day.at(-1)?.to).toBe(24);
    for (let i = 1; i < day.length; i++) {
      expect(day[i]?.from, `block ${i} starts where the last one ended`).toBe(day[i - 1]?.to);
    }
  });

  it('starts and ends at home, so nobody walks at midnight', () => {
    expect(day[0]?.stands).toEqual(resident.home);
    expect(day.at(-1)?.stands).toEqual(resident.home);
  });

  it('finishes every walk before its block ends, so nobody is caught mid-route', () => {
    for (let i = 0; i < day.length; i++) {
      const entry = day[i];
      if (!entry) continue;
      const legs = legsOf(day, i);
      const walk = walkHours(lengthOf(legs));
      expect(walk, `${resident.identity.id}: block ${i} walk is too long`)
        .toBeLessThan(entry.to - entry.from - 0.05);
    }
  });

  it('keeps every stop clear of buildings', () => {
    for (const entry of day) {
      for (const { id, bounds } of plots) {
        expect(
          nearPlot(entry.stands[0], entry.stands[1], bounds, WALL_MARGIN),
          `${resident.identity.id} stands too close to ${id}`,
        ).toBe(false);
      }
    }
  });

  it('keeps every walk clear of buildings', () => {
    for (let i = 0; i < day.length; i++) {
      for (const [x, z] of samplePath(legsOf(day, i))) {
        for (const { id, bounds } of plots) {
          expect(
            nearPlot(x, z, bounds, WALL_MARGIN),
            `${resident.identity.id} walks through ${id} at (${x.toFixed(1)}, ${z.toFixed(1)})`,
          ).toBe(false);
        }
      }
    }
  });

  it('keeps every walk clear of trees', () => {
    for (let i = 0; i < day.length; i++) {
      for (const [x, z] of samplePath(legsOf(day, i))) {
        for (const tree of TREES) {
          const d = Math.hypot(tree.position[0] - x, tree.position[1] - z);
          expect(d, `${resident.identity.id} walks into ${tree.id}`).toBeGreaterThan(TREE_MARGIN);
        }
      }
    }
  });

  it('stays inside the town', () => {
    for (let i = 0; i < day.length; i++) {
      for (const [x, z] of samplePath(legsOf(day, i))) {
        expect(Math.abs(x)).toBeLessThan(half);
        expect(Math.abs(z)).toBeLessThan(half);
      }
    }
  });
});
