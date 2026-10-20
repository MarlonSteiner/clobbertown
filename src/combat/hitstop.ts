import { COMBAT } from '../config/tuning';

/**
 * The hit freeze: a few hundredths of a second, the instant a punch lands,
 * where the puncher and what they hit hold perfectly still.
 *
 * Fighting games call this hitstop. It is why their hits feel heavy and most
 * hobby brawlers' do not: the eye needs that held frame to register that
 * something connected. The flash and camera shake play during it.
 *
 * Kept as one shared clock rather than threaded through props, because the
 * player, its animation and every dummy all need to ask the same question on
 * the same frame: are we frozen right now? Times are seconds on the same
 * clock as the frame loop.
 */
let frozenUntil = -Infinity;

/** Starts a freeze. A hit landing during one extends it; it never cuts one short. */
export function triggerHitstop(now: number): void {
  frozenUntil = Math.max(frozenUntil, now + COMBAT.hitstopSeconds);
}

export function isFrozen(now: number): boolean {
  return now < frozenUntil;
}

/** Ends any freeze. Exists so tests start from a known state. */
export function resetHitstop(): void {
  frozenUntil = -Infinity;
}
