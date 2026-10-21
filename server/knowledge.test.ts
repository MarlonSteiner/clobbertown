import { describe, expect, it } from 'vitest';
import { knowledgeOf } from './knowledge.ts';
import type { StoredEvent } from './MemoryStore.ts';
import { GOSSIP } from '../src/config/tuning.ts';

/**
 * A small town for testing: a chain a - b - c - d - e, so news has to travel
 * in a line and every hop is visible, plus f, who knows nobody.
 */
const LINKS: Record<string, string[]> = {
  a: ['b'],
  b: ['a', 'c'],
  c: ['b', 'd'],
  d: ['c', 'e'],
  e: ['d'],
  f: [],
};
const neighboursOf = (id: string) => LINKS[id] ?? [];

const HOP = GOSSIP.hopDelaySeconds * 1000;
const T0 = 1_000_000;

function punch(witnessedBy: string[], at = T0): StoredEvent {
  return {
    id: `player-attacked:${at}:dummy`,
    kind: 'player-attacked',
    at,
    position: { x: 0, y: 0, z: 0 },
    witnessedBy,
    targetId: 'dummy',
  };
}

describe('knowledgeOf', () => {
  it('lets a witness know straight away, first hand', () => {
    const [known] = knowledgeOf('a', [punch(['a'])], neighboursOf, T0);
    expect(known).toMatchObject({ heardFrom: null, hops: 0, learnedAt: T0 });
  });

  it('keeps a neighbour in the dark until the news has had time to reach them', () => {
    expect(knowledgeOf('b', [punch(['a'])], neighboursOf, T0 + HOP - 1)).toEqual([]);
  });

  it('tells a neighbour after one hop, and says who told them', () => {
    const [known] = knowledgeOf('b', [punch(['a'])], neighboursOf, T0 + HOP);
    expect(known).toMatchObject({ heardFrom: 'a', hops: 1, learnedAt: T0 + HOP });
  });

  it('carries news further one hop at a time, credited to the last teller', () => {
    expect(knowledgeOf('c', [punch(['a'])], neighboursOf, T0 + HOP)).toEqual([]);
    const [known] = knowledgeOf('c', [punch(['a'])], neighboursOf, T0 + 2 * HOP);
    expect(known).toMatchObject({ heardFrom: 'b', hops: 2 });
  });

  it('lets news die out after the maximum number of retellings', () => {
    // e is four hops from a; news only survives GOSSIP.maxHops.
    expect(GOSSIP.maxHops).toBeLessThan(4);
    expect(knowledgeOf('e', [punch(['a'])], neighboursOf, T0 + 100 * HOP)).toEqual([]);
  });

  it('never reaches someone with no friends', () => {
    expect(knowledgeOf('f', [punch(['a'])], neighboursOf, T0 + 100 * HOP)).toEqual([]);
  });

  it('takes the shortest route when several people saw it', () => {
    // a and e both saw it. d is one hop from e but three from a.
    const [known] = knowledgeOf('d', [punch(['a', 'e'])], neighboursOf, T0 + HOP);
    expect(known).toMatchObject({ heardFrom: 'e', hops: 1 });
  });

  it('does not spread things that are not news', () => {
    const chat: StoredEvent = { ...punch(['a']), kind: 'player-spoke', id: 'chat' };
    expect(knowledgeOf('b', [chat], neighboursOf, T0 + 100 * HOP)).toEqual([]);
    // The person it happened to still remembers it.
    expect(knowledgeOf('a', [chat], neighboursOf, T0)).toHaveLength(1);
  });

  it('credits the same teller every time when two are equally close', () => {
    // m is next to both x and y, who both saw it.
    const diamond: Record<string, string[]> = { x: ['m'], y: ['m'], m: ['y', 'x'] };
    const [known] = knowledgeOf('m', [punch(['x', 'y'])], (id) => diamond[id] ?? [], T0 + HOP);
    expect(known?.heardFrom).toBe('x');
  });
});
