import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isCompleted: boolean;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isCompleted: false,

      complete: () => set({ isCompleted: true }),

      reset: () => set({ isCompleted: false }),
    }),
    {
      name: 'neuroom-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
