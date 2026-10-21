import { useEffect, useState } from 'react';
import { BRAIN_API, type BrainStatus } from '../npc/brainProtocol';

/**
 * Asks the brain server, once, how the residents are being voiced.
 *
 * Shown on screen because "are these lines from Claude or the canned list?"
 * is otherwise surprisingly hard to tell, and it is the first thing to check
 * after adding an API key. Null while asking, or when there is no server.
 */
export function useBrainStatus(): BrainStatus | null {
  const [status, setStatus] = useState<BrainStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BRAIN_API}/status`)
      .then((response) => (response.ok ? (response.json() as Promise<BrainStatus>) : null))
      .then((value) => {
        if (!cancelled) setStatus(value);
      })
      .catch(() => {
        // No server, as in a static build. The hint simply says nothing about it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

/** The status in a few words, for the corner of the screen. */
export function describeBrainStatus(status: BrainStatus | null): string {
  if (!status) return 'residents offline';
  return status.mode === 'llm' ? `residents voiced by ${status.model ?? 'Claude'}` : 'canned lines (no API key)';
}
