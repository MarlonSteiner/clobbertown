import { useEffect, useState } from 'react';
import { useRapier } from '@react-three/rapier';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import { PLAYER } from '../config/tuning';

/** Skin width kept between the capsule and the world, in metres. */
const COLLISION_OFFSET = 0.02;
/** Minimum width a step must have to be climbable, so ladders are not stairs. */
const MIN_STEP_WIDTH = 0.2;
/** How far below the feet to search for ground when snapping down slopes. */
const GROUND_SNAP_DISTANCE = 0.5;

/**
 * Creates Rapier's kinematic character controller.
 *
 * A kinematic controller rather than a dynamic rigid body is the important
 * choice here. A dynamic body is simulated, which means friction, bounce and
 * momentum you have to fight to get predictable movement; the kinematic
 * controller instead asks "I want to move here, where do I actually end up?"
 * and answers with collisions resolved. That is exactly the primitive a
 * responsive third-person controller wants.
 */
export function useCharacterController(): KinematicCharacterController | null {
  const { world } = useRapier();
  const [controller, setController] = useState<KinematicCharacterController | null>(null);

  useEffect(() => {
    const created = world.createCharacterController(COLLISION_OFFSET);

    // Climb kerbs and doorsteps instead of catching on them. The final flag
    // includes dynamic bodies as valid steps.
    created.enableAutostep(PLAYER.maxStepHeight, MIN_STEP_WIDTH, true);

    // Keeps the player glued to the ground when walking down a slope, rather
    // than launching off every gradient change and stuttering between
    // grounded and airborne.
    created.enableSnapToGround(GROUND_SNAP_DISTANCE);

    created.setMaxSlopeClimbAngle((PLAYER.maxSlopeClimbDegrees * Math.PI) / 180);

    // Movement into a slope is redirected along it rather than being cancelled,
    // so brushing a wall at an angle slides instead of stopping dead.
    created.setApplyImpulsesToDynamicBodies(true);

    setController(created);

    return () => {
      world.removeCharacterController(created);
      setController(null);
    };
  }, [world]);

  return controller;
}
