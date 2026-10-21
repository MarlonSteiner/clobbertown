import type {
  ConversationContext,
  NpcBrain,
  NpcUtterance,
  WorldObservation,
} from './NpcBrain';
import { BRAIN_API, type ConverseRequest, type ObserveRequest } from './brainProtocol';

/**
 * A resident whose mind lives on the brain server.
 *
 * This is the Phase 3 implementation of the interface the game has used since
 * Phase 1. Nothing that talks to a brain had to change to use it.
 *
 * If the server cannot be reached at all (the game opened as a static build,
 * say), it falls back to `offline`, so a missing server costs the residents
 * their memory rather than their voice.
 */
export class RemoteNpcBrain implements NpcBrain {
  constructor(
    private readonly npcId: string,
    private readonly offline: NpcBrain,
  ) {}

  async converse(context: ConversationContext): Promise<NpcUtterance> {
    const body: ConverseRequest = { npcId: this.npcId, context };
    try {
      const response = await fetch(`${BRAIN_API}/converse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`brain server answered ${response.status}`);
      return (await response.json()) as NpcUtterance;
    } catch (error) {
      console.warn(`Brain server unavailable for "${this.npcId}"; using offline lines`, error);
      return this.offline.converse(context);
    }
  }

  observe(observation: WorldObservation): void {
    // The offline mind hears it too, so falling back mid-session does not
    // also mean forgetting everything that happened before the server went.
    this.offline.observe(observation);

    const body: ObserveRequest = { npcId: this.npcId, observation };
    // Fire and forget, as the interface promises: the frame loop that reports
    // a punch must never wait on a resident filing it away.
    void fetch(`${BRAIN_API}/observe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((error: unknown) => {
      console.warn(`Could not record an observation for "${this.npcId}"`, error);
    });
  }
}
