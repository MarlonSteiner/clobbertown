import { RigidBody } from '@react-three/rapier';
import { PALETTE } from '../config/palette';
import { PLAYER } from '../config/tuning';
import { useGameStore } from '../state/useGameStore';
import type { NpcSpec } from './roster';

/**
 * One resident, standing in place.
 *
 * A capsule with a head, matching the player's proportions so the two read as
 * the same species. NPCs do not move in Phase 1; the rigid body is fixed and
 * exists only so the player collides with them rather than walking through.
 */
export function Npc({ spec }: { spec: NpcSpec }) {
  const [x, z] = spec.position;
  const isNearby = useGameStore((state) => state.nearbyNpcId === spec.identity.id);

  const radius = PLAYER.capsuleRadius;
  const halfHeight = PLAYER.capsuleHalfHeight;

  return (
    <group position={[x, halfHeight + radius, z]} rotation={[0, spec.facing, 0]}>
      <RigidBody type="fixed" colliders="hull">
        <mesh castShadow>
          <capsuleGeometry args={[radius, halfHeight * 2, 4, 12]} />
          <meshLambertMaterial color={PALETTE.npc} />
        </mesh>
      </RigidBody>

      <mesh position={[0, halfHeight + radius * 0.9, 0]} castShadow>
        <sphereGeometry args={[radius * 0.85, 12, 10]} />
        <meshLambertMaterial color={PALETTE.playerAccent} />
      </mesh>

      <mesh position={[0, halfHeight + radius * 0.9, -radius * 0.8]}>
        <coneGeometry args={[radius * 0.22, radius * 0.5, 8]} />
        <meshLambertMaterial color={PALETTE.trim} />
      </mesh>

      {/* A ring on the ground when in range. The prompt in the HUD says what to
          press; this says who it would be talking to. */}
      {isNearby && (
        <mesh position={[0, -(halfHeight + radius) + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.5, radius * 1.9, 24]} />
          <meshBasicMaterial color={PALETTE.playerAccent} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
