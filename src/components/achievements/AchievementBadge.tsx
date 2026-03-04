import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Achievement, AchievementRarity } from '@/src/types';
import ProgressBar from '@/src/components/ui/ProgressBar';

interface AchievementBadgeProps {
  achievement: Achievement;
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Обычная',
  rare: 'Редкая',
  epic: 'Эпическая',
  legendary: 'Легендарная',
};

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const theme = useAppTheme();
  const borderColor = RARITY_COLORS[achievement.rarity];
  const isLocked = achievement.isLocked;
  const inProgress = !isLocked && achievement.progress < 100;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor,
          borderWidth: 2,
        },
      ]}
    >
      {isLocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}

      <Text style={[styles.icon, isLocked && styles.lockedIcon]}>
        {achievement.icon}
      </Text>
      <Text
        style={[
          styles.title,
          { color: isLocked ? theme.colors.textSecondary : theme.colors.text },
        ]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      <Text style={[styles.rarity, { color: borderColor }]}>
        {RARITY_LABELS[achievement.rarity]}
      </Text>

      {inProgress && (
        <View style={styles.progressWrapper}>
          <ProgressBar progress={achievement.progress} color={borderColor} height={4} />
        </View>
      )}

      {!isLocked && achievement.progress >= 100 && (
        <Text style={styles.unlockedBadge}>✅</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 28,
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  lockedIcon: {
    opacity: 0.3,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  rarity: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  progressWrapper: {
    width: '100%',
    marginTop: 4,
  },
  unlockedBadge: {
    fontSize: 14,
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
