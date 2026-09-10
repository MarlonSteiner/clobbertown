import { useRef } from 'react';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { PALETTE } from '../config/palette';
import { PLAYER } from '../config/tuning';
import { CharacterModel, type CharacterAnimation } from '../scene/CharacterModel';
import { useGameStore } from '../state/useGameStore';
import type { NpcSpec } from './roster';

/**
 * One resident, standing in place.
 *
 * NPCs use the same collider proportions as the player, so the town treats
 * everyone as the same size of obstacle. They do not move in Phase 1, so the
 * body is fixed and the clip is always Idle; Phase 3 gives them somewhere to
 * be and the same walk cycle the player already uses.
 */
export function Npc({ spec }: { spec: NpcSpec }) {
  const [x, z] = spec.position;
  const isNearby = useGameStore((state) => state.nearbyNpcId === spec.identity.id);

  // Constant for now, but typed as a ref so that giving NPCs a walk cycle in
  // Phase 3 needs no change on this side of the interface.
  const animation = useRef<CharacterAnimation>('Idle');

  const height = PLAYER.modelHeight;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, height / 2, z]}
      rotation={[0, spec.facing, 0]}
    >
      <CapsuleCollider args={[PLAYER.capsuleHalfHeight, PLAYER.capsuleRadius]} />

      <group position={[0, -height / 2, 0]}>
        <CharacterModel model={spec.model} height={height} animation={animation} />
      </group>

      {/* A ring on the ground when in range. The HUD prompt says what to press;
          this says who it would be talking to. */}
      {isNearby && (
        <mesh position={[0, -height / 2 + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[PLAYER.capsuleRadius * 1.6, PLAYER.capsuleRadius * 2.1, 24]} />
          <meshBasicMaterial color={PALETTE.playerAccent} transparent opacity={0.9} />
        </mesh>
      )}
    </RigidBody>
  );
}
