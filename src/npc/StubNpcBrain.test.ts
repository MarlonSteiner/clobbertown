import { describe, expect, it, beforeEach } from 'vitest';
import { StubNpcBrain } from './StubNpcBrain';
import type { ConversationContext } from './NpcBrain';
import { getNpcBrain, resetNpcBrains, NPCS } from './roster';

const context: ConversationContext = {
  npc: { id: 'gertie', name: 'Gertie', role: 'Baker' },
  playerPosition: { x: 0, y: 0, z: 0 },
  at: 0,
};

beforeEach(() => resetNpcBrains());

describe('StubNpcBrain', () => {
  it('answers asynchronously, as a real brain will have to', async () => {
    const brain = new StubNpcBrain(['Hello.']);
    const result = brain.converse(context);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toMatchObject({ npcId: 'gertie', text: 'Hello.' });
  });

  it('cycles through its lines and wraps around', async () => {
    const brain = new StubNpcBrain(['one', 'two']);
    const spoken = [
      (await brain.converse(context)).text,
      (await brain.converse(context)).text,
      (await brain.converse(context)).text,
    ];
    expect(spoken).toEqual(['one', 'two', 'one']);
  });

  it('accepts observations without complaint, even though it forgets them', () => {
    const brain = new StubNpcBrain(['Hello.']);
    expect(() =>
      brain.observe({
        kind: 'player-approached',
        at: Date.now(),
        position: { x: 0, y: 0, z: 0 },
        witnessedBy: ['gertie'],
      }),
    ).not.toThrow();
  });

  it('never returns undefined text, even with no lines to say', async () => {
    const brain = new StubNpcBrain([]);
    await expect(brain.converse(context)).resolves.toMatchObject({ text: '...' });
  });
});

describe('roster', () => {
  it('hands out one persistent brain per NPC', () => {
    expect(getNpcBrain('gertie')).toBe(getNpcBrain('gertie'));
  });

  it('gives every NPC in the roster a brain', () => {
    for (const npc of NPCS) {
      expect(getNpcBrain(npc.identity.id)).toBeDefined();
    }
  });
});
