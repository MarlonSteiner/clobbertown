import type { Positioned } from '../interaction/proximity';
import { yawToward } from '../player/movement';
import { SPAWN } from '../player/spawn';

export interface DummySpec {
  id: string;
  /** Where it stands, on the ground plane. */
  position: [x: number, z: number];
  /** Which way the painted target faces, in radians. */
  facing: number;
}

/** Turned towards where the player starts, so the painted target greets them. */
const towardSpawn = (x: number, z: number) => yawToward([x, z], [SPAWN[0], SPAWN[2]]);

/**
 * The training dummies, on the west side of the square.
 *
 * Placed in view of the spawn point, so the first thing a player sees is
 * something to hit, and inside Gertie's sight, so hitting them is noticed.
 * `dummies.test.ts` checks they keep clear of the spawn point, of each other
 * and of the residents.
 */
export const DUMMIES: DummySpec[] = [
  { id: 'dummy-a', position: [-3, 3], facing: towardSpawn(-3, 3) },
  { id: 'dummy-b', position: [-6.5, 0.5], facing: towardSpawn(-6.5, 0.5) },
  { id: 'dummy-c', position: [-4, -3], facing: towardSpawn(-4, -3) },
];

/** The dummies in the flat shape the hit test wants, computed once. */
export const DUMMY_TARGETS: Positioned[] = DUMMIES.map((dummy) => ({
  id: dummy.id,
  position: { x: dummy.position[0], z: dummy.position[1] },
}));
