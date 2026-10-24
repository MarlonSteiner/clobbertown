import { CLOCK } from '../config/tuning';

/**
 * The town's time of day, in hours from 0 to 24.
 *
 * Measured from when the page loaded, so it runs whether or not the player is
 * paused. The maths is kept pure and separate from the clock itself, so the
 * day's rollover and its wording can be tested without waiting for a day.
 */
export function hourAt(elapsedSeconds: number): number {
  const hours = CLOCK.startHour + (elapsedSeconds / CLOCK.dayLengthSeconds) * 24;
  return ((hours % 24) + 24) % 24;
}

const startedAt = performance.now() / 1000;

/** The hour right now, from 0 to 24. */
export function currentHour(): number {
  return hourAt(performance.now() / 1000 - startedAt);
}

/** Readable time, like "9:05 am", for the corner of the screen. */
export function formatClock(hour: number): string {
  // Rounded, not floored: a float like 9.0833 hours is really 9:05.
  const wholeMinutes = Math.round(hour * 60) % (24 * 60);
  const h24 = Math.floor(wholeMinutes / 60);
  const minute = wholeMinutes % 60;
  const period = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}
