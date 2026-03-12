import React from 'react';
import { useCelebrationStore } from '../stores/celebrationStore';
import { useArenaStore } from '../stores/arenaStore';
import BadgeCelebration from './dev/BadgeCelebration';

export default function CelebrationOverlay() {
  const achievementsEnabled = useArenaStore((s) => s.achievementsEnabled);
  const current = useCelebrationStore((s) => s.current);
  const dismiss = useCelebrationStore((s) => s.dismiss);

  if (!achievementsEnabled || !current) return null;

  return <BadgeCelebration badge={current} onDismiss={dismiss} />;
}
