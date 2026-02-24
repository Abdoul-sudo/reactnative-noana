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
import { fetchReviewsByRestaurant, type ReviewWithProfile } from '@/lib/api/reviews';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockReview: ReviewWithProfile = {
  id: 'r1000000-0000-0000-0000-000000000001',
  restaurant_id: 'a1000000-0000-0000-0000-000000000001',
  user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  rating: 5,
  comment: 'Best pizza in Algiers!',
  owner_reply: null,
  owner_reply_at: null,
  created_at: '2026-02-10T12:00:00Z',
  profiles: {
    display_name: 'Test Customer',
    avatar_url: null,
  },
};

// ── fetchReviewsByRestaurant ────────────────────────────────────────────────

describe('fetchReviewsByRestaurant', () => {
  it('returns reviews with profile data', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [mockReview], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchReviewsByRestaurant('a1000000-0000-0000-0000-000000000001');

    expect(supabase.from).toHaveBeenCalledWith('reviews');
    expect(mockSelect).toHaveBeenCalledWith('*, profiles:user_id(display_name, avatar_url)');
    expect(mockEq).toHaveBeenCalledWith('restaurant_id', 'a1000000-0000-0000-0000-000000000001');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([mockReview]);
    expect(result[0].profiles.display_name).toBe('Test Customer');
  });

  it('returns empty array when no reviews exist', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchReviewsByRestaurant('nonexistent-id');

    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchReviewsByRestaurant('some-id');

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
      fetchReviewsByRestaurant('a1000000-0000-0000-0000-000000000001'),
    ).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});
