// Mock react-native Alert
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

// Mock the favorites API module
jest.mock('@/lib/api/favorites', () => ({
  fetchFavoriteIds: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

import { Alert } from 'react-native';
import { useFavoritesStore } from '@/stores/favorites-store';
import { fetchFavoriteIds, addFavorite, removeFavorite } from '@/lib/api/favorites';

const mockFetchFavoriteIds = fetchFavoriteIds as jest.MockedFunction<typeof fetchFavoriteIds>;
const mockAddFavorite = addFavorite as jest.MockedFunction<typeof addFavorite>;
const mockRemoveFavorite = removeFavorite as jest.MockedFunction<typeof removeFavorite>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

beforeEach(() => {
  jest.clearAllMocks();
  useFavoritesStore.setState({ favoriteIds: new Set(), isHydrated: false });
});

describe('favorites-store', () => {
  describe('hydrate', () => {
    it('populates favoriteIds Set from API', async () => {
      mockFetchFavoriteIds.mockResolvedValue(['rest-1', 'rest-2', 'rest-3']);

      await useFavoritesStore.getState().hydrate('user-1');

      const { favoriteIds, isHydrated } = useFavoritesStore.getState();
      expect(isHydrated).toBe(true);
      expect(favoriteIds.size).toBe(3);
      expect(favoriteIds.has('rest-1')).toBe(true);
      expect(favoriteIds.has('rest-2')).toBe(true);
      expect(favoriteIds.has('rest-3')).toBe(true);
      expect(mockFetchFavoriteIds).toHaveBeenCalledWith('user-1');
    });
  });

  describe('toggle', () => {
    it('adds restaurant to favorites optimistically', async () => {
      mockAddFavorite.mockResolvedValue(undefined);

      useFavoritesStore.getState().toggle('user-1', 'rest-new');

      // Optimistic: immediately in the Set
      expect(useFavoritesStore.getState().favoriteIds.has('rest-new')).toBe(true);
      expect(mockAddFavorite).toHaveBeenCalledWith('user-1', 'rest-new');
    });

    it('removes restaurant from favorites optimistically', async () => {
      useFavoritesStore.setState({ favoriteIds: new Set(['rest-1', 'rest-2']) });
      mockRemoveFavorite.mockResolvedValue(undefined);

      useFavoritesStore.getState().toggle('user-1', 'rest-1');

      // Optimistic: immediately removed from Set
      expect(useFavoritesStore.getState().favoriteIds.has('rest-1')).toBe(false);
      expect(useFavoritesStore.getState().favoriteIds.has('rest-2')).toBe(true);
      expect(mockRemoveFavorite).toHaveBeenCalledWith('user-1', 'rest-1');
    });

    it('reverts and shows alert on API error when adding', async () => {
      mockAddFavorite.mockRejectedValue(new Error('Network error'));

      useFavoritesStore.getState().toggle('user-1', 'rest-new');

      // Optimistic: added
      expect(useFavoritesStore.getState().favoriteIds.has('rest-new')).toBe(true);

      // Wait for the async rejection
      await new Promise((r) => setTimeout(r, 0));

      // Reverted: removed
      expect(useFavoritesStore.getState().favoriteIds.has('rest-new')).toBe(false);
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Could not update favorite. Please try again.',
      );
    });

    it('reverts and shows alert on API error when removing', async () => {
      useFavoritesStore.setState({ favoriteIds: new Set(['rest-1']) });
      mockRemoveFavorite.mockRejectedValue(new Error('Network error'));

      useFavoritesStore.getState().toggle('user-1', 'rest-1');

      // Optimistic: removed
      expect(useFavoritesStore.getState().favoriteIds.has('rest-1')).toBe(false);

      // Wait for the async rejection
      await new Promise((r) => setTimeout(r, 0));

      // Reverted: added back
      expect(useFavoritesStore.getState().favoriteIds.has('rest-1')).toBe(true);
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Could not update favorite. Please try again.',
      );
    });
  });

  describe('isFavorite', () => {
    it('returns true for favorited restaurant', () => {
      useFavoritesStore.setState({ favoriteIds: new Set(['rest-1']) });
      expect(useFavoritesStore.getState().isFavorite('rest-1')).toBe(true);
    });

    it('returns false for non-favorited restaurant', () => {
      useFavoritesStore.setState({ favoriteIds: new Set(['rest-1']) });
      expect(useFavoritesStore.getState().isFavorite('rest-other')).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears all favorites and sets isHydrated to false', () => {
      useFavoritesStore.setState({
        favoriteIds: new Set(['rest-1', 'rest-2']),
        isHydrated: true,
      });

      useFavoritesStore.getState().reset();

      const { favoriteIds, isHydrated } = useFavoritesStore.getState();
      expect(favoriteIds.size).toBe(0);
      expect(isHydrated).toBe(false);
    });
  });
});
