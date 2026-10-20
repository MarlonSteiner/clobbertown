import { describe, expect, it } from 'vitest';
import { findPunchTargets } from './reach';
import { COMBAT } from '../config/tuning';

const origin = { x: 0, z: 0 };
const target = (id: string, x: number, z: number) => ({ id, position: { x, z } });

describe('findPunchTargets', () => {
  it('hits a target straight ahead and in reach', () => {
    // Yaw 0 faces down -Z.
    expect(findPunchTargets(origin, 0, [target('d', 0, -1)])).toEqual(['d']);
  });

  it('misses a target behind the player', () => {
    expect(findPunchTargets(origin, 0, [target('d', 0, 1)])).toEqual([]);
  });

  it('misses a target that is in front but out of reach', () => {
    expect(findPunchTargets(origin, 0, [target('d', 0, -(COMBAT.punchReach + 0.1))])).toEqual([]);
  });

  it('forgives aim that is a little off', () => {
    // Half the arc off-centre should still connect.
    const angle = COMBAT.punchArc / 2;
    const d = target('d', -Math.sin(angle), -Math.cos(angle));
    expect(findPunchTargets(origin, 0, [d])).toEqual(['d']);
  });

  it('does not hit something off to the side', () => {
    expect(findPunchTargets(origin, 0, [target('d', 1, 0)])).toEqual([]);
  });

  it('follows the direction the punch was thrown in', () => {
    // A quarter turn faces down -X, so a target there is now in front.
    expect(findPunchTargets(origin, Math.PI / 2, [target('d', -1, 0)])).toEqual(['d']);
  });

  it('can hit several targets with one punch', () => {
    const hits = findPunchTargets(origin, 0, [target('a', -0.3, -1), target('b', 0.3, -1)]);
    expect(hits.sort()).toEqual(['a', 'b']);
  });

  it('counts a target the player is standing inside', () => {
    expect(findPunchTargets(origin, 0, [target('d', 0, 0)])).toEqual(['d']);
  });
});
