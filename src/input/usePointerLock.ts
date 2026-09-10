import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Requests and tracks pointer lock on the given element.
 *
 * Losing the lock is treated as "the player stepped away", because Escape
 * releasing the pointer is a browser behaviour no page can intercept, and a
 * game that keeps running while the mouse is free feels broken. That is
 * reported through `onLockLost` rather than by exposing the lock state as the
 * game's pause flag, because the two are not the same thing: some contexts
 * refuse pointer lock entirely, and there the game should still be playable
 * on the keyboard rather than stuck behind an overlay forever.
 */
export function usePointerLock(target: HTMLElement | null, onLockLost: () => void) {
  const [isLocked, setIsLocked] = useState(false);

  // Held in a ref so changing the callback does not tear down the listener.
  const lockLostCallback = useRef(onLockLost);
  lockLostCallback.current = onLockLost;

  useEffect(() => {
    if (!target) return;

    let wasLocked = false;

    const onChange = () => {
      const locked = document.pointerLockElement === target;
      setIsLocked(locked);

      // Only a lock that existed can be lost. Without this, a browser that
      // never grants the lock would fire the callback on the first event.
      if (!locked && wasLocked) lockLostCallback.current();
      wasLocked = locked;
    };

    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, [target]);

  const requestLock = useCallback(() => {
    if (!target?.requestPointerLock) return;

    /* Some contexts reject the request outright: an embedded frame, a browser
       that throttles repeated attempts, or a click the browser does not
       consider a real gesture. That is not fatal, because only the mouse
       depends on the lock and the keyboard does not, but the modern API
       returns a promise and an uncaught rejection would spam the console. */
    const request = target.requestPointerLock() as unknown;
    if (request instanceof Promise) request.catch(() => undefined);
  }, [target]);

  return { isLocked, requestLock };
}
