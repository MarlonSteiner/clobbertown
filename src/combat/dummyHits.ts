/**
 * Delivers hits to the dummy that took them.
 *
 * Each dummy registers itself by id when it mounts. The punch is resolved
 * outside React, on the frame it lands, and this is how that moment reaches
 * one particular dummy's wobble without routing a per-frame event through
 * React state.
 */
export interface DummyHit {
  /** Unit vector from the puncher to the dummy, on the ground plane. */
  directionX: number;
  directionZ: number;
}

type HitListener = (hit: DummyHit) => void;

const listeners = new Map<string, HitListener>();

/** Registers a dummy for hits. Returns the function that unregisters it. */
export function listenForHits(dummyId: string, listener: HitListener): () => void {
  listeners.set(dummyId, listener);
  return () => {
    // Only remove our own listener. Under React StrictMode a remount can
    // register a fresh one before the old cleanup runs.
    if (listeners.get(dummyId) === listener) listeners.delete(dummyId);
  };
}

export function reportHit(dummyId: string, hit: DummyHit): void {
  listeners.get(dummyId)?.(hit);
}
