import { describe, expect, it } from 'vitest';
import { findWitnesses } from './witnesses';
import { COMBAT } from '../config/tuning';

const origin = { x: 0, z: 0 };
const target = (id: string, x: number, z: number) => ({ id, position: { x, z } });

describe('findWitnesses', () => {
  it('includes residents within sight', () => {
    expect(findWitnesses(origin, [target('gertie', 5, 5)])).toEqual(['gertie']);
  });

  it('excludes residents too far away to have seen', () => {
    expect(findWitnesses(origin, [target('gertie', COMBAT.witnessRange + 1, 0)])).toEqual([]);
  });

  it('returns nobody in an empty town', () => {
    expect(findWitnesses(origin, [])).toEqual([]);
  });
});
