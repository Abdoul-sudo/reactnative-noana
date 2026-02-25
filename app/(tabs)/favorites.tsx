import { FlatList, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useFavoriteRestaurants } from '@/hooks/use-favorite-restaurants';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAuthStore } from '@/stores/auth-store';
import { RestaurantCard } from '@/components/home/restaurant-card';
import { FavoritesSkeleton } from '@/components/favorites/favorites-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { type Restaurant } from '@/lib/api/restaurants';

export default function FavoritesScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isHydrated = useFavoritesStore((s) => s.isHydrated);
  const hydrate = useFavoritesStore((s) => s.hydrate);
  const { restaurants, isLoading, error, refetch } = useFavoriteRestaurants();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasMounted = useRef(false);

  // Hydrate the favorites store on mount if not already done
  useEffect(() => {
    if (session?.user?.id && !isHydrated) {
      hydrate(session.user.id);
    }
  }, [session?.user?.id, isHydrated]);

  // Refetch when the tab gains focus (handles stale data after toggling hearts elsewhere)
  useFocusEffect(
    useCallback(() => {
      // Skip the initial mount — useFavoriteRestaurants already fetches on mount
      if (!hasMounted.current) {
        hasMounted.current = true;
        return;
      }
      refetch();
    }, [refetch]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // ── Loading → Error → Empty → Content ──────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Text className="font-[Karla_700Bold] text-lg text-gray-900 px-4 py-3">
          Favorites
        </Text>
        <FavoritesSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Text className="font-[Karla_700Bold] text-lg text-gray-900 px-4 py-3">
          Favorites
        </Text>
        <ErrorState message={error.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (restaurants.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Text className="font-[Karla_700Bold] text-lg text-gray-900 px-4 py-3">
          Favorites
        </Text>
        <EmptyState
          type="favorites"
          onCta={() => router.navigate('/(tabs)/')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Text className="font-[Karla_700Bold] text-lg text-gray-900 px-4 py-3">
        Favorites
      </Text>
      <FlatList
        data={restaurants}
        numColumns={2}
        keyExtractor={(item: Restaurant) => item.id}
        renderItem={({ item }: { item: Restaurant }) => (
          <RestaurantCard restaurant={item} layout="grid" />
        )}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#DC2626"
          />
        }
      />
    </SafeAreaView>
  );
}
