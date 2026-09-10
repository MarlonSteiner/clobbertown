import { useEffect } from 'react';
import { useGameStore } from '../state/useGameStore';

/**
 * Reports that the physics world is live.
 *
 * This renders nothing and exists only to be a child of `<Physics>`. Rapier
 * suspends while its WebAssembly loads, so its children do not mount until
 * that is done, which makes "this component mounted" the most reliable
 * available signal that the world is actually ready to be walked around.
 */
export function WorldReady() {
  const markWorldReady = useGameStore((state) => state.markWorldReady);
  useEffect(() => markWorldReady(), [markWorldReady]);
  return null;
}
