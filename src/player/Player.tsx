import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { PLAYER } from '../config/tuning';
import type { InputState } from '../input/InputState';
import type { LookState } from '../input/useMouseLook';
import { PlayerModel } from './PlayerModel';
import { useCharacterController } from './useCharacterController';
import {
  applyGravity,
  applyHorizontalAcceleration,
  damp,
  facingAngle,
  inputToWorldDirection,
  jumpVelocity,
  shortestAngleDelta,
  type Vec2,
} from './movement';

/** Where the player starts: on the square, a little south of centre. */
const SPAWN: [number, number, number] = [0, 2, 8];
/** Longest frame the simulation will accept, so a stall cannot teleport the player. */
const MAX_DELTA = 1 / 20;

interface PlayerProps {
  input: RefObject<InputState>;
  look: RefObject<LookState>;
  /** Written every frame so the camera and interaction checks can read it cheaply. */
  positionOut: RefObject<THREE.Vector3>;
  /** True while the game is not accepting input, e.g. the pointer is unlocked. */
  paused: boolean;
}

/**
 * The player character: a kinematic capsule driven by input, and the model
 * that rides on top of it.
 *
 * All per-frame state lives in refs. Storing velocity in React state would
 * re-render the scene every frame, and storing it on the rigid body is not
 * possible for a kinematic one, which has no velocity of its own.
 */
export function Player({ input, look, positionOut, paused }: PlayerProps) {
  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const model = useRef<THREE.Group>(null);
  const controller = useCharacterController();

  const horizontalVelocity = useRef<Vec2>({ x: 0, z: 0 });
  const verticalVelocity = useRef(0);
  /** When the player was last on the ground, for coyote time. */
  const lastGroundedAt = useRef(0);
  /** The direction the model is facing, eased towards the direction of travel. */
  const facing = useRef(0);

  // Scratch objects, reused each frame. Allocating vectors inside useFrame is
  // the most reliable way to give a game a stuttering garbage collector.
  const desiredMovement = useRef(new THREE.Vector3());
  const nextPosition = useRef(new THREE.Vector3());

  useFrame((_, rawDelta) => {
    const rigidBody = body.current;
    const playerCollider = collider.current;
    if (!rigidBody || !playerCollider || !controller) return;

    // A long frame, from a tab regaining focus or a hitch, would otherwise
    // integrate one enormous step and punch the player through the world.
    const delta = Math.min(rawDelta, MAX_DELTA);
    const now = performance.now() / 1000;

    const state = input.current;
    const grounded = controller.computedGrounded();
    if (grounded) lastGroundedAt.current = now;

    // While paused, keep simulating gravity but ignore steering, so releasing
    // the pointer mid-air does not leave the player hovering.
    const forward = paused ? 0 : state.forward;
    const right = paused ? 0 : state.right;

    const direction = inputToWorldDirection(forward, right, look.current.yaw);
    const topSpeed = !paused && state.sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;

    horizontalVelocity.current = applyHorizontalAcceleration(
      horizontalVelocity.current,
      direction,
      topSpeed,
      grounded,
      delta,
    );

    verticalVelocity.current = grounded && verticalVelocity.current <= 0
      // Held gently against the floor rather than zeroed, so the controller
      // keeps reporting contact instead of flickering in and out of grounded.
      ? -1
      : applyGravity(verticalVelocity.current, delta);

    if (!paused) {
      const canJump = now - lastGroundedAt.current <= PLAYER.coyoteTimeSeconds;
      const requestedAt = state.jumpRequestedAt;
      const jumpIsFresh = requestedAt !== null && now - requestedAt <= PLAYER.jumpBufferSeconds;

      if (jumpIsFresh && canJump) {
        verticalVelocity.current = jumpVelocity();
        state.jumpRequestedAt = null;
        // Prevents coyote time from granting a second jump on the way up.
        lastGroundedAt.current = -Infinity;
      } else if (requestedAt !== null && now - requestedAt > PLAYER.jumpBufferSeconds) {
        // The buffer expired without ever finding ground; drop the request.
        state.jumpRequestedAt = null;
      }
    }

    desiredMovement.current.set(
      horizontalVelocity.current.x * delta,
      verticalVelocity.current * delta,
      horizontalVelocity.current.z * delta,
    );

    // Ask Rapier where that movement actually ends up once collisions,
    // steps and slopes are resolved, then move there.
    controller.computeColliderMovement(playerCollider, desiredMovement.current);
    const corrected = controller.computedMovement();

    const current = rigidBody.translation();
    nextPosition.current.set(
      current.x + corrected.x,
      current.y + corrected.y,
      current.z + corrected.z,
    );
    rigidBody.setNextKinematicTranslation(nextPosition.current);

    // If the controller stopped vertical movement, the player has hit
    // something; keeping the old velocity would let it accumulate into a
    // sudden lurch the moment they step off the obstruction.
    if (Math.abs(corrected.y) < Math.abs(desiredMovement.current.y) * 0.5) {
      verticalVelocity.current = grounded ? -1 : 0;
    }

    positionOut.current.copy(nextPosition.current);
    updateFacing(model.current, horizontalVelocity.current, facing, delta);
  });

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      position={SPAWN}
      colliders={false}
      // The capsule must stay upright; letting physics tip it over would put
      // the camera on its side.
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider ref={collider} args={[PLAYER.capsuleHalfHeight, PLAYER.capsuleRadius]} />
      <group ref={model}>
        <PlayerModel />
      </group>
    </RigidBody>
  );
}

/**
 * Turns the model to face where it is going.
 *
 * The model is rotated independently of the collider, so the capsule's
 * physics never depend on which way the character is looking. Below a small
 * speed the facing is left alone, otherwise the character spins on the spot
 * chasing the noise in a near-zero velocity.
 */
function updateFacing(
  model: THREE.Group | null,
  velocity: Vec2,
  facing: RefObject<number>,
  delta: number,
): void {
  if (!model) return;

  const speed = Math.hypot(velocity.x, velocity.z);
  if (speed > PLAYER.idleSpeedThreshold) {
    // Ease along the shortest arc, so crossing due south does not spin the
    // character the long way round.
    const turn = shortestAngleDelta(facing.current, facingAngle(velocity));
    facing.current = damp(facing.current, facing.current + turn, PLAYER.turnSpeed, delta);
  }

  model.rotation.y = facing.current;
}
