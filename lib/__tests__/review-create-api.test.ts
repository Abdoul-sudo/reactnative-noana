jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { createReview } from '@/lib/api/reviews';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── createReview ─────────────────────────────────────────────────────────────

describe('createReview', () => {
  it('inserts and returns the created review', async () => {
    const mockReview = {
      id: 'review-1',
      restaurant_id: 'rest-1',
      user_id: 'user-1',
      rating: 4,
      comment: 'Great food!',
      created_at: '2026-02-25T00:00:00Z',
    };

    // Mock auth.getUser()
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    // Mock insert chain: insert().select().single()
    const mockSingle = jest.fn().mockResolvedValue({ data: mockReview, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const result = await createReview({
      restaurant_id: 'rest-1',
      rating: 4,
      comment: 'Great food!',
    });

    expect(supabase.from).toHaveBeenCalledWith('reviews');
    expect(mockInsert).toHaveBeenCalledWith({
      restaurant_id: 'rest-1',
      user_id: 'user-1',
      rating: 4,
      comment: 'Great food!',
    });
    expect(result).toEqual(mockReview);
  });

  it('throws on database error', async () => {
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'RLS violation', code: '42501' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    await expect(
      createReview({ restaurant_id: 'rest-1', rating: 5 }),
    ).rejects.toMatchObject({ message: 'RLS violation' });
  });
});
