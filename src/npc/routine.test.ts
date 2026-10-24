import { describe, expect, it } from 'vitest';
import { legsOf, lengthOf, poseAt, walkHours, type ScheduleEntry } from './routine.ts';
import { ROUTINE, CLOCK } from '../config/tuning.ts';

/** A small day: home, a walk to the shop, and back. */
const DAY: ScheduleEntry[] = [
  { from: 0, to: 8, stands: [0, 0] },
  { from: 8, to: 12, stands: [10, 0], via: [[5, 0]] },
  { from: 12, to: 24, stands: [0, 0], via: [[5, 0]] },
];

describe('walkHours', () => {
  it('turns metres into game hours at the configured walk speed and day length', () => {
    const oneGameHourOfWalking = ROUTINE.walkSpeed * (CLOCK.dayLengthSeconds / 24);
    expect(walkHours(oneGameHourOfWalking)).toBeCloseTo(1);
  });
});

describe('legsOf and lengthOf', () => {
  it('walks from where the last block stood, through via, to where this block stands', () => {
    expect(legsOf(DAY, 1)).toEqual([[0, 0], [5, 0], [10, 0]]);
  });

  it('measures a polyline', () => {
    expect(lengthOf([[0, 0], [3, 4], [3, 10]])).toBeCloseTo(11);
  });
});

describe('poseAt', () => {
  const FACING = 1.5;

  it('stands still at home through the night', () => {
    const pose = poseAt(DAY, 3, FACING);
    expect(pose).toMatchObject({ x: 0, z: 0, moving: false, facing: FACING });
  });

  it('starts walking at the start of a block', () => {
    const pose = poseAt(DAY, 8, FACING);
    expect(pose).toMatchObject({ x: 0, z: 0, moving: true });
  });

  it('is partway along the route part way through the walk', () => {
    const walk = walkHours(lengthOf(legsOf(DAY, 1)));
    const pose = poseAt(DAY, 8 + walk / 2, FACING);
    expect(pose.moving).toBe(true);
    expect(pose.z).toBeCloseTo(0);
    expect(pose.x).toBeGreaterThan(0);
    expect(pose.x).toBeLessThan(10);
  });

  it('faces the way it is walking', () => {
    const pose = poseAt(DAY, 8 + 0.01, FACING);
    // Walking along +X, which is yaw of -PI/2 in the player's convention.
    expect(-Math.sin(pose.facing)).toBeCloseTo(1, 1);
  });

  it('arrives and stands at its destination', () => {
    const walk = walkHours(lengthOf(legsOf(DAY, 1)));
    const pose = poseAt(DAY, 8 + walk + 0.5, FACING);
    expect(pose).toMatchObject({ x: 10, z: 0, moving: false });
  });

  it('is where the last block left them when a new block begins', () => {
    const before = poseAt(DAY, 11.999, FACING);
    const after = poseAt(DAY, 12, FACING);
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeLessThan(1);
  });
});
