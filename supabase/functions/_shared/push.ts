const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification via Expo's Push API.
 * Reused by notify-order-status (Story 5.6) and notify-new-order (Story 8.2).
 */
export async function sendPush(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    }),
  });

  if (!response.ok) {
    console.error('Push notification failed:', await response.text());
  }
}
