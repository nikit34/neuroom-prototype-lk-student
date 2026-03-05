import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme } from '../types';
import { themes, allCharacters, defaultTheme } from '../theme/themes';

type AgeGroup = 'junior' | 'senior';

interface ThemeState {
  themeId: string;
  characterId: string;
  ageGroup: AgeGroup;
  setTheme: (id: string) => void;
  setCharacter: (id: string) => void;
  setAgeGroup: (group: AgeGroup) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeId: defaultTheme.id,
      characterId: 'pk-pikachu',
      ageGroup: 'senior' as AgeGroup,

      setTheme: (id) => {
        const theme = themes.find((t) => t.id === id);
        if (!theme) return;
        set({ themeId: id });
      },

      setCharacter: (id) => {
        if (allCharacters.some((c) => c.id === id)) {
          set({ characterId: id });
        }
      },

      setAgeGroup: (group) => {
        const currentTheme = themes.find((t) => t.id === get().themeId);
        // Если текущая тема уже из нужной группы — не меняем
        if (currentTheme?.ageGroup === group) {
          set({ ageGroup: group });
          return;
        }
        // Ставим первую тему из новой группы
        const firstTheme = themes.find((t) => t.ageGroup === group);
        if (firstTheme) {
          set({
            ageGroup: group,
            themeId: firstTheme.id,
          });
        }
      },
    }),
    {
      name: 'neuroom-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function getTheme(themeId?: string): AppTheme {
  const id = themeId ?? useThemeStore.getState().themeId;
  return themes.find((t) => t.id === id) ?? defaultTheme;
}
