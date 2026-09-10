import { useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../config/tuning';
import type { LookState } from '../input/useMouseLook';

interface FollowCameraProps {
  target: RefObject<THREE.Vector3>;
  look: RefObject<LookState>;
}

/**
 * An orbit camera that trails the player.
 *
 * The camera does not track the player directly. It tracks a smoothed copy of
 * their position, and looks at a smoothed copy of the look-at point. Following
 * the raw position would make the camera rigid, and every small collision
 * correction from the character controller would show up as a jolt.
 *
 * Position lags slightly further behind than aim, on purpose: the camera
 * swings to where you are looking a beat before it catches up to where you
 * are standing, which is what makes turning feel led rather than dragged.
 */
export function FollowCamera({ target, look }: FollowCameraProps) {
  const camera = useThree((state) => state.camera);

  const smoothedTarget = useRef(new THREE.Vector3());
  const smoothedPosition = useRef(new THREE.Vector3());
  const hasInitialised = useRef(false);

  // Scratch vectors, reused to keep the frame loop allocation-free.
  const lookAtPoint = useRef(new THREE.Vector3());
  const goalPosition = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const { yaw, pitch } = look.current;

    // Aim at a point above the player's feet, roughly chest height. Aiming at
    // the origin of the capsule puts the horizon uncomfortably low.
    lookAtPoint.current.copy(target.current);
    lookAtPoint.current.y += CAMERA.targetHeight;

    /* Spherical coordinates around the look-at point. Pitch is applied to the
       height and to the horizontal radius together, so the camera swings along
       an arc rather than sliding up a pole. */
    const horizontalDistance = CAMERA.distance * Math.cos(pitch);
    offset.current.set(
      Math.sin(yaw) * horizontalDistance,
      CAMERA.distance * Math.sin(pitch),
      Math.cos(yaw) * horizontalDistance,
    );
    goalPosition.current.copy(lookAtPoint.current).add(offset.current);

    if (!hasInitialised.current) {
      // Snap on the first frame; smoothing from the origin would fly the
      // camera across the town while the player waits.
      smoothedPosition.current.copy(goalPosition.current);
      smoothedTarget.current.copy(lookAtPoint.current);
      hasInitialised.current = true;
    } else {
      dampVector(smoothedPosition.current, goalPosition.current, CAMERA.positionSmoothTime, delta);
      dampVector(smoothedTarget.current, lookAtPoint.current, CAMERA.rotationSmoothTime, delta);
    }

    camera.position.copy(smoothedPosition.current);
    camera.lookAt(smoothedTarget.current);
  });

  return null;
}

/**
 * Eases `current` towards `goal` in place.
 *
 * `smoothTime` is the time to close most of the gap, which is a far more
 * intuitive dial than a per-frame lerp factor. The exponential form keeps the
 * result identical at 30fps and 144fps, so the camera does not feel different
 * on a slower machine.
 */
function dampVector(
  current: THREE.Vector3,
  goal: THREE.Vector3,
  smoothTime: number,
  delta: number,
): void {
  const factor = 1 - Math.exp(-delta / smoothTime);
  current.lerp(goal, factor);
}
