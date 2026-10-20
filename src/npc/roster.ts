import type { NpcBrain, NpcIdentity } from './NpcBrain';
import { yawToward } from '../player/movement';
import { SPAWN } from '../player/spawn';
import { StubNpcBrain } from './StubNpcBrain';

/** An NPC as the scene needs it: who they are, where they stand, and their mind. */
export interface NpcSpec {
  identity: NpcIdentity;
  /** Character model, under `public/models/`. */
  model: string;
  /** Where they stand, on the ground plane. */
  position: [x: number, z: number];
  /** Which way they face, in radians. */
  facing: number;
}

/**
 * Everyone in town. One resident in Phase 1, standing in the square.
 *
 * Brains are created here and nowhere else. That makes this file the single
 * place Phase 3 edits to swap `StubNpcBrain` for the real implementation.
 */
const GERTIE_AT: [x: number, z: number] = [4, 3];

export const NPCS: NpcSpec[] = [
  {
    identity: {
      id: 'gertie',
      name: 'Gertie',
      role: 'Runs the bakery. Knows everyone, and tells everyone.',
    },
    // A chef, because she runs the bakery. Phase 3 will want the role and the
    // look to agree, since the LLM is told what she does for a living.
    model: 'characters/chef-female.glb',
    position: GERTIE_AT,
    // Facing where the player starts, so the first thing they see of her is
    // her face and not her back.
    facing: yawToward(GERTIE_AT, [SPAWN[0], SPAWN[2]]),
  },
];

const brains = new Map<string, NpcBrain>();

/**
 * The brain for an NPC, created on first use.
 *
 * Callers ask for a brain by id rather than holding one, so that Phase 3 can
 * change how brains are built, shared, or persisted without touching the
 * scene. The stub lines below are the only hardcoded dialogue in the game.
 */
export function getNpcBrain(npcId: string): NpcBrain {
  const existing = brains.get(npcId);
  if (existing) return existing;

  const brain = new StubNpcBrain(STUB_LINES[npcId] ?? DEFAULT_LINES);
  brains.set(npcId, brain);
  return brain;
}

/** Clears every cached brain. Exists so tests start from a known state. */
export function resetNpcBrains(): void {
  brains.clear();
}

const DEFAULT_LINES: readonly string[] = ['...'];

const STUB_LINES: Record<string, readonly string[]> = {
  gertie: [
    "Morning. You're new, aren't you? Don't worry, everyone'll know by lunchtime.",
    "Careful round the square. People here have long memories.",
    "I'd tell you what the smith said about you, but I'm not one to gossip.",
  ],
};
