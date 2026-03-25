import { useEffect } from 'react';
import { useArenaStore } from '../stores/arenaStore';

const CHECK_INTERVAL_MS = 60_000; // check every minute

/**
 * Periodically expires pending duels older than 20 min.
 */
export function useDuelExpiration() {
  const expireOldDuels = useArenaStore((s) => s.expireOldDuels);

  useEffect(() => {
    const cleanup = () => {
      expireOldDuels();
    };

    // Run immediately on mount
    cleanup();

    const interval = setInterval(cleanup, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [expireOldDuels]);
}
