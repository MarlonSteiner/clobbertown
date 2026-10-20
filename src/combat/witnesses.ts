import { COMBAT } from '../config/tuning';
import type { Positioned } from '../interaction/proximity';

/**
 * The residents close enough to have seen something happen at `at`.
 *
 * This is the input to gossip. An event nobody witnessed cannot spread, so
 * who counts as a witness decides what the town ends up knowing about you.
 * Phase 2 uses distance alone; Phase 3 should add line of sight, so that a
 * punch thrown behind the bakery stays a secret.
 */
export function findWitnesses(
  at: { x: number; z: number },
  residents: readonly Positioned[],
): string[] {
  return residents
    .filter((resident) => {
      const distance = Math.hypot(resident.position.x - at.x, resident.position.z - at.z);
      return distance <= COMBAT.witnessRange;
    })
    .map((resident) => resident.id);
}
