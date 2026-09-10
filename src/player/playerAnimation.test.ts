import { describe, expect, it } from 'vitest';
import { chooseAnimation } from './playerAnimation';
import { PLAYER } from '../config/tuning';

describe('chooseAnimation', () => {
  it('idles when standing still', () => {
    expect(chooseAnimation(0, true)).toBe('Idle');
  });

  it('still idles at the tiny speeds that never quite reach zero', () => {
    expect(chooseAnimation(PLAYER.idleSpeedThreshold, true)).toBe('Idle');
  });

  it('walks at walking speed', () => {
    expect(chooseAnimation(PLAYER.walkSpeed, true)).toBe('Walk');
  });

  it('runs at sprinting speed', () => {
    expect(chooseAnimation(PLAYER.sprintSpeed, true)).toBe('Run');
  });

  it('does not flip to the run cycle the instant walking speed is reached', () => {
    // The threshold sits above walk speed on purpose: without the gap, the
    // ordinary wobble around top speed switches clips several times a second.
    expect(chooseAnimation(PLAYER.walkSpeed * 1.05, true)).toBe('Walk');
  });

  it('plays the jump clip whenever airborne, whatever the speed', () => {
    expect(chooseAnimation(0, false)).toBe('Jump');
    expect(chooseAnimation(PLAYER.sprintSpeed, false)).toBe('Jump');
  });
});
