import { create } from 'zustand';
import type { NpcUtterance } from '../npc/NpcBrain';

/**
 * UI-facing game state.
 *
 * Only things the interface needs to redraw for live here. Player position and
 * velocity deliberately do not: they change every frame and belong in refs
 * inside the controller, not in a store that would re-render the tree 60 times
 * a second.
 */
interface GameState {
  /**
   * True once the physics world is live. Rapier ships as WebAssembly that is
   * fetched and compiled at runtime, which takes long enough on a cold cache
   * to be worth showing the player, rather than leaving them looking at an
   * empty sky wondering whether the game is broken.
   */
  isWorldReady: boolean;
  /** The NPC the player could talk to right now, if any. */
  nearbyNpcId: string | null;
  /** The line currently on screen, or null when no dialogue is open. */
  dialogue: NpcUtterance | null;
  /** True while waiting on a brain to answer. Phase 3 makes this visible. */
  isDialoguePending: boolean;

  markWorldReady: () => void;
  setNearbyNpc: (npcId: string | null) => void;
  openDialogue: (utterance: NpcUtterance) => void;
  setDialoguePending: (pending: boolean) => void;
  closeDialogue: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  isWorldReady: false,
  nearbyNpcId: null,
  dialogue: null,
  isDialoguePending: false,

  markWorldReady: () => set({ isWorldReady: true }),

  setNearbyNpc: (npcId) =>
    // Guarded so the every-frame proximity check only notifies subscribers
    // when the answer actually changes.
    set((state) => (state.nearbyNpcId === npcId ? state : { nearbyNpcId: npcId })),

  openDialogue: (utterance) => set({ dialogue: utterance, isDialoguePending: false }),
  setDialoguePending: (pending) => set({ isDialoguePending: pending }),
  closeDialogue: () => set({ dialogue: null, isDialoguePending: false }),
}));
