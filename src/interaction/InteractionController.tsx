import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { InputState } from '../input/InputState';
import { getNpcBrain, NPCS } from '../npc/roster';
import { useGameStore } from '../state/useGameStore';
import { findNearest } from './proximity';

/** The NPCs, reshaped once into the flat form the proximity check wants. */
const INTERACTABLES = NPCS.map((npc) => ({
  id: npc.identity.id,
  position: { x: npc.position[0], z: npc.position[1] },
}));

/**
 * Watches for the player standing near someone and pressing the interact key.
 *
 * This lives inside the Canvas because it needs the frame loop, but it renders
 * nothing: the dialogue itself is HTML drawn over the scene. Every route into
 * an NPC's mind goes through `getNpcBrain`, so Phase 3 changes what a brain
 * *is* without touching this file.
 */
export function InteractionController({
  input,
  playerPosition,
  paused,
}: {
  input: RefObject<InputState>;
  playerPosition: RefObject<THREE.Vector3>;
  paused: boolean;
}) {
  /** Guards against a slow brain's answer arriving after the player walked off. */
  const pendingForNpcId = useRef<string | null>(null);

  useFrame(() => {
    const store = useGameStore.getState();
    const player = playerPosition.current;

    const nearbyId = findNearest(
      { x: player.x, z: player.z },
      INTERACTABLES,
      store.nearbyNpcId,
    );
    store.setNearbyNpc(nearbyId);

    // Walking away ends the conversation. Nothing to press, no menu to close.
    if (nearbyId === null && store.dialogue !== null) {
      pendingForNpcId.current = null;
      store.closeDialogue();
      notifyDeparture(store.dialogue.npcId, player);
    }

    if (!input.current.interactPressed) return;
    // Clear the press even while paused, so a key hit behind the pause overlay
    // is discarded rather than firing the moment play resumes.
    input.current.interactPressed = false;

    if (paused || nearbyId === null) return;
    // Already waiting on this resident. With a language model behind them an
    // answer takes seconds, and every extra press would be another paid call.
    if (pendingForNpcId.current === nearbyId) return;
    void speakTo(nearbyId, player);
  });

  return null;

  async function speakTo(npcId: string, player: THREE.Vector3): Promise<void> {
    const store = useGameStore.getState();
    const spec = NPCS.find((npc) => npc.identity.id === npcId);
    if (!spec) return;

    const brain = getNpcBrain(npcId);
    const position = { x: player.x, y: player.y, z: player.z };
    const at = Date.now();

    brain.observe({ kind: 'player-spoke', at, position, witnessedBy: [npcId] });

    pendingForNpcId.current = npcId;
    store.setDialoguePending(true);

    try {
      const utterance = await brain.converse({
        npc: spec.identity,
        playerPosition: position,
        at,
      });

      // The stub answers instantly, but a real brain will not. If the player
      // has walked away or started talking to someone else in the meantime,
      // the answer is stale and must be dropped rather than shown.
      if (pendingForNpcId.current !== npcId) return;
      store.openDialogue(utterance);
    } catch (error) {
      // An NPC failing to think is a Phase 3 reality, not a crash. Say
      // something rather than leaving the player staring at a spinner.
      console.error(`NPC "${npcId}" failed to respond`, error);
      if (pendingForNpcId.current !== npcId) return;
      store.openDialogue({ npcId, text: '...', mood: 'neutral' });
    } finally {
      if (pendingForNpcId.current === npcId) pendingForNpcId.current = null;
    }
  }
}

/** Tells an NPC the player has left, so Phase 3 can date the memory. */
function notifyDeparture(npcId: string, player: THREE.Vector3): void {
  getNpcBrain(npcId).observe({
    kind: 'player-left',
    at: Date.now(),
    position: { x: player.x, y: player.y, z: player.z },
    witnessedBy: [npcId],
  });
}
