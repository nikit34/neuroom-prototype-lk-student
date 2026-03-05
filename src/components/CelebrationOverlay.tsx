import React from 'react';
import { useCelebrationStore } from '../stores/celebrationStore';
import BadgeCelebration from './dev/BadgeCelebration';

export default function CelebrationOverlay() {
  const current = useCelebrationStore((s) => s.current);
  const dismiss = useCelebrationStore((s) => s.dismiss);

  if (!current) return null;

  return <BadgeCelebration badge={current} onDismiss={dismiss} />;
}
