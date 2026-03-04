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
      achievements: state.achievements.map((a) =>
        a.id === id
          ? {
              ...a,
              progress: Math.max(0, Math.min(100, progress)),
              ...(progress >= 100
                ? { isLocked: false, unlockedAt: a.unlockedAt ?? new Date() }
                : {}),
            }
          : a
      ),
    })),
}));
