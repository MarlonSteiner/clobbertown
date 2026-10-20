import { useEffect, type RefObject } from 'react';
import type { InputState } from './InputState';

/** `MouseEvent.button` for the primary button. */
const PRIMARY_BUTTON = 0;

/**
 * Turns a left click on the game canvas into a punch request.
 *
 * The listener sits on the canvas rather than the window on purpose. The start
 * and pause screens are drawn over the canvas, so the click that starts the
 * game lands on them and never reaches it. Listening on the window instead
 * would make that same click throw a punch the instant play begins.
 */
export function useAttackClick(canvas: HTMLElement | null, input: RefObject<InputState>): void {
  useEffect(() => {
    if (!canvas) return;

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== PRIMARY_BUTTON) return;
      input.current.attackRequestedAt = performance.now() / 1000;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    return () => canvas.removeEventListener('mousedown', onMouseDown);
  }, [canvas, input]);
}
