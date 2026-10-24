import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { PALETTE } from '../config/palette';
import { PLAYER } from '../config/tuning';
import { currentHour } from '../world/clock';
import { CharacterModel, type AnimationRequest } from '../scene/CharacterModel';
import { useGameStore } from '../state/useGameStore';
import { setLivePosition } from './livePositions';
import type { NpcSpec } from './roster';
import { poseAt } from './routine';

/**
 * One resident, going about their day.
 *
 * Each frame, the resident's hour is worked out from the clock and their
 * schedule says where they should be. The body is kinematic: it is moved
 * directly, not simulated, so a resident can never be knocked about, and the
 * player still collides with them as they pass.
 */
export function Npc({ spec }: { spec: NpcSpec }) {
  const isNearby = useGameStore((state) => state.nearbyNpcId === spec.identity.id);

  const body = useRef<RapierRigidBody>(null);
  const turning = useRef<THREE.Group>(null);
  const animation = useRef<AnimationRequest>({ clip: 'Idle', take: 0 });

  const height = PLAYER.modelHeight;
  const centreY = height / 2;

  useFrame(() => {
    const rigidBody = body.current;
    const group = turning.current;
    if (!rigidBody || !group) return;

    const pose = poseAt(spec.schedule, currentHour(), spec.facing);
    rigidBody.setNextKinematicTranslation({ x: pose.x, y: centreY, z: pose.z });
    group.rotation.y = pose.facing;
    setLivePosition(spec.identity.id, pose.x, pose.z);

    // Mutated in place, as the player's animation is, rather than replaced.
    animation.current.clip = pose.moving ? 'Walk' : 'Idle';
  });

  const [startX, startZ] = spec.position;

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[startX, centreY, startZ]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[PLAYER.capsuleHalfHeight, PLAYER.capsuleRadius]} />

      <group ref={turning}>
        <group position={[0, -height / 2, 0]}>
          <CharacterModel model={spec.model} height={height} animation={animation} />
        </group>

        {/* A ring on the ground when in range. The HUD prompt says what to press;
            this says who it would be talking to. Turns with the resident. */}
        {isNearby && (
          <mesh position={[0, -height / 2 + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[PLAYER.capsuleRadius * 1.6, PLAYER.capsuleRadius * 2.1, 24]} />
            <meshBasicMaterial color={PALETTE.playerAccent} transparent opacity={0.9} />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}
