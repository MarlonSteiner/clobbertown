import { useEffect, useRef } from 'react';
import { BINDINGS, createInputState, type InputState } from './InputState';

/**
 * Translates key events into an `InputState` ref.
 *
 * Held keys are tracked as a set rather than as booleans per action, so that
 * pressing both left and right cancels out cleanly and releasing one of them
 * resumes movement in the other direction. Deriving the axes from that set on
 * every event is cheaper than the bookkeeping the alternative needs.
 */
export function useKeyboard(): React.RefObject<InputState> {
  const input = useRef<InputState>(createInputState());

  useEffect(() => {
    const held = new Set<string>();

    const recomputeAxes = () => {
      const state = input.current;
      state.forward = axis(held, BINDINGS.forward, BINDINGS.back);
      state.right = axis(held, BINDINGS.right, BINDINGS.left);
      state.sprint = BINDINGS.sprint.some((code) => held.has(code));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Ignore the OS auto-repeat: it would re-trigger jump while held down.
      if (event.repeat) return;
      held.add(event.code);

      if ((BINDINGS.jump as readonly string[]).includes(event.code)) {
        input.current.jumpRequestedAt = performance.now() / 1000;
        // Space scrolls the page otherwise, which fights the canvas.
        event.preventDefault();
      }
      if ((BINDINGS.interact as readonly string[]).includes(event.code)) {
        input.current.interactPressed = true;
      }
      recomputeAxes();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.code);
      recomputeAxes();
    };

    /* Alt-tabbing away with a key held would otherwise leave the player
       walking into a wall forever, because the keyup lands on another window. */
    const onBlur = () => {
      held.clear();
      recomputeAxes();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return input;
}

/** Resolves a pair of opposing bindings to -1, 0 or 1. */
function axis(
  held: Set<string>,
  positive: readonly string[],
  negative: readonly string[],
): number {
  const isPositive = positive.some((code) => held.has(code));
  const isNegative = negative.some((code) => held.has(code));
  if (isPositive === isNegative) return 0;
  return isPositive ? 1 : -1;
}
