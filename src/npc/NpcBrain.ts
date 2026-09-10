/**
 * The seam that Phase 3 slots into.
 *
 * Everything an NPC knows, says, or remembers goes through this interface.
 * Phase 1 ships `StubNpcBrain`, which returns canned lines and forgets
 * everything; Phase 3 replaces it with an LLM-backed implementation with
 * persistent memory and gossip, and no calling code changes.
 *
 * Two decisions here exist purely to protect that swap:
 *
 * 1. `converse` returns a Promise even though the stub could answer
 *    synchronously. A real brain is a network round-trip, and a synchronous
 *    signature today would mean rewriting every call site tomorrow.
 * 2. `observe` exists with no consumer yet. It is how Phase 2's combat tells
 *    the town what the player did, and Phase 3's gossip is built by NPCs
 *    observing each other. Without it, memory has no way in.
 */

/** Who an NPC is. Static facts, not state. */
export interface NpcIdentity {
  id: string;
  name: string;
  /** A short description of their place in town, used to prompt the LLM later. */
  role: string;
}

/** How an NPC feels as they speak. Phase 3 will drive animation and tone from this. */
export type NpcMood = 'neutral' | 'friendly' | 'wary' | 'hostile';

/** What the world can tell an NPC about. The vocabulary grows with each phase. */
export type ObservationKind =
  | 'player-approached'
  | 'player-spoke'
  | 'player-left';

/**
 * Something that happened, reported to an NPC so it can be remembered.
 *
 * `witnessed` is the hook gossip hangs off: in Phase 3 an event seen by one
 * NPC can be retold to their neighbours, while one seen by nobody cannot.
 */
export interface WorldObservation {
  kind: ObservationKind;
  /** When it happened, as a wall-clock epoch in milliseconds. */
  at: number;
  /** Where it happened, so distant NPCs can plausibly have missed it. */
  position: { x: number; y: number; z: number };
  /** Ids of NPCs who could see it. Empty means unobserved. */
  witnessedBy: string[];
}

/** What the player brings to a conversation. */
export interface ConversationContext {
  npc: NpcIdentity;
  playerPosition: { x: number; y: number; z: number };
  /** Epoch milliseconds, so a brain can reason about time since last meeting. */
  at: number;
}

/** A single line of dialogue. */
export interface NpcUtterance {
  npcId: string;
  text: string;
  mood: NpcMood;
}

export interface NpcBrain {
  /**
   * Asks the NPC for their next line. Rejecting is a legitimate outcome once
   * this is a network call, so callers must handle failure.
   */
  converse(context: ConversationContext): Promise<NpcUtterance>;

  /**
   * Tells the NPC something happened. Fire-and-forget by design: the game loop
   * must never block on an NPC forming a memory.
   */
  observe(observation: WorldObservation): void;
}
