import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAppVersionStore } from '@/src/config/appVersion';
import { useDuelExpiration } from '@/src/hooks/useDuelExpiration';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';

export default function TabLayout() {
  const theme = useAppTheme();
  const appVersion = useAppVersionStore((s) => s.appVersion);
  const age = useAgeStyles();

  useDuelExpiration();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          height: age.tabBarHeight,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: age.tabLabelSize,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: age.tabIconSize, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: 'ДЗ',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: age.tabIconSize, opacity: focused ? 1 : 0.6 }}>📚</Text>
          ),
        }}
      />
      {/* V0: скрываем Чат */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Чат',
          headerShown: false,
          href: appVersion < 1 ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: age.tabIconSize, opacity: focused ? 1 : 0.6 }}>💬</Text>
          ),
        }}
      />
      {/* V0: скрываем Рейтинг и Арену */}
      {/* V1: показываем Рейтинг, скрываем Арену */}
      {/* V2: показываем Арену, скрываем Рейтинг */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Рейтинг',
          headerShown: false,
          href: appVersion >= 2 || appVersion < 1 ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: age.tabIconSize, opacity: focused ? 1 : 0.6 }}>🏆</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="arena"
        options={{
          title: 'Арена',
          headerShown: false,
          href: appVersion < 2 ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: age.tabIconSize, opacity: focused ? 1 : 0.6 }}>⚔️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: age.tabIconSize, opacity: focused ? 1 : 0.6 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
