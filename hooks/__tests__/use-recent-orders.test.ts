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

// Mock the orders API module
jest.mock('@/lib/api/orders', () => ({
  fetchOrdersByUser: jest.fn(),
}));

// Mock the auth store
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

import { createElement } from 'react';
import { create, act } from 'react-test-renderer';
import { fetchOrdersByUser } from '@/lib/api/orders';
import { useAuthStore } from '@/stores/auth-store';
import { useRecentOrders } from '@/hooks/use-recent-orders';
import { type OrderWithRestaurant } from '@/lib/api/orders';

const mockFetchOrdersByUser = fetchOrdersByUser as jest.MockedFunction<typeof fetchOrdersByUser>;
const mockUseAuthStore = useAuthStore as unknown as jest.MockedFunction<(selector: any) => any>;

// Helper: captures hook return value via a tiny component
type HookResult = ReturnType<typeof useRecentOrders>;
let hookResult: HookResult;

function TestComponent() {
  hookResult = useRecentOrders();
  return null;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<OrderWithRestaurant> & { restaurant_id: string }): OrderWithRestaurant {
  return {
    id: 'order-' + Math.random().toString(36).slice(2, 8),
    user_id: 'user-1',
    restaurant_id: overrides.restaurant_id,
    status: 'delivered',
    items: [],
    delivery_address: {},
    subtotal: 1000,
    delivery_fee: 200,
    total: 1200,
    special_instructions: null,
    placed_at: '2026-02-25T10:00:00Z',
    confirmed_at: null,
    preparing_at: null,
    on_the_way_at: null,
    delivered_at: '2026-02-25T11:00:00Z',
    cancelled_at: null,
    estimated_delivery_at: null,
    updated_at: '2026-02-25T11:00:00Z',
    restaurants: { name: 'Restaurant A', cover_image_url: null },
    ...overrides,
  } as OrderWithRestaurant;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: authenticated user
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({ session: { user: { id: 'user-1' } } }),
  );
});

describe('useRecentOrders', () => {
  it('filters to delivered orders and de-duplicates by restaurant', async () => {
    const orders: OrderWithRestaurant[] = [
      makeOrder({ restaurant_id: 'rest-1', status: 'delivered' }),
      makeOrder({ restaurant_id: 'rest-1', status: 'delivered' }), // duplicate restaurant
      makeOrder({ restaurant_id: 'rest-2', status: 'delivered' }),
      makeOrder({ restaurant_id: 'rest-3', status: 'on_the_way' }), // not delivered
    ];
    mockFetchOrdersByUser.mockResolvedValue(orders);

    await act(async () => {
      create(createElement(TestComponent));
    });

    expect(hookResult.isLoading).toBe(false);
    expect(hookResult.error).toBeNull();
    // Should have 2 unique restaurants (rest-1 de-duped, rest-3 filtered out)
    expect(hookResult.orders).toHaveLength(2);
    expect(hookResult.orders[0].restaurant_id).toBe('rest-1');
    expect(hookResult.orders[1].restaurant_id).toBe('rest-2');
  });

  it('returns empty array when user is not authenticated', async () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ session: null }),
    );

    await act(async () => {
      create(createElement(TestComponent));
    });

    expect(hookResult.isLoading).toBe(false);
    expect(hookResult.orders).toEqual([]);
    expect(mockFetchOrdersByUser).not.toHaveBeenCalled();
  });
});
