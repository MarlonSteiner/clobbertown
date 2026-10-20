import { beforeEach, describe, expect, it } from 'vitest';
import { isFrozen, resetHitstop } from './hitstop';
import { resolvePunch } from './resolvePunch';
import { getNpcBrain, NPCS, resetNpcBrains } from '../npc/roster';
import type { ConversationContext } from '../npc/NpcBrain';

/**
 * The whole of Phase 2 in one path: a punch lands, a dummy is struck, a
 * resident sees it, and it changes what she says next. Runs against the real
 * dummies, roster and stub brain rather than mocks, so it breaks if any link
 * in that chain does.
 */

const gertie = NPCS.find((npc) => npc.identity.id === 'gertie');
if (!gertie) throw new Error('Gertie is missing from the roster');

const talkToGertie = (): ConversationContext => ({
  npc: gertie.identity,
  playerPosition: { x: 0, y: 0, z: 0 },
  at: 0,
});

/** Standing just south of dummy-a, at (-3, 3), facing it. */
const IN_FRONT_OF_DUMMY = { x: -3, y: 1, z: 4.4 };
const FACING_NORTH = 0;

/** Any clock value will do; the freeze is measured from it. */
const NOW = 100;

beforeEach(() => {
  resetNpcBrains();
  resetHitstop();
});

describe('resolvePunch', () => {
  it('strikes the dummy in front of the player', () => {
    const shake = { current: 0 };
    expect(resolvePunch(IN_FRONT_OF_DUMMY, FACING_NORTH, shake, NOW)).toEqual(['dummy-a']);
  });

  it('shakes the camera on a hit', () => {
    const shake = { current: 0 };
    resolvePunch(IN_FRONT_OF_DUMMY, FACING_NORTH, shake, NOW);
    expect(shake.current).toBeGreaterThan(0);
  });

  it('does nothing at all on a miss', () => {
    const shake = { current: 0 };
    // Facing the other way, with nothing behind.
    expect(resolvePunch(IN_FRONT_OF_DUMMY, Math.PI, shake, NOW)).toEqual([]);
    expect(shake.current).toBe(0);
  });

  it('is noticed: a resident who saw it brings it up next time you talk', async () => {
    resolvePunch(IN_FRONT_OF_DUMMY, FACING_NORTH, { current: 0 }, NOW);
    const reply = await getNpcBrain('gertie').converse(talkToGertie());
    expect(reply.mood).toBe('wary');
    expect(reply.text).toMatch(/saw/i);
  });

  it('is not noticed when it misses', async () => {
    resolvePunch(IN_FRONT_OF_DUMMY, Math.PI, { current: 0 }, NOW);
    const reply = await getNpcBrain('gertie').converse(talkToGertie());
    expect(reply.mood).toBe('friendly');
  });

  it('freezes the moment on a hit', () => {
    resolvePunch(IN_FRONT_OF_DUMMY, FACING_NORTH, { current: 0 }, NOW);
    expect(isFrozen(NOW)).toBe(true);
  });

  it('does not freeze on a miss, so swinging at air never stutters', () => {
    resolvePunch(IN_FRONT_OF_DUMMY, Math.PI, { current: 0 }, NOW);
    expect(isFrozen(NOW)).toBe(false);
  });
});
