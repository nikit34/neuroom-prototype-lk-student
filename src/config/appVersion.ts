/**
 * App version control
 *
 * V1: Главная, ДЗ, Чат (AI-репетитор), Рейтинг, Профиль
 * V2: + Арена (дуэли, квесты, испытания, достижения) + Прогресс
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppVersion = 1 | 2;

interface AppVersionState {
  appVersion: AppVersion;
  setAppVersion: (v: AppVersion) => void;
}

export const useAppVersionStore = create<AppVersionState>()(
  persist(
    (set) => ({
      appVersion: 1,
      setAppVersion: (v) => set({ appVersion: v }),
    }),
    {
      name: 'neuroom-app-version',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
