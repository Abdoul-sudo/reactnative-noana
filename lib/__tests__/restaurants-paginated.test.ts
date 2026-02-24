import { fetchRestaurantsPaginated } from '@/lib/api/restaurants';

// ── Mock Supabase client ────────────────────────────────────────────────────

jest.mock('@/lib/supabase', () => {
  // Chain builder must be inside the factory (jest.mock hoisting rule).
  // All intermediate methods return `this`; `range` resolves with data.
  const chain = {
    select: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn(),
  };

  return {
    supabase: {
      from: jest.fn().mockReturnValue(chain),
      __chain: chain,
    },
  };
});

function getChain() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { supabase } = require('@/lib/supabase');
  return supabase.__chain;
}

const mockRestaurant = (id: string) => ({
  id,
  name: `Restaurant ${id}`,
  slug: `restaurant-${id}`,
  rating: 4.5,
  cuisine_type: 'Italian',
  price_range: '$$',
  delivery_time_min: 30,
  dietary_options: ['Vegan'],
  deleted_at: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  const chain = getChain();
  // Reset chain mock returns after clearAllMocks wipes them
  chain.select.mockReturnThis();
  chain.is.mockReturnThis();
  chain.eq.mockReturnThis();
  chain.gte.mockReturnThis();
  chain.lte.mockReturnThis();
  chain.order.mockReturnThis();
});

describe('fetchRestaurantsPaginated', () => {
  it('fetches page 0 with default params', async () => {
    const chain = getChain();
    const restaurants = [mockRestaurant('1'), mockRestaurant('2')];
    chain.range.mockResolvedValue({ data: restaurants, error: null, count: 2 });

    const result = await fetchRestaurantsPaginated();

    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    expect(chain.order).toHaveBeenCalledWith('rating', { ascending: false });
    expect(chain.range).toHaveBeenCalledWith(0, 19);
    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(false);
  });

  it('returns hasMore = true when more data exists', async () => {
    const chain = getChain();
    const restaurants = Array.from({ length: 20 }, (_, i) => mockRestaurant(String(i)));
    chain.range.mockResolvedValue({ data: restaurants, error: null, count: 45 });

    const result = await fetchRestaurantsPaginated({ page: 0 });

    expect(result.hasMore).toBe(true);
    expect(result.data).toHaveLength(20);
  });

  it('returns hasMore = false on the last page', async () => {
    const chain = getChain();
    const restaurants = [mockRestaurant('41'), mockRestaurant('42')];
    chain.range.mockResolvedValue({ data: restaurants, error: null, count: 42 });

    const result = await fetchRestaurantsPaginated({ page: 2 });

    expect(chain.range).toHaveBeenCalledWith(40, 59);
    expect(result.hasMore).toBe(false);
  });

  it('fetches page 1 with correct range', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 25 });

    await fetchRestaurantsPaginated({ page: 1 });

    expect(chain.range).toHaveBeenCalledWith(20, 39);
  });

  it('applies cuisine filter', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchRestaurantsPaginated({ cuisine: 'Italian' });

    expect(chain.eq).toHaveBeenCalledWith('cuisine_type', 'Italian');
  });

  it('applies price range filter', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchRestaurantsPaginated({ priceRange: '$$$' });

    expect(chain.eq).toHaveBeenCalledWith('price_range', '$$$');
  });

  it('applies minimum rating filter', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchRestaurantsPaginated({ minRating: 4.0 });

    expect(chain.gte).toHaveBeenCalledWith('rating', 4.0);
  });

  it('applies max delivery time filter', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchRestaurantsPaginated({ maxDeliveryTime: 30 });

    expect(chain.lte).toHaveBeenCalledWith('delivery_time_min', 30);
  });

  it('applies multiple filters simultaneously', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchRestaurantsPaginated({
      cuisine: 'Algerian',
      priceRange: '$$',
      minRating: 3.5,
      maxDeliveryTime: 45,
    });

    expect(chain.eq).toHaveBeenCalledWith('cuisine_type', 'Algerian');
    expect(chain.eq).toHaveBeenCalledWith('price_range', '$$');
    expect(chain.gte).toHaveBeenCalledWith('rating', 3.5);
    expect(chain.lte).toHaveBeenCalledWith('delivery_time_min', 45);
  });

  it('always filters deleted_at IS NULL', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchRestaurantsPaginated({ cuisine: 'Italian' });

    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('throws on Supabase error', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: null, error: new Error('DB error'), count: null });

    await expect(fetchRestaurantsPaginated()).rejects.toThrow('DB error');
  });

  it('returns empty array when data is null', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: null, error: null, count: 0 });

    const result = await fetchRestaurantsPaginated();

    expect(result.data).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it('supports custom page limit', async () => {
    const chain = getChain();
    chain.range.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchRestaurantsPaginated({ page: 0, limit: 10 });

    expect(chain.range).toHaveBeenCalledWith(0, 9);
  });
});
