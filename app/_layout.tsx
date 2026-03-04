import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useOnboardingStore } from '@/src/stores/onboardingStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const theme = useAppTheme();
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted);

  useEffect(() => {
    if (!isOnboardingCompleted) {
      router.replace('/onboarding' as any);
    }
  }, [isOnboardingCompleted]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      </Stack>
    </View>
  );
}
