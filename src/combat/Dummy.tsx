import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { PALETTE } from '../config/palette';
import { COMBAT } from '../config/tuning';
import type { DummySpec } from './dummies';
import { listenForHits } from './dummyHits';
import { applyHit, applyLeanToPivot, createWobble, stepWobble } from './wobble';

const POST_HEIGHT = 0.9;
const BODY_HEIGHT = 0.9;
const BODY_RADIUS = 0.32;
const HEAD_RADIUS = 0.24;
/** The collider is the base only. It does not wobble, so the player bumps a solid post. */
const COLLIDER_RADIUS = 0.35;
const COLLIDER_HALF_HEIGHT = 0.9;

const flashColour = new THREE.Color(PALETTE.hitFlash);
const black = new THREE.Color(0, 0, 0);

/**
 * A training dummy: a burlap sack on a post that rocks when hit and flashes.
 *
 * Built from primitives because neither asset pack has one. The rocking is
 * purely visual, a spring in `wobble.ts`, while the collider stays fixed: a
 * dummy that the physics engine could knock over would end up wedged in a
 * wall or out of reach.
 */
export function Dummy({ spec }: { spec: DummySpec }) {
  const [x, z] = spec.position;

  const pivot = useRef<THREE.Group>(null);
  const wobble = useRef(createWobble());
  const flashUntil = useRef(0);
  /** Every material that flashes, collected once so a hit touches them all. */
  const flashMaterials = useRef<THREE.MeshLambertMaterial[]>([]);

  useEffect(
    () =>
      listenForHits(spec.id, (hit) => {
        applyHit(wobble.current, hit.directionX, hit.directionZ);
        flashUntil.current = performance.now() / 1000 + COMBAT.dummyFlashSeconds;
      }),
    [spec.id],
  );

  useFrame((_, delta) => {
    stepWobble(wobble.current, delta);

    if (pivot.current) applyLeanToPivot(pivot.current, wobble.current, spec.facing);

    const flashing = performance.now() / 1000 < flashUntil.current;
    for (const material of flashMaterials.current) {
      material.emissive.copy(flashing ? flashColour : black);
    }
  });

  const collectMaterial = (material: THREE.MeshLambertMaterial | null) => {
    if (material && !flashMaterials.current.includes(material)) {
      flashMaterials.current.push(material);
    }
  };

  return (
    <group position={[x, 0, z]} rotation={[0, spec.facing, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider
          args={[COLLIDER_HALF_HEIGHT, COLLIDER_RADIUS]}
          position={[0, COLLIDER_HALF_HEIGHT, 0]}
        />
      </RigidBody>

      {/* A wide foot so the dummy looks planted rather than balanced. */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.38, 0.45, 0.12, 10]} />
        <meshLambertMaterial color={PALETTE.post} />
      </mesh>

      {/* Everything above the foot rocks together around the base of the post. */}
      <group ref={pivot}>
        <mesh position={[0, POST_HEIGHT / 2, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, POST_HEIGHT, 8]} />
          <meshLambertMaterial color={PALETTE.post} />
        </mesh>

        <mesh position={[0, POST_HEIGHT + BODY_HEIGHT / 2 - 0.1, 0]} castShadow>
          <capsuleGeometry args={[BODY_RADIUS, BODY_HEIGHT - BODY_RADIUS * 2, 4, 12]} />
          <meshLambertMaterial ref={collectMaterial} color={PALETTE.burlap} flatShading />
        </mesh>

        {/* The painted target, on the side that faces `facing`. */}
        <mesh position={[0, POST_HEIGHT + BODY_HEIGHT / 2 - 0.05, -BODY_RADIUS - 0.005]}>
          <circleGeometry args={[0.16, 16]} />
          <meshLambertMaterial ref={collectMaterial} color={PALETTE.target} side={THREE.DoubleSide} />
        </mesh>

        {/* A crossbar for arms, so it reads as a figure and not a sack. */}
        <mesh position={[0, POST_HEIGHT + BODY_HEIGHT - 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.95, 6]} />
          <meshLambertMaterial color={PALETTE.post} />
        </mesh>

        <mesh position={[0, POST_HEIGHT + BODY_HEIGHT + HEAD_RADIUS - 0.12, 0]} castShadow>
          <icosahedronGeometry args={[HEAD_RADIUS, 1]} />
          <meshLambertMaterial ref={collectMaterial} color={PALETTE.burlap} flatShading />
        </mesh>
      </group>
    </group>
  );
}
