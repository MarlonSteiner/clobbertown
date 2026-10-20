import { describe, expect, it } from 'vitest';
import { DUMMIES } from './dummies';
import { NPCS } from '../npc/roster';
import { SPAWN } from '../player/spawn';
import { SQUARE_SIZE } from '../scene/layout';
import { COMBAT } from '../config/tuning';

/** Room needed around a dummy so a player can walk round it and swing at it. */
const CLEARANCE = 2.5;

const distance = (a: readonly [number, number], b: readonly [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('dummy placement', () => {
  it('gives every dummy a unique id', () => {
    const ids = DUMMIES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps dummies on the square, where there is open ground to fight on', () => {
    for (const dummy of DUMMIES) {
      const [x, z] = dummy.position;
      expect(Math.abs(x), `${dummy.id} is off the square`).toBeLessThan(SQUARE_SIZE / 2);
      expect(Math.abs(z), `${dummy.id} is off the square`).toBeLessThan(SQUARE_SIZE / 2);
    }
  });

  it('keeps dummies clear of the spawn point', () => {
    const spawn: [number, number] = [SPAWN[0], SPAWN[2]];
    for (const dummy of DUMMIES) {
      expect(distance(dummy.position, spawn), `${dummy.id} is on the spawn point`)
        .toBeGreaterThan(CLEARANCE);
    }
  });

  it('keeps dummies out of the residents’ way', () => {
    for (const dummy of DUMMIES) {
      for (const npc of NPCS) {
        expect(distance(dummy.position, npc.position), `${dummy.id} crowds ${npc.identity.id}`)
          .toBeGreaterThan(CLEARANCE);
      }
    }
  });

  it('spaces dummies so you can walk between them', () => {
    for (let i = 0; i < DUMMIES.length; i++) {
      for (let j = i + 1; j < DUMMIES.length; j++) {
        const a = DUMMIES[i];
        const b = DUMMIES[j];
        if (!a || !b) continue;
        expect(distance(a.position, b.position), `${a.id} and ${b.id} are too close`)
          .toBeGreaterThan(CLEARANCE);
      }
    }
  });

  it('puts every dummy where at least one resident can see it hit', () => {
    // The point of Phase 2's dummies is that hitting them is noticed.
    for (const dummy of DUMMIES) {
      const seen = NPCS.some((npc) => distance(dummy.position, npc.position) <= COMBAT.witnessRange);
      expect(seen, `nobody can see ${dummy.id}`).toBe(true);
    }
  });
});
