import { RigidBody } from '@react-three/rapier';
import { PALETTE, roofColour, wallColour } from '../config/palette';
import type { BuildingSpec } from './layout';

/** Height of a gable roof, as a fraction of the building's footprint depth. */
const ROOF_PITCH = 0.35;
/** How far the roof overhangs the walls. Overhangs read as "built" rather than "extruded". */
const ROOF_OVERHANG = 0.6;
/** Flat roofs get a parapet instead of a pitch, so they still cast a silhouette. */
const PARAPET_HEIGHT = 0.5;

/**
 * One building, rendered from primitives.
 *
 * The collider wraps the walls only, deliberately ignoring the roof: a player
 * brushing an overhanging eave should not be stopped by it. Colliders are
 * `fixed` and explicitly `cuboid` rather than derived from the mesh, because
 * hull-fitting a gable roof produces a slope the player can walk up.
 */
export function Building({ spec }: { spec: BuildingSpec }) {
  const [x, z] = spec.position;
  const [width, depth] = spec.footprint;

  const walls = wallColour(spec.colourIndex);
  const roof = roofColour(spec.colourIndex);

  return (
    <group position={[x, 0, z]} rotation={[0, spec.rotation, 0]}>
      {/* Walls carry the collision. Origin sits at the base, so the box is
          offset upwards by half its height. */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, spec.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, spec.height, depth]} />
          <meshLambertMaterial color={walls} />
        </mesh>
      </RigidBody>

      {spec.roof === 'gable' ? (
        <GableRoof width={width} depth={depth} baseHeight={spec.height} colour={roof} />
      ) : (
        <FlatRoof width={width} depth={depth} baseHeight={spec.height} colour={roof} />
      )}

      <Door depth={depth} />
      <Windows width={width} depth={depth} height={spec.height} />
    </group>
  );
}

/**
 * A pitched roof built from a three-sided cylinder, which is the cheapest way
 * to get a clean prism. Rotating it a quarter turn puts a flat face down and
 * an edge up, giving the ridge line.
 */
function GableRoof({
  width,
  depth,
  baseHeight,
  colour,
}: {
  width: number;
  depth: number;
  baseHeight: number;
  colour: string;
}) {
  const roofHeight = depth * ROOF_PITCH;
  const radius = (depth / 2 + ROOF_OVERHANG) / Math.cos(Math.PI / 6);

  return (
    <mesh
      position={[0, baseHeight + roofHeight / 2, 0]}
      rotation={[0, 0, Math.PI / 2]}
      scale={[roofHeight / radius, 1, 1]}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, width + ROOF_OVERHANG * 2, 3, 1]} />
      <meshLambertMaterial color={colour} flatShading />
    </mesh>
  );
}

/** A flat roof with a low parapet wall around it, for the shop-style buildings. */
function FlatRoof({
  width,
  depth,
  baseHeight,
  colour,
}: {
  width: number;
  depth: number;
  baseHeight: number;
  colour: string;
}) {
  return (
    <mesh position={[0, baseHeight + PARAPET_HEIGHT / 2, 0]} castShadow>
      <boxGeometry args={[width + 0.4, PARAPET_HEIGHT, depth + 0.4]} />
      <meshLambertMaterial color={colour} />
    </mesh>
  );
}

/** A door on the +Z face. Purely decorative in Phase 1; nothing opens yet. */
function Door({ depth }: { depth: number }) {
  return (
    <mesh position={[0, 1.1, depth / 2 + 0.06]}>
      <boxGeometry args={[1.2, 2.2, 0.12]} />
      <meshLambertMaterial color={PALETTE.trim} />
    </mesh>
  );
}

/** A pair of windows either side of the door, and one on each flank. */
function Windows({ width, depth, height }: { width: number; depth: number; height: number }) {
  const y = Math.min(height - 1.2, 2.2);
  const inset = width / 4;

  return (
    <>
      <Pane position={[-inset, y, depth / 2 + 0.06]} rotation={[0, 0, 0]} />
      <Pane position={[inset, y, depth / 2 + 0.06]} rotation={[0, 0, 0]} />
      <Pane position={[width / 2 + 0.06, y, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Pane position={[-width / 2 - 0.06, y, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </>
  );
}

function Pane({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[1.1, 1.1, 0.1]} />
      <meshLambertMaterial color={PALETTE.window} />
    </mesh>
  );
}
