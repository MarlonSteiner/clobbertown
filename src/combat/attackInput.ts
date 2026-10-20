import { COMBAT } from '../config/tuning';
import type { InputState } from '../input/InputState';
import { isStale } from '../input/buffer';
import type { AttackTimeline } from './AttackTimeline';

/**
 * Turns a buffered punch request into a punch, if the timing allows.
 *
 * A request survives for `punchBufferSeconds`, so a press that lands just
 * before the previous punch's cooldown ends is honoured instead of swallowed;
 * mashing then produces a steady rhythm rather than dropped inputs. Requests
 * made while paused are thrown away, so a click on the pause screen is not
 * stored up and fired the moment play resumes.
 *
 * The buffer is counted from the last frame, not from now. On a slow frame
 * longer than the buffer itself, measuring from now would expire a press
 * before the game had looked at it even once; see `isStale`.
 */
export function handleAttackInput(
  input: InputState,
  attack: AttackTimeline,
  now: number,
  previousFrameAt: number,
  yaw: number,
  paused: boolean,
): void {
  const requestedAt = input.attackRequestedAt;
  if (requestedAt === null) return;

  if (paused || isStale(requestedAt, previousFrameAt, COMBAT.punchBufferSeconds)) {
    input.attackRequestedAt = null;
    return;
  }

  if (attack.tryStart(now, yaw)) input.attackRequestedAt = null;
}
