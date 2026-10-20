import { Suspense, useCallback, useRef, type RefObject } from 'react';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { Dummy } from '../combat/Dummy';
import { DUMMIES } from '../combat/dummies';
import { resolvePunch } from '../combat/resolvePunch';
import { WORLD } from '../config/tuning';
import { InteractionController } from '../interaction/InteractionController';
import type { InputState } from '../input/InputState';
import type { LookState } from '../input/useMouseLook';
import { Npc } from '../npc/Npc';
import { NPCS } from '../npc/roster';
import './preload';
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
  const cameraShake = useRef(0);

  // Stable across renders, so the player is not handed a new callback, and
  // reads the shake ref rather than closing over a stale value.
  const onPunchLand = useCallback((origin: THREE.Vector3, yaw: number) => {
    resolvePunch(origin, yaw, cameraShake);
  }, []);

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

          <Player
            input={input}
            look={look}
            positionOut={playerPosition}
            paused={paused}
            onPunchLand={onPunchLand}
          />

          {DUMMIES.map((spec) => (
            <Dummy key={spec.id} spec={spec} />
          ))}

          {NPCS.map((spec) => (
            <Npc key={spec.identity.id} spec={spec} />
          ))}

          <InteractionController input={input} playerPosition={playerPosition} paused={paused} />
        </Physics>
      </Suspense>

      {/* Outside Physics: the camera is not a physical object, it just watches one. */}
      <FollowCamera target={playerPosition} look={look} shake={cameraShake} />
    </>
  );
}
