import { create } from 'zustand';
import { Alert } from 'react-native';
import {
  fetchFavoriteIds,
  addFavorite,
  removeFavorite,
} from '@/lib/api/favorites';

interface FavoritesState {
  /** Set of restaurant IDs the user has favorited — O(1) lookup. */
  favoriteIds: Set<string>;
  /** Whether the store has been hydrated from the API. */
  isHydrated: boolean;

  /** Load favorite IDs from the API and populate the Set. */
  hydrate: (userId: string) => Promise<void>;
  /**
   * Optimistic toggle: immediately update the Set, then call the API.
   * On API failure, revert the Set and show an error alert.
   */
  toggle: (userId: string, restaurantId: string) => void;
  /** Check if a restaurant is in the favorites Set. */
  isFavorite: (restaurantId: string) => boolean;
  /** Clear all favorites (used on sign-out). */
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: new Set(),
  isHydrated: false,

  hydrate: async (userId) => {
    const ids = await fetchFavoriteIds(userId);
    set({ favoriteIds: new Set(ids), isHydrated: true });
  },

  toggle: (userId, restaurantId) => {
    const { favoriteIds } = get();
    const wasFavorited = favoriteIds.has(restaurantId);

    // Optimistic update — change the Set immediately
    const next = new Set(favoriteIds);
    if (wasFavorited) next.delete(restaurantId);
    else next.add(restaurantId);
    set({ favoriteIds: next });

    // Fire the API call in the background
    const apiCall = wasFavorited
      ? removeFavorite(userId, restaurantId)
      : addFavorite(userId, restaurantId);

    apiCall.catch(() => {
      // Revert on error — re-read current state since other toggles may have happened
      const reverted = new Set(get().favoriteIds);
      if (wasFavorited) reverted.add(restaurantId);
      else reverted.delete(restaurantId);
      set({ favoriteIds: reverted });
      Alert.alert('Error', 'Could not update favorite. Please try again.');
    });
  },

  isFavorite: (restaurantId) => get().favoriteIds.has(restaurantId),

  reset: () => set({ favoriteIds: new Set(), isHydrated: false }),
}));
