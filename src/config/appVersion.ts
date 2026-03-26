/**
 * App version control
 *
 * V0: Главная (упрощённая), ДЗ, Профиль — минимальный MVP
 * V1: + Чат (AI-репетитор), Рейтинг, Персонаж, Уведомления, Геймификация
 * V2: + Арена (дуэли, квесты, испытания, достижения) + Прогресс
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppVersion = 0 | 1 | 2;

interface AppVersionState {
  appVersion: AppVersion;
  setAppVersion: (v: AppVersion) => void;
}

export const useAppVersionStore = create<AppVersionState>()(
  persist(
    (set) => ({
      appVersion: 2,
      setAppVersion: (v) => set({ appVersion: v }),
    }),
    {
      name: 'neuroom-app-version',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
