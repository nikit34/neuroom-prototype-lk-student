import { create } from 'zustand';
import { Badge, Achievement, AchievementTier } from '../types';
import { mockAchievements } from '../data/mockData';

const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
};

const TIERS_ORDERED: AchievementTier[] = ['bronze', 'silver', 'gold'];

function seedBadges(): Badge[] {
  const badges: Badge[] = [];
  for (const a of mockAchievements) {
    if (a.isLocked && !a.tier) continue;

    if (a.tierThresholds && a.tier) {
      // Award all tiers up to and including current
      const currentIdx = TIERS_ORDERED.indexOf(a.tier);
      for (let i = 0; i <= currentIdx; i++) {
        const tier = TIERS_ORDERED[i];
        badges.push({
          id: `${a.id}-${tier}`,
          icon: a.icon,
          title: `${a.title} (${TIER_LABELS[tier]})`,
          description: a.description,
          rarity: a.rarity,
          category: a.category,
          achievementId: a.id,
          tier,
          earnedAt: a.unlockedAt ?? new Date(),
        });
      }
    } else if (!a.isLocked && a.progress >= 100) {
      badges.push({
        id: a.id,
        icon: a.icon,
        title: a.title,
        description: a.description,
        rarity: a.rarity,
        category: a.category,
        achievementId: a.id,
        earnedAt: a.unlockedAt ?? new Date(),
      });
    }
  }
  return badges;
}

interface BadgeState {
  badges: Badge[];
  addBadge: (badge: Badge) => void;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  badges: seedBadges(),

  addBadge: (badge) => {
    const exists = get().badges.some((b) => b.id === badge.id);
    if (exists) return;
    set((s) => ({ badges: [...s.badges, badge] }));
  },
}));
