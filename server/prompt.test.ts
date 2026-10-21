import { describe, expect, it } from 'vitest';
import { ago, parseLine, situation, systemPrompt } from './prompt.ts';
import { findResident } from '../src/npc/residents.ts';
import type { KnownEvent } from './knowledge.ts';
import type { StoredUtterance } from './MemoryStore.ts';

const gertie = findResident('gertie');
if (!gertie) throw new Error('Gertie is missing');

const NOW = 1_700_000_000_000;
const MINUTE = 60_000;

function punchKnown(heardFrom: string | null, minutesAgo: number, targetId = 'dummy-a'): KnownEvent {
  const at = NOW - minutesAgo * MINUTE;
  return {
    event: { id: `p${at}`, kind: 'player-attacked', at, position: { x: 0, y: 0, z: 0 }, witnessedBy: ['gertie'], targetId },
    learnedAt: at,
    heardFrom,
    hops: heardFrom ? 1 : 0,
  };
}

const line = (text: string, minutesAgo: number): StoredUtterance => ({
  npcId: 'gertie',
  text,
  at: NOW - minutesAgo * MINUTE,
  kind: 'small-talk',
});

describe('systemPrompt', () => {
  it('is identical on every call, so the prompt cache can reuse it', () => {
    expect(systemPrompt(gertie)).toEqual(systemPrompt(gertie));
  });

  it('contains nothing that changes over time, which would break caching', () => {
    const text = systemPrompt(gertie).join('\n');
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(text).not.toMatch(/\d{10,}/);
    expect(text).not.toMatch(/ago\b/);
  });

  it('tells the model who it is playing', () => {
    expect(systemPrompt(gertie).join('\n')).toContain('You are Gertie.');
  });
});

describe('situation', () => {
  it('says so when meeting the newcomer for the first time', () => {
    expect(situation({ resident: gertie, known: [], said: [], now: NOW })).toMatch(/first time/);
  });

  it('describes a punch the resident saw, and flags it as not yet mentioned', () => {
    const text = situation({ resident: gertie, known: [punchKnown(null, 2)], said: [], now: NOW });
    expect(text).toContain('You saw them punch one of the training dummies in the square, a few minutes ago.');
    expect(text).toMatch(/not mentioned this to them yet/);
  });

  it('stops flagging news once it has been brought up', () => {
    const known = [punchKnown(null, 5)];
    const said = [line('I saw that.', 1)];
    expect(situation({ resident: gertie, known, said, now: NOW })).not.toMatch(/not mentioned/);
  });

  it('credits hearsay to whoever passed it on', () => {
    const text = situation({ resident: gertie, known: [punchKnown('gertie', 3)], said: [], now: NOW });
    expect(text).toContain('Gertie told you that they punched one of the training dummies');
  });

  it('names a resident who was the one punched', () => {
    const text = situation({ resident: gertie, known: [punchKnown(null, 1, 'gertie')], said: [], now: NOW });
    expect(text).toContain('You saw them punch Gertie, about a minute ago.');
  });

  it('shows recent lines so the resident does not repeat itself', () => {
    const said = [line('first', 9), line('second', 8), line('third', 7), line('fourth', 6), line('fifth', 5)];
    const text = situation({ resident: gertie, known: [], said, now: NOW });
    expect(text).toContain('fifth');
    // Only the most recent few, to keep the prompt short.
    expect(text).not.toContain('- first');
    expect(text).toMatch(/5 times/);
  });
});

describe('ago', () => {
  it('speaks in rough, human terms', () => {
    expect(ago(10_000)).toBe('just now');
    expect(ago(MINUTE)).toBe('about a minute ago');
    expect(ago(3 * MINUTE)).toBe('a few minutes ago');
    expect(ago(22 * MINUTE)).toBe('about 20 minutes ago');
    expect(ago(70 * MINUTE)).toBe('about an hour ago');
    expect(ago(5 * 60 * MINUTE)).toBe('earlier today');
    expect(ago(24 * 60 * MINUTE)).toBe('yesterday');
    expect(ago(3 * 24 * 60 * MINUTE)).toBe('3 days ago');
  });
});

describe('parseLine', () => {
  it('accepts a well-formed reply', () => {
    expect(parseLine('{"text":" Morning, love. ","mood":"friendly"}')).toEqual({ text: 'Morning, love.', mood: 'friendly' });
  });

  it('rejects anything that would not make a usable line', () => {
    const bad = [
      'not json',
      '{"text":"hi"}',
      '{"mood":"friendly"}',
      '{"text":"hi","mood":"furious"}',
      '{"text":"   ","mood":"friendly"}',
      `{"text":"${'blah '.repeat(200)}","mood":"friendly"}`,
      '{"text":"cut off mid-sent',
      'null',
    ];
    for (const raw of bad) expect(parseLine(raw), raw).toBeNull();
  });
});
