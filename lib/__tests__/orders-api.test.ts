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
  createOrder,
  fetchOrderById,
  fetchOrdersByUser,
  updateOrderStatus,
  type Order,
  type CreateOrderInput,
  type OrderWithRestaurant,
} from '@/lib/api/orders';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockOrder: Order = {
  id: 'o1000000-0000-0000-0000-000000000001',
  user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  restaurant_id: 'a1000000-0000-0000-0000-000000000001',
  status: 'placed',
  items: [
    { menu_item_id: '11010000-0000-0000-0000-000000000001', name: 'Margherita', price: 1200, quantity: 2, dietary_tags: ['Vegan'] },
  ],
  delivery_address: { label: 'Home', address: '45 Rue Abane Ramdane', city: 'Alger', lat: 36.7538, lng: 3.0588 },
  subtotal: 2400,
  delivery_fee: 200,
  total: 2600,
  special_instructions: null,
  estimated_delivery_at: null,
  placed_at: '2026-02-25T10:00:00Z',
  confirmed_at: null,
  preparing_at: null,
  on_the_way_at: null,
  delivered_at: null,
  cancelled_at: null,
  updated_at: '2026-02-25T10:00:00Z',
};

const mockOrderWithRestaurant: OrderWithRestaurant = {
  ...mockOrder,
  restaurants: { name: 'La Bella Italia', cover_image_url: null },
};

const mockInput: CreateOrderInput = {
  user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  restaurant_id: 'a1000000-0000-0000-0000-000000000001',
  items: [
    { menu_item_id: '11010000-0000-0000-0000-000000000001', name: 'Margherita', price: 1200, quantity: 2, dietary_tags: ['Vegan'] },
  ],
  delivery_address: { label: 'Home', address: '45 Rue Abane Ramdane', city: 'Alger', lat: 36.7538, lng: 3.0588 },
  subtotal: 2400,
  delivery_fee: 200,
  total: 2600,
};

// ── createOrder ──────────────────────────────────────────────────────────────

describe('createOrder', () => {
  it('inserts and returns the created order', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: mockOrder, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const result = await createOrder(mockInput);

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(mockInsert).toHaveBeenCalledWith(mockInput);
    expect(result).toEqual(mockOrder);
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'insert failed', code: '23505' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    await expect(createOrder(mockInput)).rejects.toMatchObject({
      message: 'insert failed',
    });
  });
});

// ── fetchOrderById ───────────────────────────────────────────────────────────

describe('fetchOrderById', () => {
  it('returns a single order', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: mockOrder, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrderById('o1000000-0000-0000-0000-000000000001');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'o1000000-0000-0000-0000-000000000001');
    expect(result).toEqual(mockOrder);
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'not found', code: 'PGRST116' },
    });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchOrderById('nonexistent')).rejects.toMatchObject({
      message: 'not found',
    });
  });
});

// ── fetchOrdersByUser ────────────────────────────────────────────────────────

describe('fetchOrdersByUser', () => {
  it('returns orders with restaurant data, ordered by placed_at', async () => {
    const mockOrderFn = jest.fn().mockResolvedValue({ data: [mockOrderWithRestaurant], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderFn });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrdersByUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(mockSelect).toHaveBeenCalledWith('*, restaurants:restaurant_id(name, cover_image_url)');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(mockOrderFn).toHaveBeenCalledWith('placed_at', { ascending: false });
    expect(result).toEqual([mockOrderWithRestaurant]);
    expect(result[0].restaurants.name).toBe('La Bella Italia');
  });

  it('returns empty array when no orders exist', async () => {
    const mockOrderFn = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderFn });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrdersByUser('some-user');

    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    const mockOrderFn = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderFn });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOrdersByUser('some-user');

    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    const mockOrderFn = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'connection refused', code: '08006' },
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderFn });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchOrdersByUser('some-user')).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});

// ── updateOrderStatus ────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  it('updates status and sets the corresponding timestamp', async () => {
    const confirmedOrder = { ...mockOrder, status: 'confirmed', confirmed_at: '2026-02-25T10:05:00Z' };
    const mockSingle = jest.fn().mockResolvedValue({ data: confirmedOrder, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    const result = await updateOrderStatus('o1000000-0000-0000-0000-000000000001', 'confirmed');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe('confirmed');
    expect(updateArg.confirmed_at).toBeDefined();
    expect(updateArg.updated_at).toBeDefined();
    expect(mockEq).toHaveBeenCalledWith('id', 'o1000000-0000-0000-0000-000000000001');
    expect(result).toEqual(confirmedOrder);
  });

  it('handles on_the_way status with underscore column name', async () => {
    const onTheWayOrder = { ...mockOrder, status: 'on_the_way', on_the_way_at: '2026-02-25T10:20:00Z' };
    const mockSingle = jest.fn().mockResolvedValue({ data: onTheWayOrder, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await updateOrderStatus('o1000000-0000-0000-0000-000000000001', 'on_the_way');

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe('on_the_way');
    expect(updateArg.on_the_way_at).toBeDefined();
  });

  it('handles cancelled status timestamp', async () => {
    const cancelledOrder = { ...mockOrder, status: 'cancelled', cancelled_at: '2026-02-25T10:05:00Z' };
    const mockSingle = jest.fn().mockResolvedValue({ data: cancelledOrder, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await updateOrderStatus('o1000000-0000-0000-0000-000000000001', 'cancelled');

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe('cancelled');
    expect(updateArg.cancelled_at).toBeDefined();
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'update failed', code: '23514' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await expect(updateOrderStatus('some-id', 'confirmed')).rejects.toMatchObject({
      message: 'update failed',
    });
  });
});
