/**
 * The player's intent for the current frame.
 *
 * This is mutated in place by the input hooks and read by the character
 * controller. It is deliberately a mutable ref rather than React state:
 * movement keys change many times a second, and re-rendering the tree on
 * every keypress would be both wasteful and a frame-timing hazard.
 */
export interface InputState {
  /** -1 back, 0 still, 1 forward. */
  forward: number;
  /** -1 left, 0 still, 1 right. */
  right: number;
  sprint: boolean;
  /**
   * When jump was last pressed, in seconds on the same clock as the frame loop,
   * or null if there is no unhandled press. The controller clears this when it
   * consumes the jump, which is what makes buffering possible.
   */
  jumpRequestedAt: number | null;
  /** Set on the frame the interact key goes down; cleared once handled. */
  interactPressed: boolean;
  /**
   * When a punch was last requested, or null. Buffered like jump, so a punch
   * pressed just before the previous one finishes is queued rather than lost.
   */
  attackRequestedAt: number | null;
}

export function createInputState(): InputState {
  return {
    forward: 0,
    right: 0,
    sprint: false,
    jumpRequestedAt: null,
    interactPressed: false,
    attackRequestedAt: null,
  };
}

/**
 * Key bindings, by `KeyboardEvent.code`.
 *
 * Codes describe physical keys rather than the character they produce, so
 * WASD stays under the same fingers on an AZERTY or Dvorak layout.
 */
export const BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  interact: ['KeyE'],
  /**
   * The keyboard punch. Left click is the main one, but pointer lock is not
   * guaranteed and some players prefer to keep both hands on the keys.
   */
  attack: ['KeyF'],
} as const;
