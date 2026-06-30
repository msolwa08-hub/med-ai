import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// Configure how notifications are handled when the app is foregrounded
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permission, get the Expo push token, and register
 * it with the backend. Returns the token string or null if permission was
 * denied or the device is a simulator without push support.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Expo push notifications only work on physical devices
  // On web / simulators getExpoPushTokenAsync may throw — guard gracefully
  try {
    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permission denied');
      return null;
    }

    // TODO: replace 'medai-project-id' with the EAS projectId from app.config.js
    // The projectId is defined in app.json under expo.extra.eas.projectId
    const token = await ExpoNotifications.getExpoPushTokenAsync({
      projectId: 'medai-project-id',
    });

    // Register token with backend
    await apiClient.post('/notifications/register-token', { token: token.data });

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A3A6B',
      });
    }

    return token.data;
  } catch (err) {
    console.warn('[Push] Could not register for push notifications:', err);
    return null;
  }
}

/**
 * Sets up a tap listener that navigates to the relevant screen when the
 * user taps a notification. Call once at app startup and clean up on unmount.
 *
 * @param navigation - React Navigation navigation object
 */
export function setupNotificationListeners(navigation: {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}): () => void {
  const subscription = ExpoNotifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const screen = data?.screen as string | undefined;

      if (!screen) return;

      const params: Record<string, unknown> = {};
      if (data.consultationId) {
        params.consultationId = data.consultationId;
      }

      try {
        navigation.navigate(screen, params);
      } catch {
        console.warn(`[Push] Could not navigate to screen: ${screen}`);
      }
    }
  );

  return () => {
    subscription.remove();
  };
}
