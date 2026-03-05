import { create } from 'zustand';
import { LootChestResult } from '../types';

interface RewardState {
  pendingChest: LootChestResult | null;
  showChest: (chest: LootChestResult) => void;
  dismissChest: () => void;
}

export const useRewardStore = create<RewardState>((set) => ({
  pendingChest: null,

  showChest: (chest) => set({ pendingChest: chest }),

  dismissChest: () => set({ pendingChest: null }),
}));
