import { COMBAT } from '../config/tuning';

/**
 * The timing of the player's punches: when one may start, whether one is in
 * progress, and the single moment it lands.
 *
 * This is a plain class with no React or Three.js in it, so the rules about
 * cooldowns and impact frames can be tested with a fake clock instead of a
 * browser. Times are in seconds on the frame loop's clock.
 */
export class AttackTimeline {
  private startedAt = -Infinity;
  private hasLanded = true;
  private swingCount = 0;
  private swingYaw = 0;

  /**
   * Starts a punch if the cooldown allows it.
   *
   * `yaw` is the direction the punch is thrown in, captured once at the start
   * so that turning the camera mid-swing does not drag the fist with it.
   * Returns whether a punch actually started.
   */
  tryStart(now: number, yaw: number): boolean {
    if (now - this.startedAt < COMBAT.punchCooldown) return false;

    this.startedAt = now;
    this.hasLanded = false;
    this.swingYaw = yaw;
    this.swingCount += 1;
    return true;
  }

  /** Whether a punch is playing out right now. */
  isSwinging(now: number): boolean {
    return now - this.startedAt < COMBAT.punchDuration;
  }

  /**
   * True on exactly one frame per punch: the first frame at or after the
   * moment of impact. Calling it consumes the impact, so a slow frame rate
   * cannot make a single punch land twice.
   */
  consumeImpact(now: number): boolean {
    if (this.hasLanded) return false;
    if (now - this.startedAt < COMBAT.punchDuration * COMBAT.punchImpactAt) return false;

    this.hasLanded = true;
    return true;
  }

  /** Direction the current punch was thrown in. */
  get yaw(): number {
    return this.swingYaw;
  }

  /**
   * Increments with every punch. The animation uses it to tell a fresh punch
   * from the one already playing, so back-to-back punches each restart the
   * clip instead of the second being swallowed by the first.
   */
  get count(): number {
    return this.swingCount;
  }
}
