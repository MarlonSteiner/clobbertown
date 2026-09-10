import type {
  ConversationContext,
  NpcBrain,
  NpcUtterance,
  WorldObservation,
} from './NpcBrain';

/**
 * The Phase 1 stand-in for a real NPC mind.
 *
 * It cycles through a handful of hardcoded lines and remembers nothing beyond
 * which line it said last. Its only job is to prove the interface: if the game
 * talks to this happily, it will talk to an LLM happily.
 */
export class StubNpcBrain implements NpcBrain {
  private nextLineIndex = 0;

  constructor(private readonly lines: readonly string[]) {}

  converse(context: ConversationContext): Promise<NpcUtterance> {
    const line = this.lines[this.nextLineIndex % this.lines.length] ?? '...';
    this.nextLineIndex += 1;

    return Promise.resolve({
      npcId: context.npc.id,
      text: line,
      mood: 'friendly',
    });
  }

  /**
   * Deliberately empty. Phase 3 writes these to persistent memory and starts
   * spreading them between neighbours; Phase 1 only needs the call to be safe
   * to make, so that the call sites already exist when that lands.
   */
  observe(_observation: WorldObservation): void {
    // No memory in Phase 1.
  }
}
