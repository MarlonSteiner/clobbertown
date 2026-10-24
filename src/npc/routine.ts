import { ROUTINE, CLOCK } from '../config/tuning';
import { facingAngle } from '../player/movement';

/** A point on the ground plane. */
export type Waypoint = [x: number, z: number];

/**
 * One block of a resident's day.
 *
 * From `from` to `to` (hours, 0 to 24) the resident stands at `stands`. If that
 * is a different place from the block before, they walk there starting at
 * `from`, passing through `via` on the way. Walking takes real time, so the
 * route is tested to finish inside its block.
 */
export interface ScheduleEntry {
  from: number;
  to: number;
  stands: Waypoint;
  via?: Waypoint[];
}

export interface Pose {
  x: number;
  z: number;
  /** Yaw the model should face, in the same convention as the player. */
  facing: number;
  /** Whether they are walking, which picks the walk cycle over idling. */
  moving: boolean;
}

/** Real seconds a walk of this many metres takes, converted to game hours. */
export function walkHours(metres: number): number {
  const realSeconds = metres / ROUTINE.walkSpeed;
  return realSeconds * (24 / CLOCK.dayLengthSeconds);
}

/** The points a walk passes through, from where the block before ends to where this one stands. */
export function legsOf(entries: readonly ScheduleEntry[], index: number): Waypoint[] {
  const entry = entries[index];
  const before = entries[(index - 1 + entries.length) % entries.length];
  if (!entry || !before) return [];
  return [before.stands, ...(entry.via ?? []), entry.stands];
}

/** Total length of a polyline of legs, in metres. */
export function lengthOf(legs: readonly Waypoint[]): number {
  let total = 0;
  for (let i = 1; i < legs.length; i++) {
    const a = legs[i - 1];
    const b = legs[i];
    if (a && b) total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

/**
 * Where a resident is at `hour`, given their day.
 *
 * A pure function of the schedule and the time, with no memory of earlier
 * frames, so the same hour always gives the same place. That is what lets the
 * whole day be tested, and what keeps a resident in the right spot after a
 * reload.
 */
export function poseAt(
  entries: readonly ScheduleEntry[],
  hour: number,
  defaultFacing: number,
): Pose {
  const index = entries.findIndex((entry) => hour >= entry.from && hour < entry.to);
  const entry = entries[index === -1 ? 0 : index];
  if (!entry) return { x: 0, z: 0, facing: defaultFacing, moving: false };

  const legs = legsOf(entries, index === -1 ? 0 : index);
  const total = lengthOf(legs);
  const walkTime = walkHours(total);
  const elapsed = hour - entry.from;

  if (legs.length < 2 || total === 0 || elapsed >= walkTime) {
    // Arrived, or never needed to walk: standing still, facing the way they
    // came in if they walked, or their default otherwise.
    const last = legs.length >= 2 ? legs[legs.length - 2] : undefined;
    const facing =
      last && total > 0 ? yawOf(last, entry.stands) : defaultFacing;
    return { x: entry.stands[0], z: entry.stands[1], facing, moving: false };
  }

  return walkPose(legs, (elapsed / walkTime) * total);
}

/** The point and heading a given distance along a polyline. */
function walkPose(legs: readonly Waypoint[], distance: number): Pose {
  let travelled = 0;
  for (let i = 1; i < legs.length; i++) {
    const a = legs[i - 1];
    const b = legs[i];
    if (!a || !b) continue;
    const segment = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (travelled + segment >= distance || i === legs.length - 1) {
      const along = segment === 0 ? 0 : Math.min(1, (distance - travelled) / segment);
      return {
        x: a[0] + (b[0] - a[0]) * along,
        z: a[1] + (b[1] - a[1]) * along,
        facing: yawOf(a, b),
        moving: true,
      };
    }
    travelled += segment;
  }
  const end = legs[legs.length - 1] ?? [0, 0];
  return { x: end[0], z: end[1], facing: 0, moving: true };
}

/** The yaw that faces from `from` towards `to`. */
function yawOf(from: Waypoint, to: Waypoint): number {
  return facingAngle({ x: to[0] - from[0], z: to[1] - from[1] });
}
