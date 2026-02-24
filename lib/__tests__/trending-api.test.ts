import { fetchTrendingSearches } from '@/lib/api/trending';

// ── Mock Supabase client ────────────────────────────────────────────────────

const mockResult = { data: null as unknown, error: null as unknown };

jest.mock('@/lib/supabase', () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn(() => Promise.resolve(mockResult)),
  };

  return {
    supabase: {
      from: jest.fn(() => chain),
      __chain: chain,
    },
  };
});

function getChain() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { supabase } = require('@/lib/supabase');
  return supabase.__chain;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('fetchTrendingSearches', () => {
  beforeEach(() => {
    const chain = getChain();
    mockResult.data = [
      { id: '1', query: 'Pizza', display_order: 1 },
      { id: '2', query: 'Burger', display_order: 2 },
    ];
    mockResult.error = null;
    chain.order.mockImplementation(() => Promise.resolve(mockResult));
  });

  it('returns trending searches ordered by display_order', async () => {
    const result = await fetchTrendingSearches();
    expect(result).toHaveLength(2);
    expect(result[0].query).toBe('Pizza');
    expect(result[1].query).toBe('Burger');
  });

  it('calls from with correct table name', async () => {
    await fetchTrendingSearches();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('trending_searches');
  });

  it('selects only needed columns', async () => {
    await fetchTrendingSearches();
    const chain = getChain();
    expect(chain.select).toHaveBeenCalledWith('id, query, display_order');
  });

  it('orders by display_order', async () => {
    await fetchTrendingSearches();
    const chain = getChain();
    expect(chain.order).toHaveBeenCalledWith('display_order');
  });

  it('returns empty array when no data', async () => {
    mockResult.data = [];
    mockResult.error = null;
    const result = await fetchTrendingSearches();
    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    mockResult.data = null;
    mockResult.error = null;
    const result = await fetchTrendingSearches();
    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    mockResult.data = null;
    mockResult.error = { message: 'DB error' };
    await expect(fetchTrendingSearches()).rejects.toEqual({ message: 'DB error' });
  });
});
