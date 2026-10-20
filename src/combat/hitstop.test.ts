import { beforeEach, describe, expect, it } from 'vitest';
import { isFrozen, resetHitstop, triggerHitstop } from './hitstop';
import { COMBAT } from '../config/tuning';

beforeEach(() => resetHitstop());

describe('hitstop', () => {
  it('is not frozen until something triggers it', () => {
    expect(isFrozen(100)).toBe(false);
  });

  it('freezes for the configured moment and then lets go', () => {
    triggerHitstop(10);
    expect(isFrozen(10)).toBe(true);
    expect(isFrozen(10 + COMBAT.hitstopSeconds / 2)).toBe(true);
    expect(isFrozen(10 + COMBAT.hitstopSeconds + 1e-6)).toBe(false);
  });

  it('extends a freeze when a second hit lands during it', () => {
    triggerHitstop(10);
    triggerHitstop(10 + COMBAT.hitstopSeconds / 2);
    expect(isFrozen(10 + COMBAT.hitstopSeconds + 0.01)).toBe(true);
  });

  it('never cuts a freeze short', () => {
    triggerHitstop(10);
    // A trigger stamped earlier than the current one must not shorten it.
    triggerHitstop(9);
    expect(isFrozen(10 + COMBAT.hitstopSeconds / 2)).toBe(true);
  });
});
