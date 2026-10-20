import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../config/palette';
import { fitToHeight, useModel } from './useModel';

/**
 * The animation clips this game uses.
 *
 * The Quaternius pack ships seventeen, including Punch, SwordSlash and
 * RecieveHit, which is why it was chosen: Phase 2's combat gets its animation
 * for free. These four are the ones locomotion needs.
 */
export type CharacterAnimation = 'Idle' | 'Walk' | 'Run' | 'Jump';

/** Seconds to blend between clips. Long enough to be smooth, short enough to feel responsive. */
const CROSSFADE_SECONDS = 0.18;

/** The material whose colour the Quaternius export gets wrong. */
const SKIN_MATERIAL_NAME = 'Skin';
/**
 * Below this linear brightness, a skin material is taken to be the broken
 * export rather than a deliberately dark tone. Every character in the pack
 * ships at 0.01, so the test is generous but still specific.
 */
const BROKEN_SKIN_THRESHOLD = 0.05;

interface CharacterModelProps {
  /** Path under `public/models/`. */
  model: string;
  /** How tall the character should stand, in world units. */
  height: number;
  /**
   * Which clip to play, as a ref rather than a prop.
   *
   * The player's animation changes with their speed, which changes every
   * frame. Passing it as a prop would re-render this component at frame rate;
   * reading a ref inside the frame loop costs nothing and keeps the scene out
   * of React's way, matching how the rest of the per-frame state works.
   */
  animation: RefObject<CharacterAnimation>;
}

/**
 * A rigged character, scaled to the height it is asked for and playing one
 * looping clip at a time.
 */
export function CharacterModel({ model, height, animation }: CharacterModelProps) {
  const { object, size, animations } = useModel(model);
  useRepairedSkin(object);
  const { actions } = useAnimations(animations, object);

  const currentClip = useRef<CharacterAnimation | null>(null);

  // The bounding box is the bind pose, where the arms are held straight out,
  // so it is the height and not the width that describes the character.
  const scale = fitToHeight(size, height);

  useEffect(() => {
    // Reset when the model changes, so the next frame re-plays into the clip
    // rather than assuming the previous action object is still valid.
    currentClip.current = null;
  }, [actions]);

  useFrame(() => {
    const wanted = animation.current;
    if (wanted === currentClip.current) return;

    const next = actions[wanted];
    if (!next) return;

    const previous = currentClip.current ? actions[currentClip.current] : null;
    if (previous) {
      // crossFadeFrom on a freshly reset action, so a clip interrupted halfway
      // through does not resume from wherever it happened to stop.
      next.reset().crossFadeFrom(previous, CROSSFADE_SECONDS, true).play();
    } else {
      next.reset().fadeIn(CROSSFADE_SECONDS).play();
    }

    currentClip.current = wanted;
  });

  return (
    // glTF models face +Z, but this game's convention is that forward is -Z,
    // which is what the camera, movement and punch maths all assume. Turning
    // the model round once here keeps that conversion out of everything else.
    <group rotation={[0, Math.PI, 0]}>
      <primitive object={object} scale={scale} />
    </group>
  );
}

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
function useRepairedSkin(object: THREE.Object3D): void {
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
