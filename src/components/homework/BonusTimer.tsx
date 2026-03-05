import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { HomeworkAssignment } from '@/src/types';
import { calculateSubmissionXp } from '@/src/services/rewardsEngine';

interface BonusTimerProps {
  homework: HomeworkAssignment;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return `${days}д ${remainHours}ч`;
  }
  return `${hours}ч ${minutes.toString().padStart(2, '0')}м`;
}

function getNextTierDeadline(homework: HomeworkAssignment, now: Date): { nextXp: number; timeLeft: number } | null {
  const deadline = homework.deadline.getTime();
  const created = homework.createdAt.getTime();
  const current = now.getTime();
  const timeToDeadline = deadline - current;

  if (timeToDeadline < 0) return null;

  // If we're in "same day as creation" tier (150 XP) → next drop is at creation + 1 day (to 120 XP)
  if (current - created < 86400000) {
    return { nextXp: 120, timeLeft: (created + 86400000) - current };
  }

  // If 1+ day before deadline (120 XP) → next drop is at deadline - 6h (to 100 XP)
  if (timeToDeadline >= 86400000) {
    return { nextXp: 100, timeLeft: timeToDeadline - 86400000 };
  }

  // If 6+ hours before deadline (100 XP) → next drop is at deadline - 0 (to 80 XP)
  if (timeToDeadline >= 6 * 3600000) {
    return { nextXp: 80, timeLeft: timeToDeadline - 6 * 3600000 };
  }

  // Less than 6 hours (80 XP) → drops to 50 at deadline
  return { nextXp: 50, timeLeft: timeToDeadline };
}

export default function BonusTimer({ homework }: BonusTimerProps) {
  const theme = useAppTheme();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentXp = calculateSubmissionXp(homework, now);
  const nextTier = getNextTierDeadline(homework, now);

  if (currentXp <= 50) {
    return (
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        Сдай и получи +{currentXp} Здоровье
      </Text>
    );
  }

  const countdown = nextTier ? formatCountdown(nextTier.timeLeft) : '';

  return (
    <Text style={[styles.text, { color: theme.colors.primary }]}>
      Сдай сейчас — +{currentXp} Здоровье{countdown ? ` · ${countdown}` : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
