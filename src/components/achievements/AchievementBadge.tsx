import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Achievement, AchievementRarity, AchievementTier } from '@/src/types';
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

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'I',
  silver: 'II',
  gold: 'III',
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Обычная',
  rare: 'Редкая',
  epic: 'Эпическая',
  legendary: 'Легендарная',
};

const TIERS_ORDERED: AchievementTier[] = ['bronze', 'silver', 'gold'];

function getTierIndex(tier?: string): number {
  if (!tier) return -1;
  return TIERS_ORDERED.indexOf(tier as any);
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const theme = useAppTheme();
  const borderColor = RARITY_COLORS[achievement.rarity];
  const isLocked = achievement.isLocked;
  const hasTiers = !!achievement.tierThresholds;
  const currentTierIdx = getTierIndex(achievement.tier);

  // Use tier color for border if tier is active
  const activeBorderColor = achievement.tier ? TIER_COLORS[achievement.tier] : borderColor;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: hasTiers && achievement.tier ? activeBorderColor : borderColor,
          borderWidth: 2,
        },
      ]}
    >
      {isLocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}

      {/* Tier degree badge in top-right */}
      {hasTiers && achievement.tier && (
        <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[achievement.tier] }]}>
          <Text style={styles.tierBadgeText}>{TIER_LABELS[achievement.tier]}</Text>
        </View>
      )}

      {/* Unlocked check (only for non-tiered) */}
      {!hasTiers && !isLocked && achievement.progress >= 100 && (
        <Text style={styles.unlockedBadge}>✅</Text>
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

      {/* Tier dots */}
      {hasTiers && (
        <View style={styles.tierDotsRow}>
          {TIERS_ORDERED.map((tier, idx) => {
            const reached = idx <= currentTierIdx;
            return (
              <View
                key={tier}
                style={[
                  styles.tierDot,
                  {
                    backgroundColor: reached ? TIER_COLORS[tier] : theme.colors.border,
                    width: reached ? 10 : 8,
                    height: reached ? 10 : 8,
                    borderRadius: reached ? 5 : 4,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Progress bar for locked achievements in progress */}
      {isLocked && achievement.progress > 0 && (
        <View style={styles.progressWrapper}>
          <ProgressBar
            progress={achievement.progress}
            color={hasTiers && achievement.tier ? TIER_COLORS[achievement.tier] : borderColor}
            height={4}
          />
        </View>
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
  tierBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    zIndex: 5,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  unlockedBadge: {
    fontSize: 14,
    position: 'absolute',
    top: 6,
    right: 6,
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
    marginBottom: 4,
  },
  tierDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  tierDot: {
    // size set dynamically
  },
  progressWrapper: {
    width: '100%',
    marginTop: 4,
  },
});
