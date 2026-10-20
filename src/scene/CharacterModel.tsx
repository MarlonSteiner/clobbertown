import { useEffect, useRef, type RefObject } from 'react';
import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isFrozen } from '../combat/hitstop';
import { useRepairedSkin } from './repairSkin';
import { fitToHeight, useModel } from './useModel';

/**
 * The animation clips this game uses.
 *
 * The Quaternius pack ships seventeen, including SwordSlash and RecieveHit,
 * which is why it was chosen: later combat gets its animation for free.
 */
export type CharacterAnimation = 'Idle' | 'Walk' | 'Run' | 'Jump' | 'Punch';

/**
 * What a character should be doing this frame.
 *
 * Held in a ref and mutated in place rather than replaced, because the player
 * sets it every frame and allocating a fresh object each time is how a game
 * ends up stuttering on garbage collection.
 */
export interface AnimationRequest {
  clip: CharacterAnimation;
  /**
   * Bumped to replay a one-shot clip from the start. Two punches in a row ask
   * for the same clip twice; without this, the second would be mistaken for
   * the first still playing and never be seen. Ignored for looping clips.
   */
  take: number;
  /**
   * How long a one-shot clip should last, in seconds. The clip is sped up or
   * slowed down to fit, so gameplay timing lives in tuning rather than in the
   * animator's export. Ignored for looping clips.
   */
  duration?: number;
}

/** Clips that play once and hold their last frame, instead of looping. */
const ONE_SHOT_CLIPS: ReadonlySet<CharacterAnimation> = new Set(['Punch']);

/** Blend time between looping clips. Smooth, but short enough to feel responsive. */
const CROSSFADE_SECONDS = 0.18;
/**
 * Blend time into a one-shot. Much shorter, because a punch only lasts a
 * fraction of a second and a long blend would eat its wind-up.
 */
const ONE_SHOT_FADE_SECONDS = 0.05;

interface CharacterModelProps {
  /** Path under `public/models/`. */
  model: string;
  /** How tall the character should stand, in world units. */
  height: number;
  /**
   * Read every frame rather than passed as a prop. The player's animation
   * changes with their speed, and a prop would re-render this component at
   * frame rate; a ref costs nothing and matches how the rest of the per-frame
   * state is handled.
   */
  animation: RefObject<AnimationRequest>;
  /**
   * Whether this character holds still during a hit freeze. True for whoever
   * is fighting; false for bystanders, who carry on idling, which keeps the
   * freeze about the hit rather than making the whole town stutter.
   */
  freezeOnHit?: boolean;
}

/** A rigged character, scaled to the height it is asked for. */
export function CharacterModel({ model, height, animation, freezeOnHit = false }: CharacterModelProps) {
  const { object, size, animations } = useModel(model);
  useRepairedSkin(object);
  const { actions, mixer } = useAnimations(animations, object);

  /** Identifies what is playing, so a frame with no change does nothing. */
  const playingKey = useRef<string | null>(null);
  const playingClip = useRef<CharacterAnimation | null>(null);

  // The bounding box is the bind pose, where the arms are held straight out,
  // so it is the height and not the width that describes the character.
  const scale = fitToHeight(size, height);

  useEffect(() => {
    // Reset when the model changes, so the next frame re-plays into the clip
    // rather than assuming the previous action object is still valid.
    playingKey.current = null;
    playingClip.current = null;
  }, [actions]);

  useFrame(() => {
    mixer.timeScale = freezeOnHit && isFrozen(performance.now() / 1000) ? 0 : 1;

    const request = animation.current;
    const oneShot = ONE_SHOT_CLIPS.has(request.clip);
    const key = oneShot ? `${request.clip}#${request.take}` : request.clip;
    if (key === playingKey.current) return;

    const next = actions[request.clip];
    if (!next) return;

    configureLoop(next, oneShot, request.duration);

    const previous = playingClip.current ? actions[playingClip.current] : null;
    const fade = oneShot ? ONE_SHOT_FADE_SECONDS : CROSSFADE_SECONDS;

    // reset() first, so a clip interrupted halfway does not resume from
    // wherever it stopped. Replaying the same action needs no crossfade; it
    // would be fading the clip into itself.
    next.reset();
    if (previous && previous !== next) {
      next.crossFadeFrom(previous, fade, true);
    } else {
      next.setEffectiveWeight(1);
    }
    next.play();

    playingKey.current = key;
    playingClip.current = request.clip;
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

/** Sets a clip to loop forever, or to play once at a chosen length and hold. */
function configureLoop(action: THREE.AnimationAction, oneShot: boolean, duration?: number): void {
  if (!oneShot) {
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.timeScale = 1;
    return;
  }

  action.setLoop(THREE.LoopOnce, 1);
  // Hold the last frame instead of snapping back to the bind pose, which would
  // flash a T-pose for a frame before the next clip blends in.
  action.clampWhenFinished = true;
  action.timeScale = duration ? action.getClip().duration / duration : 1;
}
