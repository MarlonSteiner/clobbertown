import type { RefObject } from 'react';
import { COMBAT } from '../config/tuning';
import { DUMMY_TARGETS } from './dummies';
import { reportHit } from './dummyHits';
import { findPunchTargets } from './reach';

/**
 * Works out what a landed punch did, and tells everything that cares.
 *
 * This is the one place a punch's consequences are decided, which keeps the
 * player controller ignorant of what exists in the world to be hit. Returns
 * the ids of whatever was struck.
 */
export function resolvePunch(
  origin: { x: number; z: number },
  yaw: number,
  cameraShake: RefObject<number>,
): string[] {
  const struck = findPunchTargets(origin, yaw, DUMMY_TARGETS);
  // A punch at thin air does nothing: no shake, no flinch. Feedback that
  // fires on a miss trains the player to stop trusting it.
  if (struck.length === 0) return struck;

  for (const id of struck) {
    const target = DUMMY_TARGETS.find((dummy) => dummy.id === id);
    if (!target) continue;
    reportHit(id, directionFrom(origin, target.position, yaw));
  }

  cameraShake.current = COMBAT.cameraShakeStrength;
  return struck;
}

/**
 * Unit vector from the puncher to the target on the ground plane. Falls back
 * to the punch direction when the two are on top of each other, where the
 * vector between them has no direction to speak of.
 */
function directionFrom(
  origin: { x: number; z: number },
  target: { x: number; z: number },
  yaw: number,
) {
  const dx = target.x - origin.x;
  const dz = target.z - origin.z;
  const length = Math.hypot(dx, dz);
  if (length < 1e-6) return { directionX: -Math.sin(yaw), directionZ: -Math.cos(yaw) };
  return { directionX: dx / length, directionZ: dz / length };
}
