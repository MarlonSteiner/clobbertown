import { PLAYER } from '../config/tuning';
import type { CharacterAnimation } from '../scene/CharacterModel';

/**
 * Picks the clip that matches what the player is doing.
 *
 * A punch outranks everything, including being airborne: the player asked for
 * it, and a jump clip playing over a punch that lands would hide the hit.
 *
 * The run threshold sits above walking speed rather than at it, so holding
 * sprint against a wall, or the brief moment while speed ramps up, does not
 * flicker between the walk and run cycles.
 */
export function chooseAnimation(
  speed: number,
  grounded: boolean,
  swinging: boolean,
): CharacterAnimation {
  if (swinging) return 'Punch';
  if (!grounded) return 'Jump';
  if (speed <= PLAYER.idleSpeedThreshold) return 'Idle';
  if (speed > PLAYER.walkSpeed * 1.1) return 'Run';
  return 'Walk';
}
