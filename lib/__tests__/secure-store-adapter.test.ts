// Mock Platform to simulate native environment (so isNative === true)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

// Mock expo-secure-store with an in-memory store to test the real adapter.
// Jest requires variables referenced inside jest.mock() to start with "mock".
const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockStore.delete(key);
    return Promise.resolve();
  }),
}));

import { ExpoSecureStoreAdapter } from '@/lib/supabase';

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();
});

describe('ExpoSecureStoreAdapter', () => {
  it('stores and retrieves short values as a single key', async () => {
    await ExpoSecureStoreAdapter.setItem('token', 'short-value');
    const result = await ExpoSecureStoreAdapter.getItem('token');
    expect(result).toBe('short-value');
    expect(mockStore.has('token_count')).toBe(false);
  });

  it('stores values exactly at the 2048-byte limit without chunking', async () => {
    const exact = 'b'.repeat(2048);
    await ExpoSecureStoreAdapter.setItem('token', exact);
    const result = await ExpoSecureStoreAdapter.getItem('token');
    expect(result).toBe(exact);
    expect(mockStore.has('token_count')).toBe(false);
  });

  it('chunks values exceeding 2048 bytes', async () => {
    const large = 'c'.repeat(3000);
    await ExpoSecureStoreAdapter.setItem('token', large);
    expect(mockStore.get('token_count')).toBe('2');
    expect(mockStore.has('token_0')).toBe(true);
    expect(mockStore.has('token_1')).toBe(true);
    const result = await ExpoSecureStoreAdapter.getItem('token');
    expect(result).toBe(large);
  });

  it('handles a realistic Supabase session size (~2800 bytes)', async () => {
    const session = JSON.stringify({
      access_token: 'a'.repeat(1200),
      refresh_token: 'r'.repeat(800),
      expires_at: Date.now(),
      user: { id: 'uuid', email: 'test@test.com' },
    });
    await ExpoSecureStoreAdapter.setItem('sb-session', session);
    const result = await ExpoSecureStoreAdapter.getItem('sb-session');
    expect(result).toBe(session);
  });

  it('cleans up old chunks when switching from chunked to non-chunked (H1 fix)', async () => {
    await ExpoSecureStoreAdapter.setItem('token', 'x'.repeat(3000));
    expect(mockStore.has('token_0')).toBe(true);
    expect(mockStore.has('token_1')).toBe(true);

    await ExpoSecureStoreAdapter.setItem('token', 'short');
    const result = await ExpoSecureStoreAdapter.getItem('token');
    expect(result).toBe('short');
    expect(mockStore.has('token_0')).toBe(false);
    expect(mockStore.has('token_1')).toBe(false);
    expect(mockStore.has('token_count')).toBe(false);
  });

  it('cleans up stale chunks when chunk count decreases (H2 fix)', async () => {
    await ExpoSecureStoreAdapter.setItem('token', 'y'.repeat(5000));
    expect(mockStore.get('token_count')).toBe('3');
    expect(mockStore.has('token_2')).toBe(true);

    await ExpoSecureStoreAdapter.setItem('token', 'z'.repeat(3000));
    expect(mockStore.get('token_count')).toBe('2');
    expect(mockStore.has('token_2')).toBe(false);
    const result = await ExpoSecureStoreAdapter.getItem('token');
    expect(result).toBe('z'.repeat(3000));
  });

  it('removeItem cleans up all keys including chunks', async () => {
    await ExpoSecureStoreAdapter.setItem('token', 'a'.repeat(5000));
    expect(mockStore.size).toBeGreaterThan(1);
    await ExpoSecureStoreAdapter.removeItem('token');
    expect(mockStore.size).toBe(0);
  });

  it('getItem returns null for non-existent key', async () => {
    const result = await ExpoSecureStoreAdapter.getItem('nonexistent');
    expect(result).toBeNull();
  });
});
