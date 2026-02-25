import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { updatePushToken } from '@/lib/api/profiles';

// Show push notifications even when the app is in the foreground.
// Without this, notifications are silently swallowed when the user
// is actively using the app (e.g. browsing restaurants while their
// order status changes).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permission, get Expo push token, and store it in the DB.
 * Returns the token string or null if permission denied.
 */
export async function registerForPushNotificationsAsync(
  userId: string,
): Promise<string | null> {
  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const token = tokenData.data;

  // Store token in profiles table
  await updatePushToken(userId, token);

  // Android: set notification channel for order updates
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  return token;
}

/**
 * Set up notification tap listener. When user taps a notification
 * containing an orderId, navigate to the order tracking screen.
 * Returns a cleanup function to remove the listener.
 */
export function setupNotificationListeners(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data?.orderId) {
        router.push(`/order/${data.orderId}`);
      }
    },
  );

  return () => subscription.remove();
}
