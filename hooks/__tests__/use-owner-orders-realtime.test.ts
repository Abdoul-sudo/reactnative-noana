// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock owner-analytics (fetchOwnerRestaurantId)
jest.mock('@/lib/api/owner-analytics', () => ({
  fetchOwnerRestaurantId: jest.fn(),
}));

// Mock owner-orders API
jest.mock('@/lib/api/owner-orders', () => ({
  fetchOrdersByStatus: jest.fn(),
  fetchOrderCounts: jest.fn(),
  mapOwnerOrder: jest.fn((row: Record<string, unknown>) => ({
    ...row,
    parsedItems: Array.isArray(row.items)
      ? (row.items as unknown[]).filter((i) => i && typeof i === 'object' && i !== null && 'name' in i)
      : [],
  })),
  isOrderRow: jest.fn(() => true),
}));

import { createElement } from 'react';
import { create, act } from 'react-test-renderer';
import { supabase } from '@/lib/supabase';
import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics';
import {
  fetchOrdersByStatus,
  fetchOrderCounts,
  mapOwnerOrder,
} from '@/lib/api/owner-orders';
import { useOwnerOrders } from '@/hooks/use-owner-orders';

const mockFetchOwnerRestaurantId = fetchOwnerRestaurantId as jest.MockedFunction<typeof fetchOwnerRestaurantId>;
const mockFetchOrdersByStatus = fetchOrdersByStatus as jest.MockedFunction<typeof fetchOrdersByStatus>;
const mockFetchOrderCounts = fetchOrderCounts as jest.MockedFunction<typeof fetchOrderCounts>;
const mockMapOwnerOrder = mapOwnerOrder as jest.MockedFunction<typeof mapOwnerOrder>;

// ── Supabase channel mock ────────────────────────────────

let capturedCallback: ((payload: any) => void) | null = null;
const mockRemoveChannel = jest.fn();
const mockSubscribe = jest.fn().mockReturnThis();
const mockOn = jest.fn().mockImplementation((_event: string, _filter: any, cb: any) => {
  capturedCallback = cb;
  return { subscribe: mockSubscribe };
});
const mockChannel = jest.fn().mockReturnValue({
  on: mockOn,
  subscribe: mockSubscribe,
});

jest.spyOn(supabase, 'channel').mockImplementation(mockChannel as any);
jest.spyOn(supabase, 'removeChannel').mockImplementation(mockRemoveChannel);

// ── Hook helper ─────────────────────────────────────────

type HookResult = ReturnType<typeof useOwnerOrders>;
let hookResult: HookResult;

function TestComponent({ userId }: { userId: string }) {
  hookResult = useOwnerOrders(userId);
  return null;
}

function renderHook(userId = 'u1') {
  return create(createElement(TestComponent, { userId }));
}

// ── Fixtures ────────────────────────────────────────────

const mockOrder = {
  id: 'order-1',
  user_id: 'u1',
  restaurant_id: 'r1',
  status: 'placed',
  items: [{ menu_item_id: 'm1', name: 'Yassa', price: 1500, quantity: 2, dietary_tags: [] }],
  delivery_address: { label: 'Home', address: '123 Rue', city: 'Alger' },
  subtotal: 3000,
  delivery_fee: 300,
  total: 3300,
  special_instructions: null,
  estimated_delivery_at: null,
  placed_at: '2026-02-27T10:00:00Z',
  confirmed_at: null,
  preparing_at: null,
  on_the_way_at: null,
  delivered_at: null,
  cancelled_at: null,
  updated_at: '2026-02-27T10:00:00Z',
};

// ── Tests ───────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  capturedCallback = null;

  mockFetchOwnerRestaurantId.mockResolvedValue('r1');
  mockFetchOrdersByStatus.mockResolvedValue([]);
  mockFetchOrderCounts.mockResolvedValue({
    placed: 0,
    confirmed: 0,
    preparing: 0,
    on_the_way: 0,
    delivered: 0,
  });

  // Re-wire channel mock
  mockChannel.mockReturnValue({
    on: mockOn,
    subscribe: mockSubscribe,
  });
  mockOn.mockImplementation((_event: string, _filter: any, cb: any) => {
    capturedCallback = cb;
    return { subscribe: mockSubscribe };
  });
});

