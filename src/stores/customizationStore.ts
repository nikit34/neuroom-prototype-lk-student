import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterCustomization } from '../types';

interface CustomizationState {
  customizations: Record<string, Partial<CharacterCustomization>>;
  setCustomization: (charId: string, data: Partial<CharacterCustomization>) => void;
  getCustomization: (charId: string) => Partial<CharacterCustomization> | undefined;
  resetCustomization: (charId: string) => void;
}

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    (set, get) => ({
      customizations: {},

      setCustomization: (charId, data) => {
        set((state) => ({
          customizations: {
            ...state.customizations,
            [charId]: { ...state.customizations[charId], ...data },
          },
        }));
      },

      getCustomization: (charId) => {
        return get().customizations[charId];
      },

      resetCustomization: (charId) => {
        set((state) => {
          const { [charId]: _, ...rest } = state.customizations;
          return { customizations: rest };
        });
      },
    }),
    {
      name: 'neuroom-customization',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
