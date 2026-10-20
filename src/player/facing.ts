import type * as THREE from 'three';
import type { RefObject } from 'react';
import { PLAYER } from '../config/tuning';
import { damp, facingAngle, shortestAngleDelta, type Vec2 } from './movement';

/**
 * Turns the model to face where it is going, or where it is punching.
 *
 * The model is rotated independently of the collider, so the capsule's physics
 * never depend on which way the character is looking.
 *
 * `override` wins when set: mid-punch the character faces the punch, even if
 * it is sliding slightly in another direction. Otherwise below a small speed
 * the facing is left alone, so the character does not spin on the spot chasing
 * the noise in a near-zero velocity.
 */
export function updateFacing(
  model: THREE.Group | null,
  velocity: Vec2,
  facing: RefObject<number>,
  delta: number,
  override: number | null,
): void {
  if (!model) return;

  let target: number | null = override;
  if (target === null && Math.hypot(velocity.x, velocity.z) > PLAYER.idleSpeedThreshold) {
    target = facingAngle(velocity);
  }

  if (target !== null) {
    // Ease along the shortest arc, so crossing due south does not spin the
    // character the long way round.
    const turn = shortestAngleDelta(facing.current, target);
    facing.current = damp(facing.current, facing.current + turn, PLAYER.turnSpeed, delta);
  }

  model.rotation.y = facing.current;
}
