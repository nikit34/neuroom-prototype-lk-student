import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

export function setupNotificationHandler() {
  if (isExpoGo) return;
  Notifications.setNotificationHandler({
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
  if (isExpoGo) return null;

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    callback(response.notification.request.content.data);
  });

  return sub;
}

export async function sendTestPush(): Promise<boolean> {
  if (isExpoGo) return false;

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
