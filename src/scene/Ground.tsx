import { RigidBody } from '@react-three/rapier';
import { PALETTE } from '../config/palette';
import { WORLD } from '../config/tuning';
import { SQUARE_SIZE, STREETS } from './layout';

/** How far the square sits above the grass. Just enough to catch a shadow edge. */
const SQUARE_RISE = 0.12;
/** Streets sit a hair above the grass to stop the two coplanar surfaces flickering. */
const STREET_RISE = 0.02;

/**
 * The ground: one large collider for the grass, with the square and the
 * streets laid on top as decoration.
 *
 * Only the grass plane has collision. The square's 12cm rise is well under the
 * controller's step height, so the player walks onto it without needing a
 * collider of its own, and the streets are flat paint.
 */
export function Ground() {
  return (
    <>
      <RigidBody type="fixed" colliders="cuboid">
        {/* A thick slab rather than a plane: a zero-thickness floor is the
            classic way for a fast-falling body to tunnel straight through. */}
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[WORLD.size + 20, 2, WORLD.size + 20]} />
          <meshLambertMaterial color={PALETTE.grass} />
        </mesh>
      </RigidBody>

      {STREETS.map((street) => (
        <mesh
          key={street.id}
          position={[street.position[0], STREET_RISE, street.position[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={street.size} />
          <meshLambertMaterial color={PALETTE.road} />
        </mesh>
      ))}

      {/* The central square, drawn last so it sits over the crossroads. */}
      <mesh position={[0, SQUARE_RISE / 2, 0]} receiveShadow>
        <boxGeometry args={[SQUARE_SIZE, SQUARE_RISE, SQUARE_SIZE]} />
        <meshLambertMaterial color={PALETTE.cobble} />
      </mesh>
    </>
  );
}
