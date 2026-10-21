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

  /**
   * How tall the character model stands. Derived from the collider rather than
   * set independently, so the visible body and the thing that actually bumps
   * into walls can never drift apart.
   */
  get modelHeight(): number {
    return this.capsuleHalfHeight * 2 + this.capsuleRadius * 2;
  },
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

export const COMBAT = {
  /**
   * How long a punch takes from wind-up to recovery. The source animation is
   * 0.75s, which feels sluggish in a brawler, so it is played faster to fit.
   */
  punchDuration: 0.42,
  /**
   * When the fist connects, as a fraction of the punch. Hits are resolved on
   * this one frame rather than across the whole swing, so a punch can only
   * land once and the hit lines up with the arm being extended.
   */
  punchImpactAt: 0.45,
  /**
   * Minimum time between punches. Slightly longer than the punch itself, so
   * mashing the button produces a rhythm rather than a blur.
   */
  punchCooldown: 0.5,
  /** A punch pressed this long before the last one ends is queued, not dropped. */
  punchBufferSeconds: 0.2,
  /** Movement speed while swinging, as a fraction of normal. Plants the feet. */
  punchMoveFactor: 0.3,

  /**
   * How far a punch reaches, measured between the centres of the puncher and
   * the target. Generous on purpose: a punch that visibly touches and does not
   * count feels worse than one that counts from a hair too far away.
   */
  punchReach: 1.7,
  /**
   * Half-width of the cone a punch covers, in radians either side of where the
   * player is facing. Wide enough that you do not have to aim precisely.
   */
  punchArc: 1.0,

  /** How hard a hit shoves a dummy, in radians per second of tilt. */
  dummyHitImpulse: 5.5,
  /** Spring stiffness pulling a dummy upright. Higher wobbles faster. */
  dummyStiffness: 70,
  /** How quickly the wobble dies away. Lower lets it rock for longer. */
  dummyDamping: 5,
  /** Furthest a dummy can lean, so a flurry of hits cannot fold it flat. */
  dummyMaxTilt: 0.75,
  /** How long a hit dummy flashes, in seconds. */
  dummyFlashSeconds: 0.12,

  /**
   * How long everything involved in a hit freezes when a punch connects. The
   * single biggest contributor to a hit feeling heavy: the eye registers the
   * impact during the hold. Around 50 to 100ms reads as a solid hit; much
   * longer starts to feel like the game stuttered.
   */
  hitstopSeconds: 0.07,

  /** Strength of the camera shake on a landed punch, in metres of offset. */
  cameraShakeStrength: 0.12,
  /** How quickly the shake settles. Higher is a sharper, shorter jolt. */
  cameraShakeDecay: 14,

  /**
   * How far away a resident can be and still see a punch land. Distance only
   * for now; Phase 3 will want line of sight, so a wall blocks a witness.
   */
  witnessRange: 18,
} as const;

export const GOSSIP = {
  /**
   * How long news takes to pass from one resident to a neighbour. Short, so a
   * playtest can watch it travel; a real game would want minutes, not seconds.
   */
  hopDelaySeconds: 30,
  /**
   * How many retellings news survives before nobody bothers passing it on.
   * Keeps a punch on one side of town from becoming common knowledge everywhere.
   */
  maxHops: 3,
} as const;
