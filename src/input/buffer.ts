/**
 * Whether a buffered button press has waited too long to still count.
 *
 * Measured against the previous frame, not the current one. A press only goes
 * stale once the game has had at least one look at it and then let the buffer
 * run out. Measured against now instead, a frame longer than the buffer (a
 * hitch, a slow laptop, a background tab coming back) would throw the press
 * away before the game ever saw it, and the button would feel dead.
 */
export function isStale(requestedAt: number, previousFrameAt: number, bufferSeconds: number): boolean {
  return previousFrameAt - requestedAt > bufferSeconds;
}
