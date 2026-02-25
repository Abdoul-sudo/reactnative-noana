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
  fetchTrendingDishes,
  type MenuCategoryWithItems,
  type TrendingDish,
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

// ── fetchTrendingDishes ──────────────────────────────────────────────────────

const mockTrendingDish: TrendingDish = {
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
  restaurant: { name: 'La Bella Italia', slug: 'la-bella-italia' },
};

describe('fetchTrendingDishes', () => {
  /** Helper: builds the mock chain for fetchTrendingDishes
   *  from → select → is → eq → order → limit
   */
  function buildChain(resolvedValue: { data: TrendingDish[] | null; error: any }) {
    const mockLimit = jest.fn().mockResolvedValue(resolvedValue);
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockIs = jest.fn().mockReturnValue({ eq: mockEq });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);
    return { mockSelect, mockIs, mockEq, mockOrder, mockLimit };
  }

  it('returns trending dishes with restaurant relation', async () => {
    const { mockSelect, mockIs, mockEq, mockOrder, mockLimit } = buildChain({
      data: [mockTrendingDish],
      error: null,
    });

    const result = await fetchTrendingDishes();

    expect(supabase.from).toHaveBeenCalledWith('menu_items');
    expect(mockSelect).toHaveBeenCalledWith(
      '*, restaurant:restaurants!menu_items_restaurant_id_fkey(name, slug)',
    );
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockEq).toHaveBeenCalledWith('is_available', true);
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(result).toEqual([mockTrendingDish]);
    expect(result[0].restaurant.name).toBe('La Bella Italia');
  });

  it('returns empty array when no dishes exist', async () => {
    buildChain({ data: [], error: null });

    const result = await fetchTrendingDishes();

    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    buildChain({ data: null, error: null });

    const result = await fetchTrendingDishes();

    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    buildChain({
      data: null,
      error: { message: 'relation not found', code: '42P01' },
    });

    await expect(fetchTrendingDishes()).rejects.toMatchObject({
      message: 'relation not found',
    });
  });
});

// ── fetchMenuItemsByIds ──────────────────────────────────────────────────────

import { fetchMenuItemsByIds, type MenuItem } from '@/lib/api/menu';

const mockMenuItem: MenuItem = {
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
};

describe('fetchMenuItemsByIds', () => {
  /** Helper: builds the mock chain for fetchMenuItemsByIds
   *  from → select → in → eq → is
   */
  function buildByIdsChain(resolvedValue: { data: MenuItem[] | null; error: any }) {
    const mockIs = jest.fn().mockResolvedValue(resolvedValue);
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockIn = jest.fn().mockReturnValue({ eq: mockEq });
    const mockSelect = jest.fn().mockReturnValue({ in: mockIn });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);
    return { mockSelect, mockIn, mockEq, mockIs };
  }

  it('returns available items matching the given IDs', async () => {
    const { mockSelect, mockIn, mockEq, mockIs } = buildByIdsChain({
      data: [mockMenuItem],
      error: null,
    });

    const result = await fetchMenuItemsByIds([mockMenuItem.id]);

    expect(supabase.from).toHaveBeenCalledWith('menu_items');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockIn).toHaveBeenCalledWith('id', [mockMenuItem.id]);
    expect(mockEq).toHaveBeenCalledWith('is_available', true);
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(result).toEqual([mockMenuItem]);
  });

  it('returns empty array when given an empty IDs list (no DB call)', async () => {
    const spy = jest.spyOn(supabase, 'from');

    const result = await fetchMenuItemsByIds([]);

    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
