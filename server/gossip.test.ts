import { describe, expect, it } from 'vitest';
import { GOSSIP } from '../src/config/tuning.ts';
import { cannedDialogue } from './cannedDialogue.ts';
import { MemoryStore } from './MemoryStore.ts';
import { converse, observe, type BrainServer } from './routes.ts';

/**
 * Gossip across the real town, through the real routes: Gertie sees a punch on
 * the square, and the news reaches each of her neighbours, then theirs, one
 * hop at a time, credited to whoever passed it on.
 */

const T0 = 1_700_000_000_000;
const HOP = GOSSIP.hopDelaySeconds * 1000;

function townAt(store: MemoryStore, at: number): BrainServer {
  return { store, writer: cannedDialogue, now: () => at };
}

async function line(server: BrainServer, npcId: string): Promise<string> {
  const reply = await converse(server, { npcId });
  return (reply.body as { text: string }).text;
}

function punchSeenByGertie(store: MemoryStore) {
  observe(townAt(store, T0), {
    npcId: 'gertie',
    observation: {
      kind: 'player-attacked',
      at: T0,
      position: { x: -3, y: 1, z: 4 },
      witnessedBy: ['gertie'],
      targetId: 'dummy-a',
    },
  });
}

describe('gossip in Clobbertown', () => {
  it('reaches Gertie’s friends after one hop, from her', async () => {
    const store = new MemoryStore(null);
    punchSeenByGertie(store);

    expect(await line(townAt(store, T0 + HOP - 1), 'odile')).not.toMatch(/Gertie tells me/);
    expect(await line(townAt(store, T0 + HOP), 'wilf')).toMatch(/Gertie tells me/);
  });

  it('reaches Bram only after two hops, and he hears it from Odile', async () => {
    const store = new MemoryStore(null);
    punchSeenByGertie(store);

    expect(await line(townAt(store, T0 + HOP), 'bram')).not.toMatch(/tells me/);
    expect(await line(townAt(store, T0 + 2 * HOP), 'bram')).toMatch(/Odile tells me/);
  });

  it('travels at the same pace whether or not anyone has been asked about it', async () => {
    // Asking Odile does not make her a new witness or speed anything up: Bram
    // still hears exactly two hops after the punch, not one hop after Odile spoke.
    const store = new MemoryStore(null);
    punchSeenByGertie(store);
    await line(townAt(store, T0 + HOP), 'odile');
    expect(await line(townAt(store, T0 + HOP + 1), 'bram')).not.toMatch(/tells me/);
  });

  it('is brought up once, then dropped', async () => {
    const store = new MemoryStore(null);
    punchSeenByGertie(store);

    expect(await line(townAt(store, T0 + HOP), 'odile')).toMatch(/Gertie tells me/);
    expect(await line(townAt(store, T0 + HOP + 1000), 'odile')).not.toMatch(/tells me/);
  });
});
