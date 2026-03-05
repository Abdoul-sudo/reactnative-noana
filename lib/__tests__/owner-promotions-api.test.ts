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
  fetchPromotions,
  fetchPromotionStats,
  createPromotion,
  updatePromotion,
  togglePromotion,
} from '@/lib/api/owner-promotions';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockPromotion = {
  id: 'p1000000-0000-0000-0000-000000000001',
  restaurant_id: 'a1000000-0000-0000-0000-000000000001',
  name: 'Summer Special',
  discount_type: 'percentage',
  discount_value: 20,
  applicable_item_ids: ['item-1', 'item-2'],
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  is_active: true,
  push_enabled: false,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

// ── fetchPromotions ──────────────────────────────────────────────────────────

describe('fetchPromotions', () => {
  it('returns promotions for a restaurant', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockPromotion], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchPromotions('a1000000-0000-0000-0000-000000000001');

    expect(supabase.from).toHaveBeenCalledWith('promotions');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('restaurant_id', 'a1000000-0000-0000-0000-000000000001');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Summer Special');
  });

  it('returns empty array when no promotions exist', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchPromotions('nonexistent-id');
    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'connection refused', code: '08006' },
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(
      fetchPromotions('a1000000-0000-0000-0000-000000000001'),
    ).rejects.toMatchObject({ message: 'connection refused' });
  });
});

// ── fetchPromotionStats ──────────────────────────────────────────────────────

describe('fetchPromotionStats', () => {
  it('returns order count and total revenue excluding cancelled', async () => {
    const mockNeq = jest.fn().mockResolvedValue({
      data: [{ total: 150000 }, { total: 200000 }],
      error: null,
      count: 2,
    });
    const mockEq = jest.fn().mockReturnValue({ neq: mockNeq });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchPromotionStats('p1000000-0000-0000-0000-000000000001');

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(mockSelect).toHaveBeenCalledWith('total', { count: 'exact' });
    expect(mockEq).toHaveBeenCalledWith('promotion_id', 'p1000000-0000-0000-0000-000000000001');
    expect(mockNeq).toHaveBeenCalledWith('status', 'cancelled');
    expect(result).toEqual({ order_count: 2, total_revenue: 350000 });
  });

  it('returns zero stats when no orders', async () => {
    const mockNeq = jest.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    const mockEq = jest.fn().mockReturnValue({ neq: mockNeq });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchPromotionStats('p1000000-0000-0000-0000-000000000001');
    expect(result).toEqual({ order_count: 0, total_revenue: 0 });
  });

  it('throws on database error', async () => {
    const mockNeq = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'table not found' },
      count: null,
    });
    const mockEq = jest.fn().mockReturnValue({ neq: mockNeq });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(
      fetchPromotionStats('p1000000-0000-0000-0000-000000000001'),
    ).rejects.toMatchObject({ message: 'table not found' });
  });
});

// ── createPromotion ──────────────────────────────────────────────────────────

describe('createPromotion', () => {
  const createParams = {
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Summer Special',
    discount_type: 'percentage' as const,
    discount_value: 20,
    applicable_item_ids: ['item-1'],
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    push_enabled: false,
  };

  it('inserts and returns the new promotion', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: mockPromotion, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const result = await createPromotion(createParams);

    expect(supabase.from).toHaveBeenCalledWith('promotions');
    expect(mockInsert).toHaveBeenCalledWith({
      restaurant_id: createParams.restaurant_id,
      name: createParams.name,
      discount_type: createParams.discount_type,
      discount_value: createParams.discount_value,
      applicable_item_ids: createParams.applicable_item_ids,
      start_date: createParams.start_date,
      end_date: createParams.end_date,
      push_enabled: createParams.push_enabled,
    });
    expect(result.name).toBe('Summer Special');
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'RLS policy violation' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    await expect(createPromotion(createParams)).rejects.toMatchObject({
      message: 'RLS policy violation',
    });
  });
});

// ── updatePromotion ──────────────────────────────────────────────────────────

describe('updatePromotion', () => {
  it('updates and returns the promotion', async () => {
    const updated = { ...mockPromotion, name: 'Winter Deal' };
    const mockSingle = jest.fn().mockResolvedValue({ data: updated, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    const result = await updatePromotion('p1000000-0000-0000-0000-000000000001', {
      name: 'Winter Deal',
      discount_type: 'percentage',
      discount_value: 20,
      applicable_item_ids: ['item-1', 'item-2'],
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      push_enabled: false,
    });

    expect(supabase.from).toHaveBeenCalledWith('promotions');
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Winter Deal',
      discount_type: 'percentage',
      discount_value: 20,
      applicable_item_ids: ['item-1', 'item-2'],
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      push_enabled: false,
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'p1000000-0000-0000-0000-000000000001');
    expect(result.name).toBe('Winter Deal');
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await expect(
      updatePromotion('nonexistent', {
        name: 'X',
        discount_type: 'fixed',
        discount_value: 100,
        applicable_item_ids: ['item-1'],
        start_date: '2026-03-01',
        end_date: '2026-03-31',
        push_enabled: false,
      }),
    ).rejects.toMatchObject({ message: 'not found' });
  });
});

// ── togglePromotion ──────────────────────────────────────────────────────────

describe('togglePromotion', () => {
  it('toggles is_active and returns updated promotion', async () => {
    const toggled = { ...mockPromotion, is_active: false };
    const mockSingle = jest.fn().mockResolvedValue({ data: toggled, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    const result = await togglePromotion('p1000000-0000-0000-0000-000000000001', false);

    expect(supabase.from).toHaveBeenCalledWith('promotions');
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    expect(mockEq).toHaveBeenCalledWith('id', 'p1000000-0000-0000-0000-000000000001');
    expect(result.is_active).toBe(false);
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await expect(
      togglePromotion('p1000000-0000-0000-0000-000000000001', true),
    ).rejects.toMatchObject({ message: 'permission denied' });
  });
});
