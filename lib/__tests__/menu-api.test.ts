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
  fetchMenuByRestaurant,
  type MenuCategoryWithItems,
} from '@/lib/api/menu';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────────────────────────

const RESTAURANT_ID = 'a1000000-0000-0000-0000-000000000001';

const mockCategory: MenuCategoryWithItems = {
  id: 'c1100000-0000-0000-0000-000000000001',
  restaurant_id: RESTAURANT_ID,
  name: 'Pizzas',
  sort_order: 1,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00Z',
  items: [
    {
      id: '11010000-0000-0000-0000-000000000001',
      category_id: 'c1100000-0000-0000-0000-000000000001',
      restaurant_id: RESTAURANT_ID,
      name: 'Margherita',
      description: 'Tomato, mozzarella, fresh basil',
      price: 1200,
      image_url: null,
      dietary_tags: ['Vegan'],
      prep_time_min: 15,
      is_available: true,
      deleted_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
};

// ── fetchMenuByRestaurant ────────────────────────────────────────────────────

describe('fetchMenuByRestaurant', () => {
  it('returns categories with nested items', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockCategory], error: null });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchMenuByRestaurant(RESTAURANT_ID);

    expect(supabase.from).toHaveBeenCalledWith('menu_categories');
    expect(mockSelect).toHaveBeenCalledWith('*, items:menu_items(*)');
    expect(mockEq).toHaveBeenCalledWith('restaurant_id', RESTAURANT_ID);
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockOrder).toHaveBeenCalledWith('sort_order');
    expect(result).toEqual([mockCategory]);
  });

  it('returns empty array when restaurant has no categories', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchMenuByRestaurant(RESTAURANT_ID);

    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchMenuByRestaurant(RESTAURANT_ID);

    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied', code: '42501' },
    });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchMenuByRestaurant(RESTAURANT_ID)).rejects.toMatchObject({
      message: 'permission denied',
    });
  });

  it('returns multiple categories in sort_order', async () => {
    const secondCategory: MenuCategoryWithItems = {
      ...mockCategory,
      id: 'c1200000-0000-0000-0000-000000000001',
      name: 'Pastas',
      sort_order: 2,
      items: [],
    };
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: [mockCategory, secondCategory], error: null });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchMenuByRestaurant(RESTAURANT_ID);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Pizzas');
    expect(result[1].name).toBe('Pastas');
  });
});
