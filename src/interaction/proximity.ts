import { INTERACTION } from '../config/tuning';

export interface Positioned {
  id: string;
  position: { x: number; z: number };
}

/**
 * Picks the interactable the player is closest to, or null if none is in range.
 *
 * The range test is horizontal only: standing on a doorstep slightly above an
 * NPC should not put them out of reach.
 *
 * `currentTargetId` widens the range for whoever is already targeted. Without
 * that hysteresis, standing exactly on the boundary makes the prompt strobe on
 * and off as the character's idle sway crosses the threshold.
 */
export function findNearest(
  player: { x: number; z: number },
  candidates: readonly Positioned[],
  currentTargetId: string | null,
): string | null {
  let nearestId: string | null = null;
  let nearestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = Math.hypot(
      candidate.position.x - player.x,
      candidate.position.z - player.z,
    );

    const range =
      candidate.id === currentTargetId
        ? INTERACTION.range + INTERACTION.rangeHysteresis
        : INTERACTION.range;

    if (distance <= range && distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = candidate.id;
    }
  }

  return nearestId;
}
