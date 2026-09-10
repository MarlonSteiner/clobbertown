import { CuboidCollider, RigidBody } from '@react-three/rapier';
import type { BuildingSpec } from './layout';
import { fitToFootprint, useModel } from './useModel';

/**
 * One building.
 *
 * The collider is a single box fitted to the model's bounding volume rather
 * than to its mesh. Two reasons: a trimesh collider for every building would
 * be far more expensive to test against than a box, and hull-fitting a pitched
 * roof produces a slope the player can walk up and over. A box is also what
 * the building actually is, as far as anyone bumping into it is concerned.
 */
export function Building({ spec }: { spec: BuildingSpec }) {
  const [x, z] = spec.position;
  const { object, size, center } = useModel(spec.model);

  const scale = fitToFootprint(size, spec.footprint);

  // Colliders are sized by half-extents and positioned by their centre, which
  // is not the model's origin: Kenney's buildings sit on the ground plane, so
  // the box centre is half a storey up.
  const halfExtents: [number, number, number] = [
    (size.x * scale) / 2,
    (size.y * scale) / 2,
    (size.z * scale) / 2,
  ];
  const colliderCentre: [number, number, number] = [
    center.x * scale,
    center.y * scale,
    center.z * scale,
  ];

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, 0, z]}
      rotation={[0, spec.rotation, 0]}
    >
      <CuboidCollider args={halfExtents} position={colliderCentre} />
      <primitive object={object} scale={scale} />
    </RigidBody>
  );
}
