import { useMemo } from 'react';
import * as THREE from 'three';
import { PALETTE } from '../config/palette';

/** The material whose colour the Quaternius export gets wrong. */
const SKIN_MATERIAL_NAME = 'Skin';
/**
 * Below this linear brightness, a skin material is taken to be the broken
 * export rather than a deliberately dark tone. Every character in the pack
 * ships at 0.01, so the test is generous but still specific.
 */
const BROKEN_SKIN_THRESHOLD = 0.05;

/**
 * Replaces the character's skin colour when the model arrives with the broken
 * one.
 *
 * Every character in the Quaternius pack exports its "Skin" material as
 * near-black, with a small near-white "Face" material over the top, so the
 * townsfolk render as silhouettes with a pale smudge. The value is identical
 * across the pack, which is what marks it out as an export bug rather than an
 * artistic choice about any particular character.
 *
 * The material is cloned before being changed. `useGLTF` caches one material
 * per file and hands it to every clone, so editing it in place would reach
 * back into the cache and affect anything else loaded from that model.
 */
export function useRepairedSkin(object: THREE.Object3D): void {
  useMemo(() => {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const repaired = materials.map((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return material;
        if (material.name !== SKIN_MATERIAL_NAME) return material;

        // Leave a model alone if it already has a sensible skin tone, so this
        // stops applying if the pack is ever re-exported correctly.
        const brightness = Math.max(material.color.r, material.color.g, material.color.b);
        if (brightness > BROKEN_SKIN_THRESHOLD) return material;

        const fixed = material.clone();
        fixed.color.set(PALETTE.skin);
        return fixed;
      });

      child.material = Array.isArray(child.material) ? repaired : repaired[0] ?? child.material;
    });
  }, [object]);
}
