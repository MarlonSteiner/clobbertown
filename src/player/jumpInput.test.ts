import { describe, expect, it } from 'vitest';
import { shouldJump } from './jumpInput';
import { createInputState } from '../input/InputState';
import { PLAYER } from '../config/tuning';

const FRAME = 1 / 60;

describe('shouldJump', () => {
  it('jumps from the ground on a fresh press', () => {
    const input = createInputState();
    input.jumpRequestedAt = 10;
    expect(shouldJump(input, 10 + FRAME, 10, 10, false)).toBe(true);
    expect(input.jumpRequestedAt).toBeNull();
  });

  it('still jumps just after walking off a ledge', () => {
    const input = createInputState();
    input.jumpRequestedAt = 10;
    expect(shouldJump(input, 10, 10 - FRAME, 10 - PLAYER.coyoteTimeSeconds / 2, false)).toBe(true);
  });

  it('refuses a jump well after leaving the ground', () => {
    const input = createInputState();
    input.jumpRequestedAt = 10;
    expect(shouldJump(input, 10, 10 - FRAME, 10 - PLAYER.coyoteTimeSeconds * 3, false)).toBe(false);
  });

  it('holds a mid-air press so it fires on landing', () => {
    const input = createInputState();
    input.jumpRequestedAt = 10;
    // In the air: not yet.
    expect(shouldJump(input, 10 + FRAME, 10, 0, false)).toBe(false);
    expect(input.jumpRequestedAt).toBe(10);
    // Lands moments later, still inside the buffer.
    const landed = 10 + PLAYER.jumpBufferSeconds / 2;
    expect(shouldJump(input, landed, landed - FRAME, landed, false)).toBe(true);
  });

  it('forgets a press the game has seen and let wait too long', () => {
    const input = createInputState();
    input.jumpRequestedAt = 10;
    const late = 10 + PLAYER.jumpBufferSeconds + 0.1;
    expect(shouldJump(input, late, late - FRAME, 0, false)).toBe(false);
    expect(input.jumpRequestedAt).toBeNull();
  });

  it('honours a press made during one very slow frame', () => {
    const input = createInputState();
    input.jumpRequestedAt = 10.1;
    expect(shouldJump(input, 10.6, 10, 10.6, false)).toBe(true);
  });

  it('discards presses made while paused', () => {
    const input = createInputState();
    input.jumpRequestedAt = 10;
    expect(shouldJump(input, 10 + FRAME, 10, 10, true)).toBe(false);
    expect(input.jumpRequestedAt).toBeNull();
  });
});
