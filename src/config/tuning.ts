/**
 * Every number worth feel-testing lives here.
 *
 * The rule for this file: if you would ever want to change a value while
 * playing to see whether the game feels better, it belongs here rather than
 * inline at its use site. Values are in metres, seconds, and radians unless
 * a name says otherwise.
 */

export const PLAYER = {
  /** Capsule half-height, excluding the two hemisphere caps. */
  capsuleHalfHeight: 0.45,
  capsuleRadius: 0.35,

  /** Top speed while walking, in metres per second. */
  walkSpeed: 4.5,
  /** Top speed while holding sprint. */
  sprintSpeed: 8.0,

  /**
   * How fast the player reaches top speed, and how fast they shed it.
   * Deceleration is deliberately higher than acceleration: a character that
   * stops crisply feels responsive, while one that accelerates instantly
   * feels weightless.
   */
  acceleration: 45,
  deceleration: 60,
  /** Air control is a fraction of ground acceleration, so jumps commit. */
  airControlFactor: 0.35,

  /** Peak height of a standing jump, used to derive the launch velocity. */
  jumpHeight: 1.4,
  /** Gravity applied to the player specifically, kept separate from world gravity. */
  gravity: 26,
  /** Downward speed cap, so long falls stay readable rather than blurring. */
  terminalVelocity: 40,

  /**
   * Grace window after walking off a ledge during which a jump still counts.
   * Standard platformer forgiveness; without it, edge jumps feel broken.
   */
  coyoteTimeSeconds: 0.12,
  /**
   * A jump pressed this long before landing is buffered and fires on touchdown,
   * rather than being swallowed.
   */
  jumpBufferSeconds: 0.15,

  /** How quickly the character model turns to face its direction of travel. */
  turnSpeed: 12,

  /** Steps up to this height are climbed rather than blocked. */
  maxStepHeight: 0.4,
  /** Slopes steeper than this are treated as walls, in degrees. */
  maxSlopeClimbDegrees: 50,
  /** Below this speed the character is treated as stopped, killing float. */
  idleSpeedThreshold: 0.05,
} as const;

export const CAMERA = {
  /** Distance the camera trails behind the player. */
  distance: 7.5,
  /** Height of the camera's look-at target above the player's feet. */
  targetHeight: 1.3,

  /**
   * Time for the camera to cover roughly 63% of the distance to its goal.
   * Lower is snappier, higher is floatier. Position lags slightly behind
   * rotation so the camera feels like it is following rather than bolted on.
   */
  positionSmoothTime: 0.12,
  rotationSmoothTime: 0.08,

  /** Mouse sensitivity, in radians of rotation per pixel of movement. */
  lookSensitivity: 0.0025,
  /**
   * Vertical look limits. Stopping short of straight up and straight down
   * avoids the gimbal flip you get at the poles.
   */
  minPitch: -0.6,
  maxPitch: 1.2,
  /** Starting pitch: slightly above the player, looking gently down. */
  initialPitch: 0.25,

  fov: 55,
  near: 0.1,
  far: 300,
} as const;

export const WORLD = {
  /** The town occupies a square this many units on a side, centred on the origin. */
  size: 100,
  /** Downward acceleration applied by the physics world to everything but the player. */
  gravity: -9.81,
  /** Height of the invisible wall ringing the town. */
  boundaryHeight: 8,
  /** Thickness of that wall. Thin walls let fast movers tunnel through. */
  boundaryThickness: 2,
} as const;

export const INTERACTION = {
  /** How close the player must stand before an NPC can be talked to. */
  range: 3.0,
  /**
   * Once talking, the player can drift this much further before the
   * conversation breaks off. The gap stops dialogue flickering when you
   * stand exactly on the range boundary.
   */
  rangeHysteresis: 0.75,
} as const;
