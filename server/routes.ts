import type { ConverseResponse } from '../src/npc/brainProtocol.ts';
import { findResident } from '../src/npc/residents.ts';
import type { DialogueWriter } from './DialogueWriter.ts';
import { knowledgeOf } from './knowledge.ts';
import type { MemoryStore } from './MemoryStore.ts';
import { parseConverse, parseObserve } from './requests.ts';

/** What the routes need, passed in so tests can supply their own clock and writer. */
export interface BrainServer {
  store: MemoryStore;
  writer: DialogueWriter;
  /** Epoch milliseconds. */
  now: () => number;
}

export interface Reply {
  status: number;
  body: unknown;
}

const neighboursOf = (id: string) => findResident(id)?.neighbours ?? [];

/**
 * The brain server's endpoints, as plain functions of a request body.
 *
 * Kept apart from HTTP entirely, so every route can be tested by calling it;
 * the Vite plugin is a thin adapter that only moves bytes in and out.
 */
export function observe(server: BrainServer, body: unknown): Reply {
  const command = parseObserve(body);
  if (!command) return { status: 400, body: { error: 'malformed observation' } };

  server.store.record(command.observation);
  return { status: 204, body: null };
}

export async function converse(server: BrainServer, body: unknown): Promise<Reply> {
  const command = parseConverse(body);
  const resident = command ? findResident(command.npcId) : undefined;
  if (!command || !resident) return { status: 400, body: { error: 'unknown resident' } };

  const now = server.now();
  const known = knowledgeOf(command.npcId, server.store.events, neighboursOf, now);
  const said = server.store.utterancesBy(command.npcId);

  const line = await server.writer.write({ resident, known, said, now });
  server.store.say({ npcId: command.npcId, text: line.text, at: now, kind: line.kind });

  const response: ConverseResponse = { npcId: command.npcId, text: line.text, mood: line.mood };
  return { status: 200, body: response };
}

export function status(server: BrainServer): Reply {
  return { status: 200, body: server.writer.status };
}

/** Wipes the town's memory, for starting a playtest over. */
export function forget(server: BrainServer): Reply {
  server.store.reset();
  return { status: 204, body: null };
}
