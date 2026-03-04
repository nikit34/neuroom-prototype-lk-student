import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme } from '../types';
import { themes, defaultTheme } from './themes';

const THEME_STORAGE_KEY = '@neuroom_theme_id';

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

interface ThemeState {
  theme: AppTheme;
  isLoaded: boolean;
  setTheme: (themeId: string) => void;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: defaultTheme,
  isLoaded: false,

  setTheme: (themeId: string) => {
    const found = themes.find((t) => t.id === themeId);
    if (!found) return;
    set({ theme: found });
    AsyncStorage.setItem(THEME_STORAGE_KEY, themeId).catch(() => {});
  },

  loadSavedTheme: async () => {
    try {
      const savedId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedId) {
        const found = themes.find((t) => t.id === savedId);
        if (found) {
          set({ theme: found, isLoaded: true });
          return;
        }
      }
    } catch {
      // Ошибка чтения — используем тему по умолчанию
    }
    set({ isLoaded: true });
  },
}));

// ---------------------------------------------------------------------------
// React context (для удобного доступа из компонентов)
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (themeId: string) => void;
  themes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  setTheme: () => {},
  themes,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const loadSavedTheme = useThemeStore((s) => s.loadSavedTheme);
  const isLoaded = useThemeStore((s) => s.isLoaded);

  useEffect(() => {
    loadSavedTheme();
  }, [loadSavedTheme]);

  // Пока тема не загружена из хранилища — ничего не рендерим,
  // чтобы избежать мерцания при смене темы.
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
