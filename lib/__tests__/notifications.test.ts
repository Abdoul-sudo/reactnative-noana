jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── registerForPushNotificationsAsync ────────────────────────────────────────

describe('registerForPushNotificationsAsync', () => {
  it('returns null when permission is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await registerForPushNotificationsAsync('user-1');

    expect(result).toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('gets token and stores it when permission is granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'ExponentPushToken[abc123]',
    });

    // Mock supabase update chain
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    const result = await registerForPushNotificationsAsync('user-1');

    expect(result).toBe('ExponentPushToken[abc123]');
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'test-project-id',
    });
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith({ push_token: 'ExponentPushToken[abc123]' });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('requests permission when not yet granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'ExponentPushToken[xyz]',
    });

    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    const result = await registerForPushNotificationsAsync('user-2');

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(result).toBe('ExponentPushToken[xyz]');
  });
});
