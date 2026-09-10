import { CylinderCollider, RigidBody } from '@react-three/rapier';
import type { TreeSpec } from './layout';
import { fitToHeight, useModel } from './useModel';

/**
 * Collider radius as a fraction of the tree's own width.
 *
 * Deliberately small: the collider is meant to be the trunk, not the canopy.
 * A player brushing through overhanging leaves is fine and expected, while
 * being stopped in mid-air by a branch is not.
 */
const TRUNK_RADIUS_FRACTION = 0.12;
/** How much of the tree's height the trunk collider covers. */
const TRUNK_HEIGHT_FRACTION = 0.45;

/** One tree, scaled to the height its layout entry asks for. */
export function Tree({ spec }: { spec: TreeSpec }) {
  const [x, z] = spec.position;
  const { object, size } = useModel(spec.model);

  const scale = fitToHeight(size, spec.height);
  const radius = Math.max(size.x, size.z) * scale * TRUNK_RADIUS_FRACTION;
  const halfHeight = (spec.height * TRUNK_HEIGHT_FRACTION) / 2;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, 0, z]}
      rotation={[0, spec.rotation, 0]}
    >
      <CylinderCollider args={[halfHeight, radius]} position={[0, halfHeight, 0]} />
      <primitive object={object} scale={scale} />
    </RigidBody>
  );
}
