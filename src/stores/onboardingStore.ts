import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isCompleted: boolean;
  _hasHydrated: boolean;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isCompleted: false,
      _hasHydrated: false,

      complete: () => set({ isCompleted: true }),

      reset: () => set({ isCompleted: false }),
    }),
    {
      name: 'neuroom-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useOnboardingStore.setState({ _hasHydrated: true });
      },
      partialize: (state) => ({ isCompleted: state.isCompleted }),
    }
  )
);
