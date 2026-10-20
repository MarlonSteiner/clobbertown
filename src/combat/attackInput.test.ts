import { describe, expect, it } from 'vitest';
import { handleAttackInput } from './attackInput';
import { AttackTimeline } from './AttackTimeline';
import { createInputState } from '../input/InputState';
import { COMBAT } from '../config/tuning';

/** One frame at 60fps. */
const FRAME = 1 / 60;

describe('handleAttackInput', () => {
  it('throws a punch on a fresh request', () => {
    const input = createInputState();
    const attack = new AttackTimeline();
    input.attackRequestedAt = 10;

    handleAttackInput(input, attack, 10 + FRAME, 10, 0, false);

    expect(attack.count).toBe(1);
    expect(input.attackRequestedAt).toBeNull();
  });

  it('holds a request made during the cooldown and fires it when allowed', () => {
    const input = createInputState();
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);

    // Pressed just before the cooldown ends: not yet.
    const pressedAt = 10 + COMBAT.punchCooldown - 0.05;
    input.attackRequestedAt = pressedAt;
    handleAttackInput(input, attack, pressedAt + FRAME, pressedAt, 0, false);
    expect(input.attackRequestedAt).toBe(pressedAt);

    // The cooldown ends while the request is still fresh.
    const later = 10 + COMBAT.punchCooldown;
    handleAttackInput(input, attack, later, later - FRAME, 0, false);
    expect(attack.count).toBe(2);
  });

  it('drops a request the game has seen and let wait too long', () => {
    const input = createInputState();
    const attack = new AttackTimeline();
    attack.tryStart(10, 0);
    input.attackRequestedAt = 10.01;

    // Still in cooldown, and by the previous frame the buffer had run out.
    const now = 10.01 + COMBAT.punchBufferSeconds + 0.1;
    handleAttackInput(input, attack, now, now - FRAME, 0, false);

    expect(input.attackRequestedAt).toBeNull();
    expect(attack.count).toBe(1);
  });

  it('honours a press made during one very slow frame', () => {
    // A frame lasting longer than the whole buffer. The press arrived mid-frame
    // and the game has not looked at it yet, so it must still count.
    const input = createInputState();
    const attack = new AttackTimeline();
    input.attackRequestedAt = 10.1;

    handleAttackInput(input, attack, 10.6, 10, 0, false);

    expect(attack.count).toBe(1);
  });

  it('discards requests made while paused', () => {
    const input = createInputState();
    const attack = new AttackTimeline();
    input.attackRequestedAt = 10;

    handleAttackInput(input, attack, 10 + FRAME, 10, 0, true);

    expect(input.attackRequestedAt).toBeNull();
    expect(attack.count).toBe(0);
  });
});
