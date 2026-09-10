import { CuboidCollider } from '@react-three/rapier';
import { WORLD } from '../config/tuning';

/**
 * An invisible wall ringing the town.
 *
 * These are bare colliders with no mesh: the player should be stopped without
 * being shown a wall, because a visible box would break the illusion that the
 * town continues. The walls are thick, since a thin collider is what a
 * sprinting player tunnels through between physics steps.
 */
export function Boundary() {
  const half = WORLD.size / 2;
  const thickness = WORLD.boundaryThickness;
  const height = WORLD.boundaryHeight;

  // Colliders are positioned by their centre, so each wall sits half its own
  // thickness outside the town edge, leaving the full 100 units walkable.
  const offset = half + thickness / 2;

  return (
    <>
      <CuboidCollider position={[0, height / 2, -offset]} args={[half + thickness, height / 2, thickness / 2]} />
      <CuboidCollider position={[0, height / 2, offset]} args={[half + thickness, height / 2, thickness / 2]} />
      <CuboidCollider position={[-offset, height / 2, 0]} args={[thickness / 2, height / 2, half + thickness]} />
      <CuboidCollider position={[offset, height / 2, 0]} args={[thickness / 2, height / 2, half + thickness]} />
    </>
  );
}
