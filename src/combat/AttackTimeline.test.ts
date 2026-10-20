import { describe, expect, it } from 'vitest';
import { AttackTimeline } from './AttackTimeline';
import { COMBAT } from '../config/tuning';

const impactTime = COMBAT.punchDuration * COMBAT.punchImpactAt;

describe('AttackTimeline', () => {
  it('starts a punch when nothing is in progress', () => {
    const attack = new AttackTimeline();
    expect(attack.tryStart(10, 0)).toBe(true);
    expect(attack.isSwinging(10)).toBe(true);
  });

  it('refuses a second punch during the cooldown', () => {
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);
    expect(attack.tryStart(10 + COMBAT.punchCooldown / 2, 0)).toBe(false);
  });

  it('allows the next punch once the cooldown has passed', () => {
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);
    expect(attack.tryStart(10 + COMBAT.punchCooldown, 0)).toBe(true);
  });

  it('stops swinging once the punch is over', () => {
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);
    // A hair past the end rather than exactly on it: frame times are arbitrary
    // floats, so the exact boundary is never a meaningful moment to test.
    expect(attack.isSwinging(10 + COMBAT.punchDuration + 1e-6)).toBe(false);
  });

  it('does not land before the fist is extended', () => {
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);
    expect(attack.consumeImpact(10 + impactTime / 2)).toBe(false);
  });

  it('lands exactly once per punch, however many frames follow', () => {
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);

    const landings = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]
      .map((offset) => attack.consumeImpact(10 + offset))
      .filter(Boolean);

    expect(landings).toHaveLength(1);
  });

  it('still lands on a single long frame that skips past the impact moment', () => {
    // At a low frame rate the clock can jump from before impact to after the
    // whole punch in one step. The hit must not be lost.
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);
    expect(attack.consumeImpact(10 + COMBAT.punchDuration * 2)).toBe(true);
  });

  it('never lands before the first punch is thrown', () => {
    expect(new AttackTimeline().consumeImpact(100)).toBe(false);
  });

  it('keeps the direction the punch was thrown in', () => {
    const attack = new AttackTimeline();
    attack.tryStart(10, 1.25);
    expect(attack.yaw).toBe(1.25);
  });

  it('counts punches so each one can restart the animation', () => {
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);
    attack.tryStart(10 + COMBAT.punchCooldown, 0);
    expect(attack.count).toBe(2);
  });
});
