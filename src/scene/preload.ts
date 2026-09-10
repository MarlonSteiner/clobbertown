import { useGLTF } from '@react-three/drei';
import { NPCS } from '../npc/roster';
import { PLAYER_MODEL } from '../player/playerModel';
import { MODEL_BASE } from './useModel';

/*
 * Starts fetching the character models as soon as this module is imported.
 *
 * The loading screen waits on everything the scene needs, so the models should
 * all be in flight at once rather than being requested one at a time as each
 * component first renders. Duplicate paths collapse in useGLTF's cache.
 */
for (const path of new Set([PLAYER_MODEL, ...NPCS.map((npc) => npc.model)])) {
  useGLTF.preload(MODEL_BASE + path);
}
