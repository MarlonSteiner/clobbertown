import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import type * as THREE from 'three';

/**
 * Moves a kinematic body by `displacement`, as far as the world allows.
 *
 * Rapier's character controller is asked where the movement actually ends up
 * once walls, steps and slopes are resolved, and the body is moved there. The
 * resulting position is written into `out`. Returns how far the body really
 * moved vertically, which the caller compares with what it asked for to tell
 * when the player has landed on something or bumped their head.
 */
export function moveKinematic(
  controller: KinematicCharacterController,
  collider: RapierCollider,
  body: RapierRigidBody,
  displacement: THREE.Vector3,
  out: THREE.Vector3,
): number {
  controller.computeColliderMovement(collider, displacement);
  const corrected = controller.computedMovement();

  const current = body.translation();
  out.set(current.x + corrected.x, current.y + corrected.y, current.z + corrected.z);
  body.setNextKinematicTranslation(out);

  return corrected.y;
}
