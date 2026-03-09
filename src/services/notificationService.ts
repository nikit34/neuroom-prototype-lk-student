let Notifications: typeof import('expo-notifications') | null = null;

try {
  Notifications = require('expo-notifications');
} catch {
  // expo-notifications not available (Expo Go / web)
}

export function setupNotificationHandler() {
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function addNotificationResponseListener(
  callback: (data: Record<string, unknown> | undefined) => void,
): { remove: () => void } | null {
  if (!Notifications) return null;

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    callback(response.notification.request.content.data);
  });

  return sub;
}

export async function sendTestPush(): Promise<boolean> {
  if (!Notifications) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'AI-Репетитор',
      body: 'У тебя есть нерешённые задания! Давай разберём их вместе 💡',
      data: { screen: 'ai-tutor-chat' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });

  return true;
}
