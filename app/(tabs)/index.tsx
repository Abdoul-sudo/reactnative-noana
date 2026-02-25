import { FlatList, ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, MapPin, ChevronDown, Search } from 'lucide-react-native';
import { useState } from 'react';
import { DietaryFilterBar } from '@/components/home/dietary-filter-bar';
import { CategoryScroll } from '@/components/home/category-scroll';
import { RestaurantCard } from '@/components/home/restaurant-card';
import { DishCard } from '@/components/home/dish-card';
import { HomeSkeleton } from '@/components/home/home-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useDietaryFilters } from '@/hooks/use-dietary-filters';
import { useCuisineCategories } from '@/hooks/use-cuisine-categories';
import { useFeaturedRestaurants } from '@/hooks/use-featured-restaurants';
import { useTrendingDishes } from '@/hooks/use-trending-dishes';
import { useTopRatedRestaurants } from '@/hooks/use-top-rated-restaurants';
import { type Restaurant } from '@/lib/api/restaurants';
import { type TrendingDish } from '@/lib/api/menu';
import { useSurpriseMe } from '@/hooks/use-surprise-me';
import { SurpriseMeCard } from '@/components/home/surprise-me-card';
import { ReorderSection } from '@/components/home/reorder-section';

export default function HomeScreen() {
  const router = useRouter();
  const { activeFilters, toggleFilter, clearFilters } = useDietaryFilters();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { categories } = useCuisineCategories();
  const {
    restaurants: featuredRestaurants,
    isLoading: featuredLoading,
    error: featuredError,
    refetch: refetchFeatured,
  } = useFeaturedRestaurants(activeFilters);
  const {
    dishes: trendingDishes,
    isLoading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useTrendingDishes(activeFilters);
  const {
    restaurants: topRatedRestaurants,
    isLoading: topRatedLoading,
    error: topRatedError,
    refetch: refetchTopRated,
  } = useTopRatedRestaurants(activeFilters);

  const { surprise, trigger, reset, hasResults } = useSurpriseMe(trendingDishes);

  const isLoading = featuredLoading || trendingLoading || topRatedLoading;

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([refetchFeatured(), refetchTrending(), refetchTopRated()]);
    setIsRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {isLoading ? (
        <HomeSkeleton />
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#dc2626"
          />
        }
      >
        {/* ── Header row 1: brand + bell + loyalty ───────────── */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text
            accessibilityRole="header"
            className="font-[PlayfairDisplaySC_400Regular] text-2xl text-gray-900"
          >
            noana
          </Text>
          <View className="flex-row items-center gap-x-3">
            <Pressable
              onPress={() => router.push('/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              className="p-2.5"
            >
              <Bell size={24} color="#1f2937" />
            </Pressable>
            <View className="bg-red-600 px-2 py-0.5 rounded-full">
              <Text className="font-[Karla_600SemiBold] text-xs text-white">0 pts</Text>
            </View>
          </View>
        </View>

        {/* ── Header row 2: location selector ───────────────── */}
        <Pressable
          className="flex-row items-center px-4 py-2.5 gap-x-1"
          accessibilityRole="button"
          accessibilityLabel="Select delivery location"
        >
          <MapPin size={16} color="#dc2626" />
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-800 flex-1">
            Select location
          </Text>
          <ChevronDown size={14} color="#6b7280" />
        </Pressable>

        {/* ── Search bar (tappable, navigates to search tab) ── */}
        <Pressable
          onPress={() => router.navigate('/(tabs)/search')}
          accessibilityRole="button"
          accessibilityLabel="Search restaurants and dishes"
          className="mx-4 mb-2 flex-row items-center bg-gray-100 rounded-xl px-4 py-3.5"
        >
          <Search size={18} color="#9ca3af" />
          <Text className="font-[Karla_400Regular] text-sm text-gray-400 ml-2">
            Search restaurants and dishes
          </Text>
        </Pressable>

        {/* ── Dietary filter chips ───────────────────────────── */}
        <DietaryFilterBar activeFilters={activeFilters} onToggle={toggleFilter} />

        {/* ── Cuisine categories ─────────────────────────────── */}
        <View className="mt-2">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 px-4 mb-2">
            Cuisine Categories
          </Text>
          <CategoryScroll categories={categories} />
        </View>

        {/* ── Surprise Me! ──────────────────────────────────── */}
        <SurpriseMeCard
          surprise={surprise}
          hasResults={hasResults}
          onTrigger={trigger}
          onReset={reset}
        />

        {/* ── Order Again (reorder from previous orders) ──────── */}
        <ReorderSection />

        {/* ── Featured restaurants ────────────────────────────── */}
        <View className="mt-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 px-4 mb-2">
            Featured Restaurants
          </Text>
          {featuredError ? (
            <ErrorState message={featuredError.message} onRetry={refetchFeatured} />
          ) : featuredRestaurants.length === 0 ? (
            <EmptyState type="featured_restaurants" />
          ) : (
            <FlatList
              data={featuredRestaurants}
              keyExtractor={(item: Restaurant) => item.id}
              renderItem={({ item }: { item: Restaurant }) => (
                <RestaurantCard restaurant={item} />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          )}
        </View>

        {/* ── Trending dishes ────────────────────────────────── */}
        <View className="mt-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 px-4 mb-2">
            Trending Dishes
          </Text>
          {trendingError ? (
            <ErrorState message={trendingError.message} onRetry={refetchTrending} />
          ) : trendingDishes.length === 0 ? (
            <EmptyState type="trending_dishes" />
          ) : (
            <FlatList
              data={trendingDishes}
              keyExtractor={(item: TrendingDish) => item.id}
              renderItem={({ item }: { item: TrendingDish }) => (
                <DishCard dish={item} />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          )}
        </View>

        {/* ── Top rated restaurants (2-column grid) ──────────── */}
        <View className="mt-4 mb-6">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 px-4 mb-2">
            Top Rated
          </Text>
          {topRatedError ? (
            <ErrorState message={topRatedError.message} onRetry={refetchTopRated} />
          ) : topRatedRestaurants.length === 0 ? (
            <EmptyState
              type="top_rated"
              onCta={activeFilters.size > 0 ? clearFilters : undefined}
            />
          ) : (
            <FlatList
              data={topRatedRestaurants}
              keyExtractor={(item: Restaurant) => item.id}
              renderItem={({ item }: { item: Restaurant }) => (
                <RestaurantCard restaurant={item} layout="grid" />
              )}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
              contentContainerStyle={{ gap: 12 }}
            />
          )}
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
