import { useCallback, useEffect, useState } from 'react';

/**
 * Tracks whether the pointer is locked to the given element, and offers a way
 * to request it.
 *
 * Escape releases the lock at the browser's insistence and cannot be
 * intercepted, so the game treats "unlocked" as "paused" and shows the
 * overlay again rather than trying to fight it.
 */
export function usePointerLock(target: HTMLElement | null) {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const onChange = () => setIsLocked(document.pointerLockElement === target);
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, [target]);

  const requestLock = useCallback(() => {
    // Chrome rejects a request made too soon after an exit and logs an error;
    // catching keeps that out of the console without changing behaviour.
    void target?.requestPointerLock?.();
  }, [target]);

  return { isLocked, requestLock };
}
