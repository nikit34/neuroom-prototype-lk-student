import { create } from 'zustand';
import { Achievement, AchievementSource } from '../types';
import { mockAchievements } from '../data/mockData';

interface AchievementState {
  achievements: Achievement[];
  unlockAchievement: (id: string, source?: AchievementSource) => void;
  updateProgress: (id: string, progress: number) => void;
}

export const useAchievementStore = create<AchievementState>((set) => ({
  achievements: [...mockAchievements],

  unlockAchievement: (id, source?) =>
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.id === id
          ? { ...a, isLocked: false, progress: 100, unlockedAt: new Date(), ...(source ? { source } : {}) }
          : a
      ),
    })),

  updateProgress: (id, progress) =>
    set((state) => ({
      achievements: state.achievements.map((a) => {
        if (a.id !== id) return a;
        const clampedProgress = Math.max(0, Math.min(100, progress));

        let tier = a.tier;
        if (a.tierThresholds) {
          if (clampedProgress >= a.tierThresholds.gold) tier = 'gold';
          else if (clampedProgress >= a.tierThresholds.silver) tier = 'silver';
          else if (clampedProgress >= a.tierThresholds.bronze) tier = 'bronze';
          else tier = undefined;
        }

        return {
          ...a,
          progress: clampedProgress,
          tier,
          ...(clampedProgress >= 100
            ? { isLocked: false, unlockedAt: a.unlockedAt ?? new Date() }
            : {}),
        };
      }),
    })),
}));
