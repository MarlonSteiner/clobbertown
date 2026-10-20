import { describe, expect, it } from 'vitest';
import { chooseAnimation } from './playerAnimation';
import { PLAYER } from '../config/tuning';

describe('chooseAnimation', () => {
  it('idles when standing still', () => {
    expect(chooseAnimation(0, true, false)).toBe('Idle');
  });

  it('still idles at the tiny speeds that never quite reach zero', () => {
    expect(chooseAnimation(PLAYER.idleSpeedThreshold, true, false)).toBe('Idle');
  });

  it('walks at walking speed', () => {
    expect(chooseAnimation(PLAYER.walkSpeed, true, false)).toBe('Walk');
  });

  it('runs at sprinting speed', () => {
    expect(chooseAnimation(PLAYER.sprintSpeed, true, false)).toBe('Run');
  });

  it('does not flip to the run cycle the instant walking speed is reached', () => {
    // The threshold sits above walk speed on purpose: without the gap, the
    // ordinary wobble around top speed switches clips several times a second.
    expect(chooseAnimation(PLAYER.walkSpeed * 1.05, true, false)).toBe('Walk');
  });

  it('plays the jump clip whenever airborne, whatever the speed', () => {
    expect(chooseAnimation(0, false, false)).toBe('Jump');
    expect(chooseAnimation(PLAYER.sprintSpeed, false, false)).toBe('Jump');
  });

  it('punches over every other clip, mid-air and mid-sprint included', () => {
    expect(chooseAnimation(0, true, true)).toBe('Punch');
    expect(chooseAnimation(PLAYER.sprintSpeed, true, true)).toBe('Punch');
    expect(chooseAnimation(0, false, true)).toBe('Punch');
  });
});
