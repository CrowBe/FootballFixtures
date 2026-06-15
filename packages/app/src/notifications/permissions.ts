import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const GOALS_CHANNEL_ID = 'goals';

export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(GOALS_CHANNEL_ID, {
    name: 'Goals & Match Events',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F55B00',
    enableLights: true,
    enableVibrate: true,
  });
}

/** Request notification permission and return the Expo push token, or null if unavailable. */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] Push notifications require a physical device.');
    return null;
  }

  await setupAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status: final } =
    existing === 'granted' ? { status: existing } : await Notifications.requestPermissionsAsync();

  if (final !== 'granted') {
    console.warn('[push] Notification permission not granted.');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.warn('[push] eas.projectId not set in app.json — token registration skipped.');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (e) {
    console.error('[push] getExpoPushTokenAsync failed:', e);
    return null;
  }
}
