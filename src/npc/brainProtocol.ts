import type { ConversationContext, NpcUtterance, WorldObservation } from './NpcBrain.ts';

/**
 * The messages the game and the brain server exchange.
 *
 * Shared by both so the two cannot drift apart. The browser never talks to the
 * language model directly: an API key in browser code is readable by anyone
 * who opens the developer tools, so every request goes through the server.
 */
export const BRAIN_API = '/api/npc';

export interface ObserveRequest {
  npcId: string;
  observation: WorldObservation;
}

export interface ConverseRequest {
  npcId: string;
  context: ConversationContext;
}

export type ConverseResponse = NpcUtterance;

/** What the server is running on, so the game can say so. */
export interface BrainStatus {
  /** Whether lines are written by the language model or come from canned lists. */
  mode: 'llm' | 'canned';
  /** The model in use, when there is one. */
  model: string | null;
}
