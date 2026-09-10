import { useEffect, useRef } from 'react';
import { CAMERA } from '../config/tuning';

/** Where the camera is currently pointed. Yaw is unbounded; pitch is clamped. */
export interface LookState {
  yaw: number;
  pitch: number;
}

/**
 * Turns mouse movement into camera angles while the pointer is locked.
 *
 * Pointer lock is what lets the mouse turn the camera indefinitely instead of
 * running out of screen. Browsers only grant it in response to a user gesture,
 * which is why the game shows a click-to-play overlay rather than locking on
 * load: an unprompted request is rejected and, on repeat attempts, throttled.
 */
export function useMouseLook(canvas: HTMLElement | null): React.RefObject<LookState> {
  const look = useRef<LookState>({ yaw: 0, pitch: CAMERA.initialPitch });

  useEffect(() => {
    if (!canvas) return;

    const onMouseMove = (event: MouseEvent) => {
      // Only steer while locked, so moving the mouse over a paused game
      // does not silently spin the camera.
      if (document.pointerLockElement !== canvas) return;

      look.current.yaw -= event.movementX * CAMERA.lookSensitivity;
      look.current.pitch = clamp(
        look.current.pitch + event.movementY * CAMERA.lookSensitivity,
        CAMERA.minPitch,
        CAMERA.maxPitch,
      );
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, [canvas]);

  return look;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
