import { useEffect } from 'react';
import { useArenaStore } from '../stores/arenaStore';
import { useNotificationStore } from '../stores/notificationStore';

const CHECK_INTERVAL_MS = 60_000; // check every minute

/**
 * Periodically expires pending duels older than 20 min
 * and removes their corresponding notifications.
 */
export function useDuelExpiration() {
  const expireOldDuels = useArenaStore((s) => s.expireOldDuels);
  const removeNotificationsByRoute = useNotificationStore((s) => s.removeNotificationsByRoute);

  useEffect(() => {
    const cleanup = () => {
      const expiredIds = expireOldDuels();
      for (const id of expiredIds) {
        removeNotificationsByRoute(`/arena/duel/${id}`);
      }
    };

    // Run immediately on mount
    cleanup();

    const interval = setInterval(cleanup, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [expireOldDuels, removeNotificationsByRoute]);
}
