import { PLAYER } from '../config/tuning';
import { isStale } from '../input/buffer';
import type { InputState } from '../input/InputState';

/**
 * Whether a buffered jump should fire this frame. Clears the request when it
 * is used, when it goes stale, or when the game is paused.
 *
 * Two forgiveness windows meet here. Coyote time lets a jump count for a moment
 * after walking off a ledge; the jump buffer lets a press made just before
 * landing fire on touchdown instead of being swallowed. Without either, jumps
 * feel unreliable even when the player's timing was nearly right.
 */
export function shouldJump(
  input: InputState,
  now: number,
  previousFrameAt: number,
  lastGroundedAt: number,
  paused: boolean,
): boolean {
  const requestedAt = input.jumpRequestedAt;
  if (requestedAt === null) return false;

  // Dropped rather than held while paused, so a press on the pause screen is
  // not fired the moment play resumes.
  if (paused || isStale(requestedAt, previousFrameAt, PLAYER.jumpBufferSeconds)) {
    input.jumpRequestedAt = null;
    return false;
  }

  if (now - lastGroundedAt > PLAYER.coyoteTimeSeconds) return false;

  input.jumpRequestedAt = null;
  return true;
}
