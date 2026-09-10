import { Suspense, useRef, type RefObject } from 'react';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { WORLD } from '../config/tuning';
import { InteractionController } from '../interaction/InteractionController';
import type { InputState } from '../input/InputState';
import type { LookState } from '../input/useMouseLook';
import { Npc } from '../npc/Npc';
import { NPCS } from '../npc/roster';
import { FollowCamera } from '../player/FollowCamera';
import { Player } from '../player/Player';
import { Lighting } from './Lighting';
import { Town } from './Town';
import { WorldReady } from './WorldReady';

/**
 * Everything inside the Canvas.
 *
 * The player's position is shared through a plain ref rather than the store.
 * It changes every frame, and putting it in state would re-render the whole
 * scene at frame rate for no benefit; the two things that need it, the camera
 * and the interaction check, both run inside the frame loop anyway.
 */
export function Game({
  input,
  look,
  paused,
}: {
  input: RefObject<InputState>;
  look: RefObject<LookState>;
  paused: boolean;
}) {
  const playerPosition = useRef(new THREE.Vector3());

  return (
    <>
      <Lighting />

      {/* Physics suspends while Rapier's WebAssembly loads. The boundary keeps
          that from unmounting the sky and lighting above, so the player sees a
          coherent empty world rather than a black screen while they wait. */}
      <Suspense fallback={null}>
        <Physics gravity={[0, WORLD.gravity, 0]}>
          <WorldReady />
          <Town />

          <Player input={input} look={look} positionOut={playerPosition} paused={paused} />

          {NPCS.map((spec) => (
            <Npc key={spec.identity.id} spec={spec} />
          ))}

          <InteractionController input={input} playerPosition={playerPosition} paused={paused} />
        </Physics>
      </Suspense>

      {/* Outside Physics: the camera is not a physical object, it just watches one. */}
      <FollowCamera target={playerPosition} look={look} />
    </>
  );
}
