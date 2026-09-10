import { describe, expect, it } from 'vitest';
import { findNearest } from './proximity';
import { INTERACTION } from '../config/tuning';

const npc = { id: 'gertie', position: { x: 0, z: 0 } };
const other = { id: 'smith', position: { x: 2, z: 0 } };

describe('findNearest', () => {
  it('finds nobody when the player is far away', () => {
    expect(findNearest({ x: 50, z: 50 }, [npc], null)).toBeNull();
  });

  it('finds an NPC standing within range', () => {
    expect(findNearest({ x: 1, z: 0 }, [npc], null)).toBe('gertie');
  });

  it('prefers the closer of two candidates', () => {
    expect(findNearest({ x: 1.9, z: 0 }, [npc, other], null)).toBe('smith');
  });

  it('ignores height, so a doorstep does not break reach', () => {
    // Only x/z are passed in at all, which is the point; this guards the shape.
    expect(findNearest({ x: 0.5, z: 0.5 }, [npc], null)).toBe('gertie');
  });

  it('keeps hold of the current target slightly beyond normal range', () => {
    const justOutside = { x: INTERACTION.range + INTERACTION.rangeHysteresis / 2, z: 0 };
    expect(findNearest(justOutside, [npc], null)).toBeNull();
    expect(findNearest(justOutside, [npc], 'gertie')).toBe('gertie');
  });

  it('eventually drops a target that walks far enough away', () => {
    const wellOutside = { x: INTERACTION.range + INTERACTION.rangeHysteresis + 1, z: 0 };
    expect(findNearest(wellOutside, [npc], 'gertie')).toBeNull();
  });

  it('copes with an empty world', () => {
    expect(findNearest({ x: 0, z: 0 }, [], null)).toBeNull();
  });
});
