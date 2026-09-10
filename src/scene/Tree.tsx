import { RigidBody } from '@react-three/rapier';
import { PALETTE } from '../config/palette';
import type { TreeSpec } from './layout';

const TRUNK_HEIGHT = 2.2;
const TRUNK_RADIUS = 0.22;
const CANOPY_RADIUS = 1.6;

/**
 * A low-poly tree: a trunk and two offset spheres for the canopy.
 *
 * The icosahedron at detail 0 gives faceted, chunky foliage that matches the
 * art direction, and costs a fraction of a smooth sphere. Only the trunk has
 * collision, so the player can brush through overhanging leaves.
 */
export function Tree({ spec }: { spec: TreeSpec }) {
  const [x, z] = spec.position;

  return (
    <group position={[x, 0, z]} scale={spec.scale}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, TRUNK_HEIGHT / 2, 0]} castShadow>
          <cylinderGeometry args={[TRUNK_RADIUS, TRUNK_RADIUS * 1.3, TRUNK_HEIGHT, 6]} />
          <meshLambertMaterial color={PALETTE.trunk} flatShading />
        </mesh>
      </RigidBody>

      <mesh position={[0, TRUNK_HEIGHT + 1.0, 0]} castShadow>
        <icosahedronGeometry args={[CANOPY_RADIUS, 0]} />
        <meshLambertMaterial color={PALETTE.foliage} flatShading />
      </mesh>
      <mesh position={[0.5, TRUNK_HEIGHT + 1.9, -0.3]} castShadow>
        <icosahedronGeometry args={[CANOPY_RADIUS * 0.7, 0]} />
        <meshLambertMaterial color={PALETTE.foliage} flatShading />
      </mesh>
    </group>
  );
}
