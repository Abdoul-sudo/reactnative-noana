// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native Platform + AppState (required by supabase.ts)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import {
  fetchOrdersByStatus,
  fetchOrderCounts,
  type OwnerOrder,
} from '@/lib/api/owner-orders';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────

const mockOrderRow = {
  id: 'o1000000-0000-0000-0000-000000000001',
  user_id: 'u1000000-0000-0000-0000-000000000001',
  restaurant_id: 'r1000000-0000-0000-0000-000000000001',
  status: 'placed',
  items: [
    { menu_item_id: 'm1', name: 'Poulet Yassa', price: 1500, quantity: 2, dietary_tags: ['Halal'] },
    { menu_item_id: 'm2', name: 'Thieboudienne', price: 1200, quantity: 1, dietary_tags: [] },
  ],
  delivery_address: { label: 'Home', address: '123 Rue Test', city: 'Alger', lat: 36.75, lng: 3.06 },
  subtotal: 4200,
  delivery_fee: 300,
  total: 4500,
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

// ── fetchOrdersByStatus ─────────────────────────────────

describe('fetchOrdersByStatus', () => {
  it('fetches orders filtered by restaurant_id and status', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockOrderRow], error: null });
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrdersByStatus('r1000000-0000-0000-0000-000000000001', 'placed');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq1).toHaveBeenCalledWith('restaurant_id', 'r1000000-0000-0000-0000-000000000001');
    expect(mockEq2).toHaveBeenCalledWith('status', 'placed');
    expect(mockOrder).toHaveBeenCalledWith('placed_at', { ascending: false });

    expect(result).toHaveLength(1);
    expect(result[0].parsedItems).toHaveLength(2);
    expect(result[0].parsedItems[0].name).toBe('Poulet Yassa');
  });

  it('parses items as empty array when items is not an array', async () => {
    const brokenRow = { ...mockOrderRow, items: 'not-an-array' };
    const mockOrder = jest.fn().mockResolvedValue({ data: [brokenRow], error: null });
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrdersByStatus('r1', 'placed');
    expect(result[0].parsedItems).toEqual([]);
  });

  it('filters out invalid items in JSONB array', async () => {
    const rowWithBadItems = {
      ...mockOrderRow,
      items: [
        { menu_item_id: 'm1', name: 'Valid', price: 100, quantity: 1, dietary_tags: [] },
        { bad: 'item' },
        null,
        42,
      ],
    };
    const mockOrder = jest.fn().mockResolvedValue({ data: [rowWithBadItems], error: null });
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrdersByStatus('r1', 'placed');
    expect(result[0].parsedItems).toHaveLength(1);
    expect(result[0].parsedItems[0].name).toBe('Valid');
  });

  it('throws on Supabase error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchOrdersByStatus('r1', 'placed')).rejects.toEqual({ message: 'DB error' });
  });

  it('returns empty array when no data', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrdersByStatus('r1', 'placed');
    expect(result).toEqual([]);
  });
});

// ── fetchOrderCounts ────────────────────────────────────

describe('fetchOrderCounts', () => {
  it('returns count per status using parallel queries', async () => {
    const mockEq2 = jest.fn().mockResolvedValue({ count: 3, error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const counts = await fetchOrderCounts('r1');

    // Should call from('orders') 5 times (one per status)
    expect(supabase.from).toHaveBeenCalledTimes(5);
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });

    // Each status should have count 3
    expect(counts.placed).toBe(3);
    expect(counts.confirmed).toBe(3);
    expect(counts.preparing).toBe(3);
    expect(counts.on_the_way).toBe(3);
    expect(counts.delivered).toBe(3);
  });

  it('returns 0 for statuses that error', async () => {
    const mockEq2 = jest.fn().mockResolvedValue({ count: null, error: { message: 'fail' } });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const counts = await fetchOrderCounts('r1');
    expect(counts.placed).toBe(0);
    expect(counts.confirmed).toBe(0);
  });
});
