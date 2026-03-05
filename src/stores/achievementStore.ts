import { create } from 'zustand';
import { Achievement, AchievementSource, AchievementTier } from '../types';
import { mockAchievements } from '../data/mockData';
import { useCelebrationStore } from './celebrationStore';
import { useBadgeStore } from './badgeStore';

const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
};

function fireCelebration(a: Achievement, tier?: AchievementTier) {
  const suffix = tier ? ` (${TIER_LABELS[tier]})` : '';
  useCelebrationStore.getState().push({
    id: tier ? `${a.id}-${tier}` : a.id,
    icon: a.icon,
    title: a.title + suffix,
    description: a.description,
    rarity: a.rarity,
    category: a.category,
  });
}

function awardBadge(a: Achievement, tier?: AchievementTier) {
  const suffix = tier ? ` (${TIER_LABELS[tier]})` : '';
  useBadgeStore.getState().addBadge({
    id: tier ? `${a.id}-${tier}` : a.id,
    icon: a.icon,
    title: a.title + suffix,
    description: a.description,
    rarity: a.rarity,
    category: a.category,
    achievementId: a.id,
    tier,
    earnedAt: new Date(),
  });
}

interface AchievementState {
  achievements: Achievement[];
  unlockAchievement: (id: string, source?: AchievementSource) => void;
  updateProgress: (id: string, progress: number) => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [...mockAchievements],

  unlockAchievement: (id, source?) =>
    set((state) => {
      const target = state.achievements.find((a) => a.id === id);
      if (target && target.isLocked) {
        const unlocked = { ...target, isLocked: false, progress: 100, unlockedAt: new Date(), ...(source ? { source } : {}) };
        fireCelebration(unlocked);
        awardBadge(unlocked);
      }
      return {
        achievements: state.achievements.map((a) =>
          a.id === id
            ? { ...a, isLocked: false, progress: 100, unlockedAt: new Date(), ...(source ? { source } : {}) }
            : a
        ),
      };
    }),

  updateProgress: (id, progress) =>
    set((state) => ({
      achievements: state.achievements.map((a) => {
        if (a.id !== id) return a;
        const clampedProgress = Math.max(0, Math.min(100, progress));
        const wasLocked = a.isLocked || a.progress < 100;
        const justUnlocked = wasLocked && clampedProgress >= 100;

        let tier = a.tier;
        let newTier: AchievementTier | undefined;
        if (a.tierThresholds) {
          if (clampedProgress >= a.tierThresholds.gold) tier = 'gold';
          else if (clampedProgress >= a.tierThresholds.silver) tier = 'silver';
          else if (clampedProgress >= a.tierThresholds.bronze) tier = 'bronze';
          else tier = undefined;

          if (tier && tier !== a.tier) newTier = tier;
        }

        const updated = {
          ...a,
          progress: clampedProgress,
          tier,
          ...(clampedProgress >= 100
            ? { isLocked: false, unlockedAt: a.unlockedAt ?? new Date() }
            : {}),
        };

        // Award badge for new tier
        if (newTier) {
          fireCelebration(updated, newTier);
          awardBadge(updated, newTier);
        } else if (justUnlocked && !a.tierThresholds) {
          // Non-tiered achievement unlocked
          fireCelebration(updated);
          awardBadge(updated);
        }

        return updated;
      }),
    })),
}));
