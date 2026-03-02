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
import { fetchOwnerReviews, fetchRatingTrend } from '@/lib/api/owner-reviews';
import type { ReviewWithProfile } from '@/lib/api/reviews';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockReview: ReviewWithProfile = {
  id: 'r1000000-0000-0000-0000-000000000001',
  restaurant_id: 'a1000000-0000-0000-0000-000000000001',
  user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  rating: 5,
  comment: 'Amazing food!',
  owner_reply: null,
  owner_reply_at: null,
  created_at: '2026-02-10T12:00:00Z',
  profiles: {
    display_name: 'Test Customer',
    avatar_url: null,
  },
};

const mockReview3Star: ReviewWithProfile = {
  ...mockReview,
  id: 'r2000000-0000-0000-0000-000000000002',
  rating: 3,
  comment: 'It was okay',
};

// ── fetchOwnerReviews ─────────────────────────────────────────────────────────

describe('fetchOwnerReviews', () => {
  it('returns all reviews when no filter applied', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockReview, mockReview3Star], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOwnerReviews('a1000000-0000-0000-0000-000000000001');

    expect(supabase.from).toHaveBeenCalledWith('reviews');
    expect(mockSelect).toHaveBeenCalledWith('*, profiles:user_id(display_name, avatar_url)');
    expect(mockEq).toHaveBeenCalledWith('restaurant_id', 'a1000000-0000-0000-0000-000000000001');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toHaveLength(2);
  });

  it('applies rating filter when provided', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockReview], error: null });
    const mockEqRating = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEqRestaurant = jest.fn().mockReturnValue({ eq: mockEqRating });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEqRestaurant });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOwnerReviews('a1000000-0000-0000-0000-000000000001', 5);

    expect(mockEqRestaurant).toHaveBeenCalledWith('restaurant_id', 'a1000000-0000-0000-0000-000000000001');
    expect(mockEqRating).toHaveBeenCalledWith('rating', 5);
    expect(result).toEqual([mockReview]);
  });

  it('does not apply filter when ratingFilter is 0', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockReview], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await fetchOwnerReviews('a1000000-0000-0000-0000-000000000001', 0);

    // eq should only be called once (for restaurant_id), not twice
    expect(mockEq).toHaveBeenCalledTimes(1);
    expect(mockEq).toHaveBeenCalledWith('restaurant_id', 'a1000000-0000-0000-0000-000000000001');
  });

  it('returns empty array when no reviews exist', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchOwnerReviews('nonexistent-id');

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
      fetchOwnerReviews('a1000000-0000-0000-0000-000000000001'),
    ).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});

// ── fetchRatingTrend ──────────────────────────────────────────────────────────

describe('fetchRatingTrend', () => {
  it('returns current and previous average ratings', async () => {
    const trendData = { current_avg: 4.2, previous_avg: 3.8 };
    jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: trendData, error: null } as any);

    const result = await fetchRatingTrend('a1000000-0000-0000-0000-000000000001');

    expect(supabase.rpc).toHaveBeenCalledWith('rating_trend', {
      p_restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    });
    expect(result).toEqual({ current_avg: 4.2, previous_avg: 3.8 });
  });

  it('returns zero averages when no reviews in period', async () => {
    const trendData = { current_avg: 0, previous_avg: 0 };
    jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: trendData, error: null } as any);

    const result = await fetchRatingTrend('a1000000-0000-0000-0000-000000000001');

    expect(result).toEqual({ current_avg: 0, previous_avg: 0 });
  });

  it('throws on RPC error', async () => {
    jest.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'Unauthorized: not restaurant owner' },
    } as any);

    await expect(
      fetchRatingTrend('a1000000-0000-0000-0000-000000000001'),
    ).rejects.toMatchObject({
      message: 'Unauthorized: not restaurant owner',
    });
  });
});
