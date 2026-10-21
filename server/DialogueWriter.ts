import type { BrainStatus } from '../src/npc/brainProtocol.ts';
import type { NpcMood } from '../src/npc/NpcBrain.ts';
import type { Resident } from '../src/npc/residents.ts';
import type { KnownEvent } from './knowledge.ts';
import type { StoredUtterance } from './MemoryStore.ts';

/** A line of dialogue, ready to be said and remembered. */
export interface WrittenLine {
  text: string;
  mood: NpcMood;
  kind: StoredUtterance['kind'];
}

/** Everything a writer may use to decide what a resident says next. */
export interface LineRequest {
  resident: Resident;
  /** What they know, firsthand and hearsay. */
  known: readonly KnownEvent[];
  /** What they have said before, oldest first. */
  said: readonly StoredUtterance[];
  /** Epoch milliseconds. */
  now: number;
}

/**
 * Writes what a resident says. Two implementations: canned lists, and the
 * language model. The server picks one at startup and the rest of it never
 * needs to know which.
 */
export interface DialogueWriter {
  readonly status: BrainStatus;
  write(request: LineRequest): Promise<WrittenLine>;
}

/**
 * Violence this resident has learned about since they last spoke to the
 * player, firsthand or not. "Since they last spoke" is what makes a resident
 * bring something up once rather than every time.
 */
export function freshNews(request: LineRequest): KnownEvent[] {
  const lastSpokeAt = request.said.reduce((latest, line) => Math.max(latest, line.at), -Infinity);
  return request.known.filter(
    (known) => known.event.kind === 'player-attacked' && known.learnedAt > lastSpokeAt,
  );
}
