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
  fetchOrderDetail,
  updateOrderStatus,
  getNextStatus,
  getStatusActionLabel,
  type OwnerOrder,
} from '@/lib/api/owner-orders';

// Helper to mock supabase.functions.invoke (functions is a getter returning new objects)
const mockFunctionsInvoke = jest.fn();
const originalFunctionsDescriptor = Object.getOwnPropertyDescriptor(supabase, 'functions');

beforeEach(() => {
  jest.clearAllMocks();
  mockFunctionsInvoke.mockReset();
});

afterAll(() => {
  // Restore original functions property
  if (originalFunctionsDescriptor) {
    Object.defineProperty(supabase, 'functions', originalFunctionsDescriptor);
  }
});

// Override functions getter to return our mock invoke
Object.defineProperty(supabase, 'functions', {
  get: () => ({ invoke: mockFunctionsInvoke }),
  configurable: true,
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

// ── fetchOrderDetail ──────────────────────────────────

describe('fetchOrderDetail', () => {
  it('fetches order with customer name from profiles join', async () => {
    const detailRow = {
      ...mockOrderRow,
      profiles: { display_name: 'Mohamed Ali' },
    };
    const mockSingle = jest.fn().mockResolvedValue({ data: detailRow, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrderDetail('o1');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(mockSelect).toHaveBeenCalledWith('*, profiles:user_id(display_name)');
    expect(mockEq).toHaveBeenCalledWith('id', 'o1');

    expect(result.customerName).toBe('Mohamed Ali');
    expect(result.parsedItems).toHaveLength(2);
    expect(result.parsedAddress).not.toBeNull();
    expect(result.parsedAddress?.address).toBe('123 Rue Test');
    expect(result.parsedAddress?.label).toBe('Home');
  });

  it('defaults customer name to "Customer" when profiles is null', async () => {
    const detailRow = { ...mockOrderRow, profiles: null };
    const mockSingle = jest.fn().mockResolvedValue({ data: detailRow, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrderDetail('o1');
    expect(result.customerName).toBe('Customer');
  });

  it('parses delivery address as null when invalid', async () => {
    const detailRow = { ...mockOrderRow, delivery_address: 'not-an-object', profiles: null };
    const mockSingle = jest.fn().mockResolvedValue({ data: detailRow, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrderDetail('o1');
    expect(result.parsedAddress).toBeNull();
  });

  it('throws on Supabase error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchOrderDetail('o1')).rejects.toEqual({ message: 'Not found' });
  });
});

// ── updateOrderStatus ─────────────────────────────────

describe('updateOrderStatus', () => {
  it('updates status and sets timestamp column', async () => {
    const now = '2026-02-27T12:00:00.000Z';
    jest.useFakeTimers();
    jest.setSystemTime(new Date(now));

    const updatedRow = { ...mockOrderRow, status: 'confirmed', confirmed_at: now };
    const mockSingle = jest.fn().mockResolvedValue({ data: updatedRow, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    mockFunctionsInvoke.mockResolvedValue({ data: null, error: null });

    const result = await updateOrderStatus('o1', 'confirmed');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'confirmed',
        confirmed_at: now,
        updated_at: now,
      }),
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'o1');
    expect(result.status).toBe('confirmed');

    // Edge function called fire-and-forget
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('notify-order-status', {
      body: { orderId: 'o1' },
    });

    jest.useRealTimers();
  });

  it('does not set timestamp for placed status', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-27T12:00:00.000Z'));

    const updatedRow = { ...mockOrderRow };
    const mockSingle = jest.fn().mockResolvedValue({ data: updatedRow, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: null });

    await updateOrderStatus('o1', 'placed');

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe('placed');
    expect(updateArg.confirmed_at).toBeUndefined();
    expect(updateArg.preparing_at).toBeUndefined();

    jest.useRealTimers();
  });

  it('throws on DB error but does not call edge function', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB fail' } });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await expect(updateOrderStatus('o1', 'confirmed')).rejects.toEqual({ message: 'DB fail' });
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it('succeeds even when edge function fails (fire-and-forget)', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-27T12:00:00.000Z'));

    const updatedRow = { ...mockOrderRow, status: 'preparing' };
    const mockSingle = jest.fn().mockResolvedValue({ data: updatedRow, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);
    mockFunctionsInvoke.mockRejectedValue(new Error('Edge function error'));

    // Should NOT throw even though edge function fails
    const result = await updateOrderStatus('o1', 'preparing');
    expect(result.status).toBe('preparing');

    jest.useRealTimers();
  });
});

// ── getNextStatus ─────────────────────────────────────

describe('getNextStatus', () => {
  it('returns confirmed for placed', () => {
    expect(getNextStatus('placed')).toBe('confirmed');
  });

  it('returns preparing for confirmed', () => {
    expect(getNextStatus('confirmed')).toBe('preparing');
  });

  it('returns on_the_way for preparing', () => {
    expect(getNextStatus('preparing')).toBe('on_the_way');
  });

  it('returns delivered for on_the_way', () => {
    expect(getNextStatus('on_the_way')).toBe('delivered');
  });

  it('returns null for delivered (terminal)', () => {
    expect(getNextStatus('delivered')).toBeNull();
  });

  it('returns null for cancelled (not in pipeline)', () => {
    expect(getNextStatus('cancelled')).toBeNull();
  });
});

// ── getStatusActionLabel ──────────────────────────────

describe('getStatusActionLabel', () => {
  it('returns "Confirm Order" for confirmed', () => {
    expect(getStatusActionLabel('confirmed')).toBe('Confirm Order');
  });

  it('returns "Start Preparing" for preparing', () => {
    expect(getStatusActionLabel('preparing')).toBe('Start Preparing');
  });

  it('returns "Mark Ready" for on_the_way', () => {
    expect(getStatusActionLabel('on_the_way')).toBe('Mark Ready');
  });

  it('returns "Mark Delivered" for delivered', () => {
    expect(getStatusActionLabel('delivered')).toBe('Mark Delivered');
  });

  it('returns fallback for unknown status', () => {
    expect(getStatusActionLabel('unknown' as any)).toBe('Update Status');
  });
});
