import { COMBAT } from '../config/tuning';
import type { Positioned } from '../interaction/proximity';

/**
 * Which targets a punch thrown from `origin` in direction `yaw` connects with.
 *
 * A punch covers a cone rather than a line. Precise aim is not the skill this
 * game is testing, and a cone forgives the gap between where the camera points
 * and where the player believes they are punching.
 *
 * Yaw follows the same convention as the camera: 0 faces down -Z.
 */
export function findPunchTargets(
  origin: { x: number; z: number },
  yaw: number,
  targets: readonly Positioned[],
): string[] {
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);

  const hits: string[] = [];
  for (const target of targets) {
    const dx = target.position.x - origin.x;
    const dz = target.position.z - origin.z;
    const distance = Math.hypot(dx, dz);

    if (distance > COMBAT.punchReach) continue;

    // Standing inside a target has no meaningful direction; count it, since
    // the player is clearly trying to hit the thing they are pressed against.
    if (distance === 0) {
      hits.push(target.id);
      continue;
    }

    const cosine = (dx * forwardX + dz * forwardZ) / distance;
    const angle = Math.acos(Math.min(1, Math.max(-1, cosine)));
    if (angle <= COMBAT.punchArc) hits.push(target.id);
  }

  return hits;
}
