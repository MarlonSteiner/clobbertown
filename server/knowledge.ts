import { GOSSIP } from '../src/config/tuning.ts';
import type { ObservationKind } from '../src/npc/NpcBrain.ts';
import type { StoredEvent } from './MemoryStore.ts';

/** One thing a resident knows, and how they came to know it. */
export interface KnownEvent {
  event: StoredEvent;
  /** When they learned it: as it happened if they saw it, later if they heard it. */
  learnedAt: number;
  /** The neighbour who told them, or null if they saw it with their own eyes. */
  heardFrom: string | null;
  /** How many retellings stand between them and a witness. 0 for a witness. */
  hops: number;
}

/**
 * Kinds of event worth repeating to the neighbours. A player chatting to the
 * baker is not news; a player hitting things is.
 */
const NEWSWORTHY: ReadonlySet<ObservationKind> = new Set(['player-attacked']);

/**
 * Everything `npcId` knows at time `now` (epoch milliseconds).
 *
 * Gossip is worked out here, from the log of events and who is friends with
 * whom, rather than stored as it spreads. News starts with every witness at
 * once and travels one neighbour per `GOSSIP.hopDelaySeconds`, so a resident
 * two links from a witness hears about it two delays later. Deriving it means
 * there is no timer to run and no second copy of the truth to drift: given the
 * same events and the same clock, everyone always knows the same things.
 *
 * Deciding who knows what is done in code on purpose. The language model only
 * decides how a resident talks about what they know, which keeps the spread of
 * news predictable and testable.
 */
export function knowledgeOf(
  npcId: string,
  events: readonly StoredEvent[],
  neighboursOf: (id: string) => readonly string[],
  now: number,
): KnownEvent[] {
  const known: KnownEvent[] = [];

  for (const event of events) {
    if (event.witnessedBy.includes(npcId)) {
      known.push({ event, learnedAt: event.at, heardFrom: null, hops: 0 });
      continue;
    }
    if (!NEWSWORTHY.has(event.kind)) continue;

    const route = gossipRoute(npcId, event.witnessedBy, neighboursOf);
    if (!route) continue;

    const learnedAt = event.at + route.hops * GOSSIP.hopDelaySeconds * 1000;
    if (learnedAt <= now) {
      known.push({ event, learnedAt, heardFrom: route.heardFrom, hops: route.hops });
    }
  }

  return known;
}

/**
 * The shortest way news can reach `npcId` from any of the witnesses, within
 * `GOSSIP.maxHops`, and which neighbour delivers it.
 *
 * A breadth-first search outward from all the witnesses at once, so the
 * distance found is to the nearest one. When two neighbours are equally close
 * to the source, the alphabetically first is credited, so the same question
 * always gets the same answer.
 */
function gossipRoute(
  npcId: string,
  witnesses: readonly string[],
  neighboursOf: (id: string) => readonly string[],
): { hops: number; heardFrom: string } | null {
  const distance = new Map<string, number>(witnesses.map((id) => [id, 0]));
  let frontier = [...witnesses];

  for (let hops = 1; hops <= GOSSIP.maxHops && frontier.length > 0; hops++) {
    const next: string[] = [];
    for (const teller of frontier) {
      for (const listener of neighboursOf(teller)) {
        if (distance.has(listener)) continue;
        distance.set(listener, hops);
        next.push(listener);
      }
    }

    if (distance.get(npcId) === hops) {
      const tellers = neighboursOf(npcId)
        .filter((neighbour) => distance.get(neighbour) === hops - 1)
        .sort();
      const heardFrom = tellers[0];
      return heardFrom === undefined ? null : { hops, heardFrom };
    }
    frontier = next;
  }

  return null;
}
