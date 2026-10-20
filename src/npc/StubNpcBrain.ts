import type {
  ConversationContext,
  NpcBrain,
  NpcUtterance,
  WorldObservation,
} from './NpcBrain';

/**
 * The stand-in for a real NPC mind until Phase 3.
 *
 * It cycles through a handful of hardcoded lines, and remembers exactly one
 * thing: how many punches it has watched land. If it saw any since the last
 * conversation, it brings that up first.
 *
 * That one fact is the game's whole premise in miniature: the player does
 * something, someone sees, and it changes what they say. It exists to prove
 * that `observe()` is wired through end to end, so that Phase 3 swaps the mind
 * and not the plumbing. It is not memory: it lives only as long as the page.
 */
export class StubNpcBrain implements NpcBrain {
  private nextLineIndex = 0;
  private attacksWitnessed = 0;
  private attacksMentioned = 0;
  private reactionsGiven = 0;

  constructor(
    private readonly lines: readonly string[],
    private readonly reactions: readonly string[] = [],
  ) {}

  converse(context: ConversationContext): Promise<NpcUtterance> {
    const npcId = context.npc.id;

    // Something new to gossip about takes priority over small talk.
    if (this.attacksWitnessed > this.attacksMentioned && this.reactions.length > 0) {
      // Several punches between conversations earn one remark, not a backlog
      // of them the player has to click through.
      this.attacksMentioned = this.attacksWitnessed;
      const text = this.reactions[Math.min(this.reactionsGiven, this.reactions.length - 1)] ?? '...';
      this.reactionsGiven += 1;
      return Promise.resolve({ npcId, text, mood: 'wary' });
    }

    const line = this.lines[this.nextLineIndex % this.lines.length] ?? '...';
    this.nextLineIndex += 1;
    return Promise.resolve({ npcId, text: line, mood: 'friendly' });
  }

  observe(observation: WorldObservation): void {
    if (observation.kind === 'player-attacked') this.attacksWitnessed += 1;
  }
}
