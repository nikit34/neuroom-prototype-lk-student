import { create } from 'zustand';
import { AchievementRarity, AchievementCategory } from '../types';

export interface CelebrationItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
}

interface CelebrationState {
  queue: CelebrationItem[];
  current: CelebrationItem | null;
  push: (item: CelebrationItem) => void;
  dismiss: () => void;
}

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  queue: [],
  current: null,

  push: (item) => {
    const { current } = get();
    if (!current) {
      set({ current: item });
    } else {
      set((s) => ({ queue: [...s.queue, item] }));
    }
  },

  dismiss: () => {
    set({ current: null, queue: [] });
  },
}));
