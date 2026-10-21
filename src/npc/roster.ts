import type { NpcBrain, NpcIdentity } from './NpcBrain';
import { yawToward } from '../player/movement';
import { SPAWN } from '../player/spawn';
import { findResident, RESIDENTS } from './residents';
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
 * Everyone in town, placed in the scene. Derived from `residents.ts`, which is
 * where a resident is actually defined.
 */
export const NPCS: NpcSpec[] = RESIDENTS.map((resident) => ({
  identity: resident.identity,
  model: resident.model,
  position: resident.home,
  // Facing where the player starts, so the first thing they see of someone is
  // their face and not their back.
  facing: yawToward(resident.home, [SPAWN[0], SPAWN[2]]),
}));

/** Builds the mind for one resident. */
export type BrainFactory = (npcId: string) => NpcBrain;

/**
 * The default mind: canned lines, held in memory for as long as the page is
 * open. Used by the tests, and anywhere no brain server is available.
 */
export const stubBrainFactory: BrainFactory = (npcId) => {
  const resident = findResident(npcId);
  return new StubNpcBrain(resident?.smallTalk ?? ['...'], resident?.reactions ?? []);
};

let createBrain: BrainFactory = stubBrainFactory;
const brains = new Map<string, NpcBrain>();

/**
 * Chooses what kind of mind every resident gets.
 *
 * This is the swap the NpcBrain interface was built for. The game calls it
 * once at startup to use the brain server; nothing that talks to a brain has
 * to know or care which kind it is talking to.
 */
export function setBrainFactory(factory: BrainFactory): void {
  createBrain = factory;
  brains.clear();
}

/**
 * The brain for an NPC, created on first use.
 *
 * Callers ask for a brain by id rather than holding one, so that how brains
 * are built, shared or persisted can change without touching the scene.
 */
export function getNpcBrain(npcId: string): NpcBrain {
  const existing = brains.get(npcId);
  if (existing) return existing;

  const brain = createBrain(npcId);
  brains.set(npcId, brain);
  return brain;
}

/** Clears every cached brain and restores the default. Exists so tests start clean. */
export function resetNpcBrains(): void {
  createBrain = stubBrainFactory;
  brains.clear();
}
