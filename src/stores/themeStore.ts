import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme } from '../types';
import { themes, defaultTheme } from '../theme/themes';

interface ThemeState {
  themeId: string;
  characterId: string;
  setTheme: (id: string) => void;
  setCharacter: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeId: defaultTheme.id,
      characterId: defaultTheme.characters[0].id,

      setTheme: (id) => {
        const theme = themes.find((t) => t.id === id);
        if (!theme) return;

        const currentCharacterId = get().characterId;
        // Если текущий персонаж не принадлежит новой теме — ставим первого из новой
        const characterBelongsToNewTheme = theme.characters.some(
          (c) => c.id === currentCharacterId,
        );

        set({
          themeId: id,
          characterId: characterBelongsToNewTheme
            ? currentCharacterId
            : theme.characters[0].id,
        });
      },

      setCharacter: (id) => {
        // Разрешаем любого персонажа из любой темы
        const allCharacters = themes.flatMap((t) => t.characters);
        if (allCharacters.some((c) => c.id === id)) {
          set({ characterId: id });
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
