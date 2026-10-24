import { NPCS } from '../npc/roster';
import { useGameStore } from '../state/useGameStore';
import { ClockReadout } from './ClockReadout';
import { DialogueBox } from './DialogueBox';
import { describeBrainStatus, useBrainStatus } from './useBrainStatus';

/**
 * Everything drawn over the 3D scene while playing.
 *
 * The HUD subscribes to the store field by field rather than taking the whole
 * state, so moving into range of an NPC does not re-render the dialogue box
 * and vice versa.
 */
export function Hud() {
  const nearbyNpcId = useGameStore((state) => state.nearbyNpcId);
  const dialogue = useGameStore((state) => state.dialogue);
  const isPending = useGameStore((state) => state.isDialoguePending);
  const brainStatus = useBrainStatus();

  const nearbyName = NPCS.find((npc) => npc.identity.id === nearbyNpcId)?.identity.name;
  // Once someone is talking, the prompt would only be repeating what the
  // dialogue box already says.
  const showPrompt = nearbyName !== undefined && dialogue === null && !isPending;

  return (
    <div className="overlay">
      {showPrompt && (
        <div className="interact-prompt">
          Press <kbd>E</kbd> to talk to {nearbyName}
        </div>
      )}

      <DialogueBox utterance={dialogue} isPending={isPending} speakerId={nearbyNpcId} />

      <div className="corner-hint">
        <ClockReadout /> · Phase 3 · residents remember · {describeBrainStatus(brainStatus)}
      </div>
    </div>
  );
}
