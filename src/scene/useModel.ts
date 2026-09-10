import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Model files live in `public/`, so they are served as-is and can be loaded
 * from disk by Phase 4's Electron build. Going through BASE_URL rather than a
 * leading slash keeps that working if the game is ever hosted under a subpath.
 */
export const MODEL_BASE = `${import.meta.env.BASE_URL}models/`;

export interface LoadedModel {
  /** A private copy of the model, safe to mount and transform. */
  object: THREE.Object3D;
  /** Bounding-box size at scale 1. */
  size: THREE.Vector3;
  /** Bounding-box centre at scale 1, relative to the model's own origin. */
  center: THREE.Vector3;
  /** Animation clips shipped with the model. Empty for scenery. */
  animations: THREE.AnimationClip[];
}

/**
 * Loads a GLB and measures it.
 *
 * Two things here are not obvious:
 *
 * The scene is cloned. `useGLTF` caches one scene per URL and hands the same
 * object to every caller, so mounting a model twice without cloning makes the
 * second copy steal the first one's position. Sharing is still the point of
 * the cache: clones share geometry and materials, so a street of the same
 * house costs one upload to the GPU, not one per building.
 *
 * The measurements are taken from the original rather than the clone, before
 * anything has been positioned, so they describe the model's own dimensions
 * and not wherever it currently sits in the world.
 */
export function useModel(path: string): LoadedModel {
  const { scene, animations } = useGLTF(MODEL_BASE + path);

  return useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    /* SkeletonUtils rather than Object3D.clone, because a plain clone of a
       rigged character copies the bones but leaves every skinned mesh bound to
       the *original* skeleton, so all the copies animate as one. It handles
       unrigged scenery identically to a normal clone, so one path covers both. */
    const object = cloneWithSkeleton(scene);
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      // Kenney's exports do not set these, and without them the town casts no
      // shadows at all, which flattens the whole scene.
      child.castShadow = true;
      child.receiveShadow = true;

      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        deMetalliseIfBroken(material);
      }
    });

    return { object, size, center, animations };
  }, [scene, animations]);
}

/**
 * The uniform scale that makes a model fit inside a target footprint.
 *
 * Uniform rather than per-axis, so a building asked to fit a long, narrow plot
 * is made smaller rather than stretched. The layout therefore controls how much
 * ground a building takes up, while the model keeps its own proportions and
 * decides its own height.
 */
export function fitToFootprint(size: THREE.Vector3, footprint: readonly [number, number]): number {
  const [width, depth] = footprint;
  return Math.min(width / size.x, depth / size.z);
}

/** The uniform scale that makes a model stand a given height. */
export function fitToHeight(size: THREE.Vector3, height: number): number {
  return height / size.y;
}

/**
 * Turns off metalness on materials that arrive fully metallic by accident.
 *
 * Kenney's nature kit predates the city kits and its glTF export omits
 * `metallicFactor`, which the spec defaults to 1. A fully metallic surface has
 * no diffuse response at all: it shows only what it reflects, and this scene
 * has no environment map to reflect, so the trees render black or as a dim
 * tint of their own colour rather than as leaves.
 *
 * The check is narrow on purpose. It only fires on a material that is fully
 * metallic *and* carries no metalness map, so a genuinely metal asset added
 * later is left alone, and this stops applying if the pack is ever re-exported.
 */
function deMetalliseIfBroken(material: THREE.Material): void {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  if (material.metalness !== 1 || material.metalnessMap !== null) return;

  material.metalness = 0;
}
