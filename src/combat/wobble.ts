import { COMBAT } from '../config/tuning';

/**
 * How far a dummy is leaning and how fast that is changing.
 *
 * Lean is a 2D vector on the ground plane: its direction is the way the top of
 * the dummy is tipping, and its length is the tilt in radians. Two axes rather
 * than one, because a dummy hit from the side should rock sideways.
 */
export interface Wobble {
  leanX: number;
  leanZ: number;
  velocityX: number;
  velocityZ: number;
}

export function createWobble(): Wobble {
  return { leanX: 0, leanZ: 0, velocityX: 0, velocityZ: 0 };
}

/** Longest step the spring integrates in one go; longer frames are clamped. */
const MAX_STEP = 1 / 30;

/**
 * Shoves the dummy away from the punch.
 *
 * `directionX`/`directionZ` should point from the puncher to the dummy, so the
 * dummy leans away from whoever hit it.
 */
export function applyHit(wobble: Wobble, directionX: number, directionZ: number): void {
  wobble.velocityX += directionX * COMBAT.dummyHitImpulse;
  wobble.velocityZ += directionZ * COMBAT.dummyHitImpulse;
}

/**
 * Advances the spring that rights the dummy, in place.
 *
 * A damped spring rather than a real physics body: a simulated dummy gets
 * knocked across the square or wedged in a wall, while a spring always comes
 * back to where it started and still reads as having been hit hard.
 *
 * Semi-implicit Euler, which stays stable at the stiffnesses used here. The
 * step is clamped so a long frame cannot fling the spring past the point of no
 * return.
 */
export function stepWobble(wobble: Wobble, deltaSeconds: number): void {
  const dt = Math.min(deltaSeconds, MAX_STEP);

  const accelX = -COMBAT.dummyStiffness * wobble.leanX - COMBAT.dummyDamping * wobble.velocityX;
  const accelZ = -COMBAT.dummyStiffness * wobble.leanZ - COMBAT.dummyDamping * wobble.velocityZ;

  wobble.velocityX += accelX * dt;
  wobble.velocityZ += accelZ * dt;
  wobble.leanX += wobble.velocityX * dt;
  wobble.leanZ += wobble.velocityZ * dt;

  // Cap the lean, so a flurry of punches rocks the dummy hard without folding
  // it flat into the cobbles.
  const lean = Math.hypot(wobble.leanX, wobble.leanZ);
  if (lean > COMBAT.dummyMaxTilt) {
    const scale = COMBAT.dummyMaxTilt / lean;
    wobble.leanX *= scale;
    wobble.leanZ *= scale;
    // Kill the outward motion at the stop, as if it hit the end of its post.
    wobble.velocityX *= scale * 0.5;
    wobble.velocityZ *= scale * 0.5;
  }
}

/**
 * Tilts a dummy's pivot so its top leans the way the wobble says.
 *
 * The wobble is in world space, but the pivot sits inside a group rotated by
 * the dummy's `facing`, so the lean is first expressed in that rotated frame.
 * Rotating about Y by θ maps local (x, z) to world (x cosθ + z sinθ,
 * −x sinθ + z cosθ); this applies the inverse. Getting it backwards makes a
 * dummy lean towards whoever hit it, which is why it is tested against real
 * Three.js transforms rather than reasoned about.
 */
export function applyLeanToPivot(
  pivot: { rotation: { x: number; z: number } },
  wobble: Wobble,
  facing: number,
): void {
  const cos = Math.cos(facing);
  const sin = Math.sin(facing);
  const localX = wobble.leanX * cos - wobble.leanZ * sin;
  const localZ = wobble.leanX * sin + wobble.leanZ * cos;

  // Rotating about X tips the top towards +Z; about Z, towards −X.
  pivot.rotation.x = localZ;
  pivot.rotation.z = -localX;
}