describe('useOwnerOrders real-time subscription', () => {
  it('subscribes to channel when restaurantId is resolved', async () => {
    let renderer: any;
    await act(async () => {
      renderer = renderHook('u1');
    });

    expect(supabase.channel).toHaveBeenCalledWith('owner-orders:r1');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'restaurant_id=eq.r1',
      }),
      expect.any(Function),
    );

    renderer.unmount();
  });

  it('cleans up channel on unmount', async () => {
    let renderer: any;
    await act(async () => {
      renderer = renderHook('u1');
    });

    await act(async () => {
      renderer.unmount();
    });

    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('prepends new order to list on INSERT when matching active tab', async () => {
    let renderer: any;
    await act(async () => {
      renderer = renderHook('u1');
    });

    expect(capturedCallback).not.toBeNull();

    // Simulate INSERT event
    await act(async () => {
      capturedCallback!({
        eventType: 'INSERT',
        new: mockOrder,
        old: {},
      });
    });

    // The order should appear in the list (active tab = 'placed', order status = 'placed')
    expect(hookResult.orders).toHaveLength(1);
    expect(hookResult.orders[0].id).toBe('order-1');
    expect(hookResult.counts.placed).toBe(1);

    renderer.unmount();
  });

  it('tracks new order ID for highlight animation', async () => {
    let renderer: any;
    await act(async () => {
      renderer = renderHook('u1');
    });

    await act(async () => {
      capturedCallback!({
        eventType: 'INSERT',
        new: mockOrder,
        old: {},
      });
    });

    expect(hookResult.newOrderIds.has('order-1')).toBe(true);

    // Clear the highlight
    await act(async () => {
      hookResult.clearNewOrderId('order-1');
    });

    expect(hookResult.newOrderIds.has('order-1')).toBe(false);

    renderer.unmount();
  });

  it('does not add order to list when INSERT status does not match active tab', async () => {
    let renderer: any;
    await act(async () => {
      renderer = renderHook('u1');
    });

    // Active tab is 'placed', but new order is 'confirmed'
    await act(async () => {
      capturedCallback!({
        eventType: 'INSERT',
        new: { ...mockOrder, id: 'order-2', status: 'confirmed' },
        old: {},
      });
    });

    // Should NOT be in the list (wrong tab), but count should update
    expect(hookResult.orders).toHaveLength(0);
    expect(hookResult.counts.confirmed).toBe(1);

    renderer.unmount();
  });

  it('removes order from list on UPDATE when status changes away from active tab', async () => {
    // Pre-populate with an order in the list
    const { items: _items, ...orderBase } = mockOrder;
    mockFetchOrdersByStatus.mockResolvedValue([
      { ...orderBase, parsedItems: [{ menu_item_id: 'm1', name: 'Yassa', price: 1500, quantity: 2, dietary_tags: [] }] },
    ]);
    mockFetchOrderCounts.mockResolvedValue({
      placed: 1,
      confirmed: 0,
      preparing: 0,
      on_the_way: 0,
      delivered: 0,
    });

    let renderer: any;
    await act(async () => {
      renderer = renderHook('u1');
    });

    expect(hookResult.orders).toHaveLength(1);

    // Simulate UPDATE: order moves from placed → confirmed
    await act(async () => {
      capturedCallback!({
        eventType: 'UPDATE',
        new: { ...mockOrder, status: 'confirmed', confirmed_at: '2026-02-27T10:05:00Z' },
        old: { id: mockOrder.id },
      });
    });

    // Order should be removed from current tab (placed)
    expect(hookResult.orders).toHaveLength(0);
    // Counts should adjust
    expect(hookResult.counts.placed).toBe(0);
    expect(hookResult.counts.confirmed).toBe(1);

    renderer.unmount();
  });

  it('does not subscribe when no restaurantId', async () => {
    mockFetchOwnerRestaurantId.mockResolvedValue(null);

    let renderer: any;
    await act(async () => {
      renderer = renderHook('u1');
    });

    // Channel should not be created since restaurantId is null
    expect(supabase.channel).not.toHaveBeenCalled();

    renderer.unmount();
  });
});
