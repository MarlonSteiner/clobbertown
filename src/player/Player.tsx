import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { handleAttackInput } from '../combat/attackInput';
import { AttackTimeline } from '../combat/AttackTimeline';
import { COMBAT, PLAYER } from '../config/tuning';
import type { InputState } from '../input/InputState';
import type { LookState } from '../input/useMouseLook';
import { CharacterModel, type AnimationRequest } from '../scene/CharacterModel';
import { updateFacing } from './facing';
import { shouldJump } from './jumpInput';
import { chooseAnimation } from './playerAnimation';
import { PLAYER_MODEL } from './playerModel';
import { SPAWN } from './spawn';
import { useCharacterController } from './useCharacterController';
import {
  applyGravity,
  applyHorizontalAcceleration,
  facingAngle,
  inputToWorldDirection,
  jumpVelocity,
  type Vec2,
} from './movement';

/** How tall the player stands, matched to the collider. */
const CHARACTER_HEIGHT = PLAYER.modelHeight;

/** Longest frame the simulation will accept, so a stall cannot teleport the player. */
const MAX_DELTA = 1 / 20;

interface PlayerProps {
  input: RefObject<InputState>;
  look: RefObject<LookState>;
  /** Written every frame so the camera and interaction checks can read it cheaply. */
  positionOut: RefObject<THREE.Vector3>;
  /** True while the game is not accepting input, e.g. the pointer is unlocked. */
  paused: boolean;
  /**
   * Called once per punch, on the frame the fist connects, with where the
   * player stands and the direction the punch was thrown. What it hit and who
   * saw it is decided elsewhere; the player only knows that it swung.
   */
  onPunchLand: (origin: THREE.Vector3, yaw: number) => void;
}

/**
 * The player character: a kinematic capsule driven by input, and the model
 * that rides on top of it.
 *
 * All per-frame state lives in refs. Storing velocity in React state would
 * re-render the scene every frame, and storing it on the rigid body is not
 * possible for a kinematic one, which has no velocity of its own.
 */
export function Player({ input, look, positionOut, paused, onPunchLand }: PlayerProps) {
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
  /** Which clip the model should be playing. Read by CharacterModel each frame. */
  const animation = useRef<AnimationRequest>({
    clip: 'Idle',
    take: 0,
    duration: COMBAT.punchDuration,
  });
  const attack = useRef(new AttackTimeline());
  /** When the last frame ran. Buffered presses are aged from here; see input/buffer.ts. */
  const previousFrameAt = useRef(-Infinity);

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

    // Punch where the player is pressing if they are moving, otherwise where
    // the character already faces. Brawler convention: it needs no mouse, and
    // walking at a target then punching simply works.
    const hasInput = direction.x !== 0 || direction.z !== 0;
    const punchYaw = hasInput ? facingAngle(direction) : facing.current;
    handleAttackInput(state, attack.current, now, previousFrameAt.current, punchYaw, paused);
    const swinging = attack.current.isSwinging(now);

    const baseSpeed = !paused && state.sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    // Slowed mid-punch, so the feet plant and the swing reads as committed.
    const topSpeed = swinging ? baseSpeed * COMBAT.punchMoveFactor : baseSpeed;

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

    if (shouldJump(state, now, previousFrameAt.current, lastGroundedAt.current, paused)) {
      verticalVelocity.current = jumpVelocity();
      // Prevents coyote time from granting a second jump on the way up.
      lastGroundedAt.current = -Infinity;
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
    updateFacing(
      model.current,
      horizontalVelocity.current,
      facing,
      delta,
      swinging ? attack.current.yaw : null,
    );

    if (attack.current.consumeImpact(now)) onPunchLand(nextPosition.current, attack.current.yaw);

    // Mutated in place: this runs every frame, and a fresh object each time
    // is garbage the collector has to clean up mid-game.
    const speed = Math.hypot(horizontalVelocity.current.x, horizontalVelocity.current.z);
    animation.current.clip = chooseAnimation(speed, grounded, swinging);
    animation.current.take = attack.current.count;

    previousFrameAt.current = now;
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
      {/* The capsule is centred on the rigid body's origin, but the model's
          own origin is at its feet, so it is dropped by half the capsule's
          height to stand on the same ground the collider rests on. */}
      <group ref={model} position={[0, -CHARACTER_HEIGHT / 2, 0]}>
        <CharacterModel model={PLAYER_MODEL} height={CHARACTER_HEIGHT} animation={animation} />
      </group>
    </RigidBody>
  );
}
