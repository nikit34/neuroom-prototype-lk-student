import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useChatStore, AI_TUTOR_ID } from '@/src/stores/chatStore';
import OnboardingScreen from './onboarding';
import DevModeOverlay from '@/src/components/dev/DevModeOverlay';
import CelebrationOverlay from '@/src/components/CelebrationOverlay';
import LootChestOverlay from '@/src/components/rewards/LootChestOverlay';
import { setupNotificationHandler, addNotificationResponseListener } from '@/src/services/notificationService';

setupNotificationHandler();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const hasHydrated = useOnboardingStore((s) => s._hasHydrated);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [loaded, hasHydrated]);

  if (!loaded || !hasHydrated) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const theme = useAppTheme();
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted);
  const chatOnboardingStep = useChatStore((s) => s.chatOnboardingStep);
  const responseListener = useRef<{ remove: () => void } | null>(null);
  const wasOnboardingCompleted = useRef(isOnboardingCompleted);

  useEffect(() => {
    if (!wasOnboardingCompleted.current && isOnboardingCompleted && chatOnboardingStep !== 'done') {
      router.replace(`/chat/${AI_TUTOR_ID}` as any);
    }
    wasOnboardingCompleted.current = isOnboardingCompleted;
  }, [isOnboardingCompleted, chatOnboardingStep]);

  useEffect(() => {
    responseListener.current = addNotificationResponseListener((data) => {
      if (data?.screen === 'ai-tutor-chat') {
        router.push('/chat/ai-tutor' as any);
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  if (!isOnboardingCompleted) {
    return <OnboardingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: theme.colors.background },
          headerBackTitle: '',
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen
          name="homework/[id]"
          options={{ title: 'Детали задания' }}
        />
        <Stack.Screen
          name="homework/submit/[id]"
          options={{ title: 'Сдача работы' }}
        />
        <Stack.Screen
          name="homework/feedback/[id]"
          options={{ title: 'Обратная связь' }}
        />
        <Stack.Screen
          name="chat/[teacherId]"
          options={{ title: 'Чат с учителем' }}
        />
        <Stack.Screen
          name="achievements/[id]"
          options={{ title: 'Достижение' }}
        />
        <Stack.Screen
          name="arena/create-duel"
          options={{ title: 'Вызвать на дуэль' }}
        />
        <Stack.Screen
          name="arena/duel/[id]"
          options={{ title: 'Дуэль' }}
        />
        <Stack.Screen
          name="arena/quest/[id]"
          options={{ title: 'Квест' }}
        />
        <Stack.Screen
          name="arena/challenge/[id]"
          options={{ title: 'Испытание' }}
        />
        <Stack.Screen
          name="arena/online"
          options={{ title: 'Онлайн-дуэль' }}
        />
        <Stack.Screen
          name="arena/online/[code]"
          options={{ title: 'Дуэль', headerShown: false }}
        />
      </Stack>
      <CelebrationOverlay />
      <LootChestOverlay />
      <DevModeOverlay />
    </GestureHandlerRootView>
  );
}
