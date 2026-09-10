import { PALETTE } from '../config/palette';
import { PLAYER } from '../config/tuning';

/**
 * The player's body: a chunky capsule with a head, arms and a nose.
 *
 * The nose matters more than it sounds. In third person with no animation, a
 * featureless capsule gives no clue which way you are facing, so turning feels
 * unresponsive even when it is not. A single asymmetric detail fixes that.
 *
 * Phase 2 replaces this whole component with a rigged model; nothing outside
 * it knows what the player looks like.
 */
export function PlayerModel() {
  const bodyHeight = PLAYER.capsuleHalfHeight * 2;
  const radius = PLAYER.capsuleRadius;

  return (
    <group>
      <mesh castShadow>
        <capsuleGeometry args={[radius, bodyHeight, 4, 12]} />
        <meshLambertMaterial color={PALETTE.player} />
      </mesh>

      <mesh position={[0, PLAYER.capsuleHalfHeight + radius * 0.9, 0]} castShadow>
        <sphereGeometry args={[radius * 0.85, 12, 10]} />
        <meshLambertMaterial color={PALETTE.playerAccent} />
      </mesh>

      {/* Forward is -Z, matching the direction the controller turns to face. */}
      <mesh position={[0, PLAYER.capsuleHalfHeight + radius * 0.9, -radius * 0.8]}>
        <coneGeometry args={[radius * 0.22, radius * 0.5, 8]} />
        <meshLambertMaterial color={PALETTE.npc} />
      </mesh>

      <Arm side={-1} radius={radius} />
      <Arm side={1} radius={radius} />
    </group>
  );
}

function Arm({ side, radius }: { side: -1 | 1; radius: number }) {
  return (
    <mesh position={[side * radius * 1.05, 0, 0]} castShadow>
      <capsuleGeometry args={[radius * 0.28, radius * 1.1, 3, 8]} />
      <meshLambertMaterial color={PALETTE.player} />
    </mesh>
  );
}
