// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native Platform + AppState + Appearance
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock the favorites API module
jest.mock('@/lib/api/favorites', () => ({
  fetchFavoriteRestaurants: jest.fn(),
}));

// Mock the auth store
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

import { createElement } from 'react';
import { create, act } from 'react-test-renderer';
import { fetchFavoriteRestaurants } from '@/lib/api/favorites';
import { useAuthStore } from '@/stores/auth-store';
import { useFavoriteRestaurants } from '@/hooks/use-favorite-restaurants';
import { type Restaurant } from '@/lib/api/restaurants';

const mockFetchFavoriteRestaurants = fetchFavoriteRestaurants as jest.MockedFunction<
  typeof fetchFavoriteRestaurants
>;
const mockUseAuthStore = useAuthStore as unknown as jest.MockedFunction<
  (selector: any) => any
>;

// Helper: captures hook return value via a tiny component
type HookResult = ReturnType<typeof useFavoriteRestaurants>;
let hookResult: HookResult;

function TestComponent() {
  hookResult = useFavoriteRestaurants();
  return null;
}

function makeRestaurant(id: string, name: string): Restaurant {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    cuisine_type: 'Italian',
    rating: 4.5,
    delivery_time_min: 30,
    cover_image_url: null,
    dietary_options: [],
    price_range: '$$',
    is_active: true,
    is_featured: false,
    created_at: '2026-02-20T10:00:00Z',
    description: null,
    lat: null,
    lng: null,
    updated_at: '2026-02-20T10:00:00Z',
  } as Restaurant;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: authenticated user
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({ session: { user: { id: 'user-1' } } }),
  );
});

describe('useFavoriteRestaurants', () => {
  it('returns favorite restaurants for authenticated user', async () => {
    const restaurants: Restaurant[] = [
      makeRestaurant('rest-1', 'Pizza Palace'),
      makeRestaurant('rest-2', 'Sushi Bar'),
    ];
    mockFetchFavoriteRestaurants.mockResolvedValue(restaurants);

    await act(async () => {
      create(createElement(TestComponent));
    });

    expect(hookResult.isLoading).toBe(false);
    expect(hookResult.error).toBeNull();
    expect(hookResult.restaurants).toHaveLength(2);
    expect(hookResult.restaurants[0].name).toBe('Pizza Palace');
    expect(mockFetchFavoriteRestaurants).toHaveBeenCalledWith('user-1');
  });

  it('returns empty array when user is not authenticated', async () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ session: null }),
    );

    await act(async () => {
      create(createElement(TestComponent));
    });

    expect(hookResult.isLoading).toBe(false);
    expect(hookResult.restaurants).toEqual([]);
    expect(mockFetchFavoriteRestaurants).not.toHaveBeenCalled();
  });
});
