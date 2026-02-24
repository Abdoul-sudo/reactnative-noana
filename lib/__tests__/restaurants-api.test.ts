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
  fetchRestaurants,
  fetchFeaturedRestaurants,
  fetchRestaurantsByCuisine,
  fetchTopRatedRestaurants,
  fetchNearbyRestaurants,
  fetchRestaurantBySlug,
  type Restaurant,
  type NearbyRestaurant,
} from '@/lib/api/restaurants';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockRestaurant: Partial<Restaurant> = {
  id: 'a1000000-0000-0000-0000-000000000001',
  slug: 'la-bella-italia',
  name: 'La Bella Italia',
  cuisine_type: 'Italian',
  latitude: 36.7372,
  longitude: 3.0864,
  owner_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  deleted_at: null,
};

const mockNearby: NearbyRestaurant = {
  id: 'a1000000-0000-0000-0000-000000000001',
  slug: 'la-bella-italia',
  name: 'La Bella Italia',
  cuisine_type: 'Italian',
  cover_image_url: null,
  rating: 4.5,
  delivery_time_min: 30,
  delivery_fee: 200,
  price_range: '€€',
  dietary_options: ['Vegan', 'Gluten-free'],
  is_open: true,
  distance_km: 0.42,
};

// ── fetchRestaurants ─────────────────────────────────────────────────────────

describe('fetchRestaurants', () => {
  it('returns a list of restaurants', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockRestaurant], error: null });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchRestaurants();

    expect(supabase.from).toHaveBeenCalledWith('restaurants');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockOrder).toHaveBeenCalledWith('name');
    expect(result).toEqual([mockRestaurant]);
  });

  it('returns empty array when no restaurants exist', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchRestaurants();

    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'connection refused', code: '08006' },
    });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchRestaurants()).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});

// ── fetchFeaturedRestaurants ──────────────────────────────────────────────────

describe('fetchFeaturedRestaurants', () => {
  it('fetches open restaurants ordered by rating descending', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockRestaurant], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockIs = jest.fn().mockReturnValue({ eq: mockEq });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchFeaturedRestaurants();

    expect(supabase.from).toHaveBeenCalledWith('restaurants');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockEq).toHaveBeenCalledWith('is_open', true);
    expect(mockOrder).toHaveBeenCalledWith('rating', { ascending: false });
    expect(result).toEqual([mockRestaurant]);
  });

  it('throws on database error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'connection refused', code: '08006' },
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockIs = jest.fn().mockReturnValue({ eq: mockEq });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchFeaturedRestaurants()).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});

// ── fetchRestaurantsByCuisine ────────────────────────────────────────────────

describe('fetchRestaurantsByCuisine', () => {
  it('filters by cuisine_type and orders by rating', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockRestaurant], error: null });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEqCuisine = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEqCuisine });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchRestaurantsByCuisine('Italian');

    expect(supabase.from).toHaveBeenCalledWith('restaurants');
    expect(mockEqCuisine).toHaveBeenCalledWith('cuisine_type', 'Italian');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockOrder).toHaveBeenCalledWith('rating', { ascending: false });
    expect(result).toEqual([mockRestaurant]);
  });

  it('throws on database error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'query timeout', code: '57014' },
    });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEqCuisine = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEqCuisine });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchRestaurantsByCuisine('Asian')).rejects.toMatchObject({
      message: 'query timeout',
    });
  });
});

// ── fetchTopRatedRestaurants ─────────────────────────────────────────────────

describe('fetchTopRatedRestaurants', () => {
  /** Helper: builds the mock chain for fetchTopRatedRestaurants
   *  from → select → is → order → limit
   */
  function buildChain(resolvedValue: { data: Restaurant[] | null; error: any }) {
    const mockLimit = jest.fn().mockResolvedValue(resolvedValue);
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);
    return { mockSelect, mockIs, mockOrder, mockLimit };
  }

  it('fetches top rated restaurants ordered by rating with limit', async () => {
    const { mockSelect, mockIs, mockOrder, mockLimit } = buildChain({
      data: [mockRestaurant as Restaurant],
      error: null,
    });

    const result = await fetchTopRatedRestaurants();

    expect(supabase.from).toHaveBeenCalledWith('restaurants');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockOrder).toHaveBeenCalledWith('rating', { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(result).toEqual([mockRestaurant]);
  });

  it('returns empty array when no restaurants exist', async () => {
    buildChain({ data: [], error: null });

    const result = await fetchTopRatedRestaurants();

    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    buildChain({
      data: null,
      error: { message: 'connection refused', code: '08006' },
    });

    await expect(fetchTopRatedRestaurants()).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});

// ── fetchNearbyRestaurants ───────────────────────────────────────────────────

describe('fetchNearbyRestaurants', () => {
  it('calls the nearby_restaurants RPC with correct args', async () => {
    jest
      .spyOn(supabase, 'rpc')
      .mockResolvedValue({ data: [mockNearby], error: null } as any);

    const result = await fetchNearbyRestaurants(36.7372, 3.0864);

    expect(supabase.rpc).toHaveBeenCalledWith('nearby_restaurants', {
      user_lat: 36.7372,
      user_lng: 3.0864,
      radius_km: 5,
      dietary_filter: null,
    });
    expect(result).toEqual([mockNearby]);
  });

  it('passes custom radius and dietary filter', async () => {
    jest
      .spyOn(supabase, 'rpc')
      .mockResolvedValue({ data: [], error: null } as any);

    await fetchNearbyRestaurants(36.7372, 3.0864, 10, ['Vegan', 'Halal']);

    expect(supabase.rpc).toHaveBeenCalledWith('nearby_restaurants', {
      user_lat: 36.7372,
      user_lng: 3.0864,
      radius_km: 10,
      dietary_filter: JSON.stringify(['Vegan', 'Halal']),
    });
  });

  it('returns empty array when no results', async () => {
    jest
      .spyOn(supabase, 'rpc')
      .mockResolvedValue({ data: null, error: null } as any);

    const result = await fetchNearbyRestaurants(0, 0);

    expect(result).toEqual([]);
  });

  it('throws on RPC error', async () => {
    jest.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'function not found', code: '42883' },
    } as any);

    await expect(fetchNearbyRestaurants(36.7, 3.08)).rejects.toMatchObject({
      message: 'function not found',
    });
  });
});

// ── fetchRestaurantBySlug ────────────────────────────────────────────────────

describe('fetchRestaurantBySlug', () => {
  it('returns the restaurant matching the slug', async () => {
    const mockMaybeSingle = jest
      .fn()
      .mockResolvedValue({ data: mockRestaurant, error: null });
    const mockIs = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchRestaurantBySlug('la-bella-italia');

    expect(supabase.from).toHaveBeenCalledWith('restaurants');
    expect(mockEq).toHaveBeenCalledWith('slug', 'la-bella-italia');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(result).toEqual(mockRestaurant);
  });

  it('returns null when slug does not exist', async () => {
    const mockMaybeSingle = jest
      .fn()
      .mockResolvedValue({ data: null, error: null });
    const mockIs = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchRestaurantBySlug('does-not-exist');

    expect(result).toBeNull();
  });

  it('throws on database error', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'query timeout', code: '57014' },
    });
    const mockIs = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchRestaurantBySlug('la-bella-italia')).rejects.toMatchObject({
      message: 'query timeout',
    });
  });
});
