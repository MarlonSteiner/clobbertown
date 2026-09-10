import { NPCS } from '../npc/roster';
import type { NpcUtterance } from '../npc/NpcBrain';

/**
 * The dialogue panel.
 *
 * It renders a pending state that the Phase 1 stub will never actually show,
 * because the stub resolves in the same tick. That is intentional: Phase 3's
 * brains are network calls with visible latency, and the UI that handles it
 * should already exist and already be laid out when they land.
 */
export function DialogueBox({
  utterance,
  isPending,
  speakerId,
}: {
  utterance: NpcUtterance | null;
  isPending: boolean;
  speakerId: string | null;
}) {
  if (!utterance && !isPending) return null;

  const id = utterance?.npcId ?? speakerId;
  const name = NPCS.find((npc) => npc.identity.id === id)?.identity.name ?? 'Someone';

  return (
    <div className="dialogue">
      <div className="dialogue-speaker">{name}</div>
      <p className="dialogue-line">{utterance ? utterance.text : '…'}</p>
      <div className="dialogue-footer">
        <kbd>E</kbd> to keep talking · walk away to leave
      </div>
    </div>
  );
}
