import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { PLAYER } from '../config/tuning';
import { CharacterModel } from '../scene/CharacterModel';
import { PLAYER_MODEL } from './playerModel';
import { SPAWN } from './spawn';
import { usePlayerController, type PlayerControls } from './usePlayerController';

/** How tall the player stands, matched to the collider. */
const CHARACTER_HEIGHT = PLAYER.modelHeight;

/**
 * The player character: a kinematic capsule, and the model that rides on it.
 *
 * This file only says what the player is made of. How it moves, punches and
 * animates each frame lives in `usePlayerController`.
 */
export function Player(controls: PlayerControls) {
  const { body, collider, model, animation } = usePlayerController(controls);

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
        <CharacterModel
          model={PLAYER_MODEL}
          height={CHARACTER_HEIGHT}
          animation={animation}
          freezeOnHit
        />
      </group>
    </RigidBody>
  );
}
