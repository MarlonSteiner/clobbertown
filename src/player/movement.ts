import { PLAYER } from '../config/tuning';

/** A flat, horizontal vector. The character controller never accelerates on Y. */
export interface Vec2 {
  x: number;
  z: number;
}

/**
 * Turns raw key state into a direction of intent, in world space.
 *
 * Input arrives relative to the screen ("forward" means "away from the
 * camera"), so it is rotated by the camera's yaw to become a world direction.
 * The result is normalised, which stops diagonal movement being ~41% faster
 * than movement along an axis.
 */
export function inputToWorldDirection(
  forward: number,
  right: number,
  cameraYaw: number,
): Vec2 {
  const length = Math.hypot(forward, right);
  if (length === 0) return { x: 0, z: 0 };

  const nf = forward / length;
  const nr = right / length;

  // Yaw is measured around the Y axis, with -Z as the camera's forward.
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);

  return {
    x: nf * -sin + nr * cos,
    z: nf * -cos - nr * sin,
  };
}

/**
 * Moves the current horizontal velocity towards what the player is asking for.
 *
 * Accelerating and decelerating at different rates is the whole trick to
 * movement that feels good: the character leans into a run but plants firmly
 * when you let go. Passing an empty direction means "no input", which decays
 * velocity towards zero rather than snapping it there.
 */
export function applyHorizontalAcceleration(
  current: Vec2,
  direction: Vec2,
  topSpeed: number,
  grounded: boolean,
  deltaSeconds: number,
): Vec2 {
  const hasInput = direction.x !== 0 || direction.z !== 0;

  const targetX = direction.x * topSpeed;
  const targetZ = direction.z * topSpeed;

  // Airborne input is damped so a jump largely commits to its arc.
  const control = grounded ? 1 : PLAYER.airControlFactor;
  const rate = (hasInput ? PLAYER.acceleration : PLAYER.deceleration) * control;

  // Cap the step at the remaining distance so a large delta cannot overshoot
  // the target and oscillate. This matters on a frame spike or a slow machine.
  const maxStep = rate * deltaSeconds;

  return {
    x: moveTowards(current.x, targetX, maxStep),
    z: moveTowards(current.z, targetZ, maxStep),
  };
}

/** Moves `value` towards `target` by at most `maxStep`. */
export function moveTowards(value: number, target: number, maxStep: number): number {
  const difference = target - value;
  if (Math.abs(difference) <= maxStep) return target;
  return value + Math.sign(difference) * maxStep;
}

/**
 * The upward velocity needed to reach `PLAYER.jumpHeight` under the player's
 * own gravity. Deriving it means jump height stays honest when gravity is
 * retuned, instead of the two constants drifting apart.
 */
export function jumpVelocity(): number {
  return Math.sqrt(2 * PLAYER.gravity * PLAYER.jumpHeight);
}

/** Integrates gravity for one frame, clamped so falls stay readable. */
export function applyGravity(verticalVelocity: number, deltaSeconds: number): number {
  const next = verticalVelocity - PLAYER.gravity * deltaSeconds;
  return Math.max(next, -PLAYER.terminalVelocity);
}

/**
 * Shortest angular distance from `from` to `to`, wrapped to [-PI, PI].
 * Without the wrap, a character crossing the -PI/PI seam spins the long way round.
 */
export function shortestAngleDelta(from: number, to: number): number {
  const twoPi = Math.PI * 2;
  let delta = (to - from) % twoPi;
  if (delta > Math.PI) delta -= twoPi;
  if (delta < -Math.PI) delta += twoPi;
  return delta;
}

/** Eases `current` towards `target` at `speed`, framerate independently. */
export function damp(
  current: number,
  target: number,
  speed: number,
  deltaSeconds: number,
): number {
  // Exponential decay rather than a fixed lerp factor, so the result does not
  // change when the frame rate does.
  return target + (current - target) * Math.exp(-speed * deltaSeconds);
}

/**
 * The Y rotation that points the character along `velocity`.
 *
 * The model faces -Z at rest, which is Three.js's convention for "forward".
 * Rotating by θ about Y sends that local -Z to world (-sinθ, 0, -cosθ), so
 * recovering θ from a direction means negating both components before the
 * atan2. Getting this wrong points the character exactly backwards, which is
 * why it lives here with a test rather than inline in the render loop.
 */
export function facingAngle(velocity: Vec2): number {
  return Math.atan2(-velocity.x, -velocity.z);
}
