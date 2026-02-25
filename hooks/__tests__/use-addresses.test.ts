// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native Platform + AppState + Appearance (Appearance needed by NativeWind)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock the addresses API module
jest.mock('@/lib/api/addresses', () => ({
  fetchAddresses: jest.fn(),
}));

import { createElement } from 'react';
import { create, act } from 'react-test-renderer';
import { fetchAddresses } from '@/lib/api/addresses';
import { useAddresses } from '@/hooks/use-addresses';
import { type Address } from '@/lib/api/addresses';

const mockFetchAddresses = fetchAddresses as jest.MockedFunction<typeof fetchAddresses>;

const mockAddresses: Address[] = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    user_id: 'user-123',
    label: 'Home',
    address: '45 Rue Abane Ramdane, Alger',
    city: 'Alger',
    lat: 36.7538,
    lng: 3.0588,
    is_default: true,
    created_at: '2026-02-25T10:00:00Z',
    updated_at: '2026-02-25T10:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    user_id: 'user-123',
    label: 'Work',
    address: '10 Rue Didouche Mourad',
    city: 'Alger',
    lat: 36.76,
    lng: 3.06,
    is_default: false,
    created_at: '2026-02-25T11:00:00Z',
    updated_at: '2026-02-25T11:00:00Z',
  },
];

// Helper: captures hook return value via a tiny component
type HookResult = ReturnType<typeof useAddresses>;
let hookResult: HookResult;

function TestComponent({ userId }: { userId: string }) {
  hookResult = useAddresses(userId);
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAddresses', () => {
  it('returns loading true initially, then addresses on success', async () => {
    mockFetchAddresses.mockResolvedValue(mockAddresses);

    await act(async () => {
      create(createElement(TestComponent, { userId: 'user-123' }));
    });

    expect(hookResult.isLoading).toBe(false);
    expect(hookResult.addresses).toEqual(mockAddresses);
    expect(hookResult.error).toBeNull();
    expect(mockFetchAddresses).toHaveBeenCalledWith('user-123');
  });

  it('returns error on fetch failure', async () => {
    mockFetchAddresses.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      create(createElement(TestComponent, { userId: 'user-123' }));
    });

    expect(hookResult.isLoading).toBe(false);
    expect(hookResult.addresses).toEqual([]);
    expect(hookResult.error).toEqual(new Error('Network error'));
  });

  it('refetch reloads data', async () => {
    mockFetchAddresses.mockResolvedValue(mockAddresses);

    await act(async () => {
      create(createElement(TestComponent, { userId: 'user-123' }));
    });

    expect(mockFetchAddresses).toHaveBeenCalledTimes(1);
    expect(hookResult.addresses).toEqual(mockAddresses);

    // Update mock to return new data on next call
    const updatedAddresses = [...mockAddresses, {
      ...mockAddresses[0],
      id: 'd1000000-0000-0000-0000-000000000003',
      label: 'Gym',
    }];
    mockFetchAddresses.mockResolvedValue(updatedAddresses);

    await act(async () => {
      await hookResult.refetch();
    });

    expect(mockFetchAddresses).toHaveBeenCalledTimes(2);
    expect(hookResult.addresses).toEqual(updatedAddresses);
  });
});
