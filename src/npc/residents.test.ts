import { describe, expect, it } from 'vitest';
import { BUILDINGS, plotBounds } from '../scene/layout';
import { WORLD } from '../config/tuning';
import { RESIDENTS, findResident } from './residents';

/** How far a resident must stand from any building, so they are not inside a wall. */
const CLEARANCE = 1.5;

describe('residents', () => {
  it('gives everyone a unique id', () => {
    const ids = RESIDENTS.map((resident) => resident.identity.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only befriends people who actually live here', () => {
    for (const resident of RESIDENTS) {
      for (const neighbour of resident.neighbours) {
        expect(findResident(neighbour), `${resident.identity.id} knows a stranger, ${neighbour}`).toBeDefined();
      }
    }
  });

  it('makes every friendship mutual, so gossip can travel both ways', () => {
    for (const resident of RESIDENTS) {
      for (const neighbour of resident.neighbours) {
        expect(
          findResident(neighbour)?.neighbours,
          `${resident.identity.id} talks to ${neighbour}, but not the other way round`,
        ).toContain(resident.identity.id);
      }
    }
  });

  it('leaves nobody without anyone to talk to, or news could never reach them', () => {
    if (RESIDENTS.length < 2) return;
    for (const resident of RESIDENTS) {
      expect(resident.neighbours.length, `${resident.identity.id} has no friends`).toBeGreaterThan(0);
    }
  });

  it('houses everyone inside the town', () => {
    const half = WORLD.size / 2;
    for (const { identity, home } of RESIDENTS) {
      expect(Math.abs(home[0]), `${identity.id} lives outside town`).toBeLessThan(half);
      expect(Math.abs(home[1]), `${identity.id} lives outside town`).toBeLessThan(half);
    }
  });

  it('keeps everyone clear of the buildings', () => {
    for (const { identity, home } of RESIDENTS) {
      for (const building of BUILDINGS) {
        const plot = plotBounds(building);
        const dx = Math.max(plot.minX - home[0], 0, home[0] - plot.maxX);
        const dz = Math.max(plot.minZ - home[1], 0, home[1] - plot.maxZ);
        expect(Math.hypot(dx, dz), `${identity.id} is standing in ${building.id}`).toBeGreaterThanOrEqual(CLEARANCE);
      }
    }
  });

  it('gives everyone something to say without a language model', () => {
    for (const { identity, smallTalk, reactions } of RESIDENTS) {
      expect(smallTalk.length, `${identity.id} has no small talk`).toBeGreaterThan(0);
      expect(reactions.length, `${identity.id} has no reactions`).toBeGreaterThan(0);
    }
  });
});
