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
  fetchActivePromotions,
  fetchActivePromotionsBatch,
} from '@/lib/api/promotions';

beforeEach(() => {
  jest.clearAllMocks();
});

const mockPromotion = {
  id: 'p1',
  restaurant_id: 'r1',
  name: 'Summer Sale',
  discount_type: 'percentage',
  discount_value: 20,
  applicable_item_ids: ['item-1'],
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  is_active: true,
  push_enabled: false,
  created_at: null,
  updated_at: null,
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// ── fetchActivePromotions ───────────────────────────────────────────────────

describe('fetchActivePromotions', () => {
  it('returns active promotions for a restaurant', async () => {
    const mockReturns = jest.fn().mockResolvedValue({ data: [mockPromotion], error: null });
    const mockOrder = jest.fn().mockReturnValue({ returns: mockReturns });
    const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
    const mockLte = jest.fn().mockReturnValue({ gte: mockGte });
    const mockEqActive = jest.fn().mockReturnValue({ lte: mockLte });
    const mockEqRestaurant = jest.fn().mockReturnValue({ eq: mockEqActive });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEqRestaurant });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchActivePromotions('r1');

    expect(supabase.from).toHaveBeenCalledWith('promotions');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEqRestaurant).toHaveBeenCalledWith('restaurant_id', 'r1');
    expect(mockEqActive).toHaveBeenCalledWith('is_active', true);
    expect(mockLte).toHaveBeenCalledWith('start_date', expect.stringMatching(datePattern));
    expect(mockGte).toHaveBeenCalledWith('end_date', expect.stringMatching(datePattern));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Summer Sale');
  });

  it('returns empty array when no promotions', async () => {
    const mockReturns = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockOrder = jest.fn().mockReturnValue({ returns: mockReturns });
    const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
    const mockLte = jest.fn().mockReturnValue({ gte: mockGte });
    const mockEqActive = jest.fn().mockReturnValue({ lte: mockLte });
    const mockEqRestaurant = jest.fn().mockReturnValue({ eq: mockEqActive });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEqRestaurant });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchActivePromotions('r1');
    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    const mockReturns = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    const mockOrder = jest.fn().mockReturnValue({ returns: mockReturns });
    const mockGte = jest.fn().mockReturnValue({ order: mockOrder });
    const mockLte = jest.fn().mockReturnValue({ gte: mockGte });
    const mockEqActive = jest.fn().mockReturnValue({ lte: mockLte });
    const mockEqRestaurant = jest.fn().mockReturnValue({ eq: mockEqActive });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEqRestaurant });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchActivePromotions('r1')).rejects.toMatchObject({ message: 'fail' });
  });
});

// ── fetchActivePromotionsBatch ──────────────────────────────────────────────

describe('fetchActivePromotionsBatch', () => {
  it('returns empty map for empty input', async () => {
    const result = await fetchActivePromotionsBatch([]);
    expect(result.size).toBe(0);
  });

  it('returns map grouped by restaurant_id', async () => {
    const promo2 = { ...mockPromotion, id: 'p2', restaurant_id: 'r2', name: 'Flash Deal' };
    const mockReturns = jest.fn().mockResolvedValue({ data: [mockPromotion, promo2], error: null });
    const mockGte = jest.fn().mockReturnValue({ returns: mockReturns });
    const mockLte = jest.fn().mockReturnValue({ gte: mockGte });
    const mockEqActive = jest.fn().mockReturnValue({ lte: mockLte });
    const mockIn = jest.fn().mockReturnValue({ eq: mockEqActive });
    const mockSelect = jest.fn().mockReturnValue({ in: mockIn });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchActivePromotionsBatch(['r1', 'r2']);

    expect(mockIn).toHaveBeenCalledWith('restaurant_id', ['r1', 'r2']);
    expect(mockLte).toHaveBeenCalledWith('start_date', expect.stringMatching(datePattern));
    expect(mockGte).toHaveBeenCalledWith('end_date', expect.stringMatching(datePattern));
    expect(result.get('r1')).toHaveLength(1);
    expect(result.get('r2')).toHaveLength(1);
    expect(result.get('r1')![0].name).toBe('Summer Sale');
    expect(result.get('r2')![0].name).toBe('Flash Deal');
  });

  it('throws on database error', async () => {
    const mockReturns = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    const mockGte = jest.fn().mockReturnValue({ returns: mockReturns });
    const mockLte = jest.fn().mockReturnValue({ gte: mockGte });
    const mockEqActive = jest.fn().mockReturnValue({ lte: mockLte });
    const mockIn = jest.fn().mockReturnValue({ eq: mockEqActive });
    const mockSelect = jest.fn().mockReturnValue({ in: mockIn });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchActivePromotionsBatch(['r1'])).rejects.toMatchObject({ message: 'fail' });
  });
});
