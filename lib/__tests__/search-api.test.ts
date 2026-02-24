import { searchRestaurants, searchDishes } from '@/lib/api/search';

// ── Mock Supabase client ────────────────────────────────────────────────────

const mockResult = { data: null as unknown, error: null as unknown };

jest.mock('@/lib/supabase', () => {
  // Chain builders must be inside the factory (jest.mock hoisting rule)
  const restaurantChain = {
    select: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn(() => Promise.resolve(mockResult)),
  };

  const dishChain = {
    select: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn(() => Promise.resolve(mockResult)),
  };

  return {
    supabase: {
      from: jest.fn((table: string) => {
        if (table === 'menu_items') return dishChain;
        return restaurantChain;
      }),
      __restaurantChain: restaurantChain,
      __dishChain: dishChain,
    },
  };
});

function getChains() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { supabase } = require('@/lib/supabase');
  return {
    restaurantChain: supabase.__restaurantChain,
    dishChain: supabase.__dishChain,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('searchRestaurants', () => {
  beforeEach(() => {
    const { restaurantChain } = getChains();
    mockResult.data = [{ id: '1', name: 'Pizza Place', rating: 4.5 }];
    mockResult.error = null;
    restaurantChain.limit.mockImplementation(() => Promise.resolve(mockResult));
  });

  it('returns matching restaurants', async () => {
    const result = await searchRestaurants('pizza');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pizza Place');
  });

  it('calls ilike with correct wildcard pattern', async () => {
    await searchRestaurants('burger');
    const { restaurantChain } = getChains();
    expect(restaurantChain.ilike).toHaveBeenCalledWith('name', '%burger%');
  });

  it('returns empty array when no matches', async () => {
    mockResult.data = [];
    mockResult.error = null;
    const result = await searchRestaurants('xyz');
    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    mockResult.data = null;
    mockResult.error = null;
    const result = await searchRestaurants('anything');
    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    mockResult.data = null;
    mockResult.error = { message: 'DB error' };
    await expect(searchRestaurants('test')).rejects.toEqual({ message: 'DB error' });
  });
});

describe('searchDishes', () => {
  beforeEach(() => {
    const { dishChain } = getChains();
    mockResult.data = [
      { id: '1', name: 'Margherita', price: 800, restaurant: { name: 'Bella', slug: 'bella' } },
    ];
    mockResult.error = null;
    dishChain.limit.mockImplementation(() => Promise.resolve(mockResult));
  });

  it('returns matching dishes with restaurant info', async () => {
    const result = await searchDishes('marg');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Margherita');
    expect(result[0].restaurant.name).toBe('Bella');
  });

  it('calls ilike with correct wildcard pattern', async () => {
    await searchDishes('pizza');
    const { dishChain } = getChains();
    expect(dishChain.ilike).toHaveBeenCalledWith('name', '%pizza%');
  });

  it('returns empty array when no matches', async () => {
    mockResult.data = [];
    mockResult.error = null;
    const result = await searchDishes('xyz');
    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    mockResult.data = null;
    mockResult.error = { message: 'Search failed' };
    await expect(searchDishes('test')).rejects.toEqual({ message: 'Search failed' });
  });
});
