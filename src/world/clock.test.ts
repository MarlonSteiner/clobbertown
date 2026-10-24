import { describe, expect, it } from 'vitest';
import { formatClock, hourAt } from './clock';
import { CLOCK } from '../config/tuning';

describe('hourAt', () => {
  it('starts at the configured hour', () => {
    expect(hourAt(0)).toBe(CLOCK.startHour);
  });

  it('moves through a full day in exactly dayLengthSeconds', () => {
    expect(hourAt(CLOCK.dayLengthSeconds / 2)).toBeCloseTo((CLOCK.startHour + 12) % 24);
  });

  it('rolls over past midnight and stays within 0 to 24', () => {
    for (let s = 0; s < CLOCK.dayLengthSeconds * 3; s += 7) {
      const hour = hourAt(s);
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThan(24);
    }
  });
});

describe('formatClock', () => {
  it('reads the hour and minutes with am or pm', () => {
    expect(formatClock(9.0833)).toBe('9:05 am');
    expect(formatClock(13.5)).toBe('1:30 pm');
  });

  it('writes midnight and noon as twelve', () => {
    expect(formatClock(0)).toBe('12:00 am');
    expect(formatClock(12)).toBe('12:00 pm');
  });

  it('pads single-digit minutes', () => {
    expect(formatClock(8.0167)).toBe('8:01 am');
  });
});
