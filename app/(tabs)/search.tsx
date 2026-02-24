import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Search, X, Clock, Star, TrendingUp, UtensilsCrossed } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { useSearch } from '@/hooks/use-search';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { useDietaryFilters } from '@/hooks/use-dietary-filters';
import { DietaryFilterBar } from '@/components/home/dietary-filter-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PreSearchSkeleton, ResultsSkeleton } from '@/components/search/search-skeleton';
import { TRENDING_SEARCHES } from '@/constants/trending-searches';
import { type Restaurant } from '@/lib/api/restaurants';
import { type TrendingDish } from '@/lib/api/menu';

type ActiveTab = 'restaurants' | 'dishes';

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('restaurants');
  const { activeFilters, toggleFilter } = useDietaryFilters();
  const { restaurants, dishes, isLoading, error, refetch } = useSearch(query, activeFilters);
  const {
    searches: recentSearches,
    add: addRecent,
    remove: removeRecent,
    clear: clearRecent,
    isLoading: isRecentLoading,
  } = useRecentSearches();

  const hasQuery = query.trim().length > 0;

  function handleSearchSubmit(text: string) {
    const trimmed = text.trim();
    if (trimmed) addRecent(trimmed);
  }

  function handleTapRecent(text: string) {
    setQuery(text);
    addRecent(text);
  }

  function handleTapTrending(label: string) {
    setQuery(label);
    addRecent(label);
  }

  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
  }

  // ── Pre-search state (no query) ──────────────────────────────
  function renderPreSearchState() {
    return (
      <View className="flex-1 px-4 pt-2">
        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-[Karla_700Bold] text-base text-gray-900">
                Recent
              </Text>
              <Pressable
                onPress={clearRecent}
                accessibilityRole="button"
                accessibilityLabel="Clear all recent searches"
                className="py-1 px-2"
              >
                <Text className="font-[Karla_400Regular] text-sm text-red-600">Clear all</Text>
              </Pressable>
            </View>
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleTapRecent(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Recent search: ${item}`}
                  className="flex-row items-center bg-gray-100 rounded-full px-3 py-2 mr-2"
                >
                  <Clock size={14} color="#6b7280" />
                  <Text className="font-[Karla_400Regular] text-sm text-gray-700 ml-1.5">
                    {item}
                  </Text>
                  <Pressable
                    onPress={() => removeRecent(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item} from recent searches`}
                    className="ml-2 p-0.5"
                    hitSlop={8}
                  >
                    <X size={12} color="#9ca3af" />
                  </Pressable>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Trending searches */}
        <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-2">
          Trending
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {TRENDING_SEARCHES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleTapTrending(item.label)}
              accessibilityRole="button"
              accessibilityLabel={`Trending search: ${item.label}`}
              className="flex-row items-center bg-red-50 rounded-full px-3 py-2"
            >
              <TrendingUp size={14} color="#dc2626" />
              <Text className="font-[Karla_500Medium] text-sm text-red-700 ml-1.5">
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // ── Post-search state (has query) ────────────────────────────
  function renderPostSearchState() {
    if (isLoading) return <ResultsSkeleton />;
    if (error) return <ErrorState message={error.message} onRetry={refetch} />;

    const activeData = activeTab === 'restaurants' ? restaurants : dishes;
    const isEmpty = restaurants.length === 0 && dishes.length === 0;

    if (isEmpty) return <EmptyState type="search_results" />;

    return (
      <View className="flex-1">
        {/* Tab bar */}
        <View className="flex-row px-4 pt-2 pb-3 gap-x-2">
          <Pressable
            onPress={() => setActiveTab('restaurants')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'restaurants' }}
            accessibilityLabel={`Restaurants tab, ${restaurants.length} results`}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              activeTab === 'restaurants' ? 'bg-red-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`font-[Karla_600SemiBold] text-sm ${
                activeTab === 'restaurants' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Restaurants ({restaurants.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('dishes')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'dishes' }}
            accessibilityLabel={`Dishes tab, ${dishes.length} results`}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              activeTab === 'dishes' ? 'bg-red-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`font-[Karla_600SemiBold] text-sm ${
                activeTab === 'dishes' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Dishes ({dishes.length})
            </Text>
          </Pressable>
        </View>

        {/* Dietary filter chips */}
        <DietaryFilterBar activeFilters={activeFilters} onToggle={toggleFilter} />

        {/* Results list */}
        {activeTab === 'restaurants' ? (
          <FlatList
            data={restaurants}
            keyExtractor={(item: Restaurant) => item.id}
            renderItem={({ item }: { item: Restaurant }) => (
              <RestaurantSearchRow restaurant={item} />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={dishes}
            keyExtractor={(item: TrendingDish) => item.id}
            renderItem={({ item }: { item: TrendingDish }) => (
              <DishSearchRow dish={item} />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* ── Search input ──────────────────────────────────────── */}
      <View className="flex-row items-center mx-4 mt-2 mb-2 bg-gray-100 rounded-xl px-4 py-2">
        <Search size={18} color="#9ca3af" />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearchSubmit(query)}
          placeholder="Search restaurants and dishes"
          placeholderTextColor="#9ca3af"
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Search restaurants and dishes"
          accessibilityRole="search"
          className="flex-1 font-[Karla_400Regular] text-sm text-gray-900 ml-2 py-1.5"
        />
        {hasQuery && (
          <Pressable
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            className="p-1"
            hitSlop={8}
          >
            <X size={18} color="#6b7280" />
          </Pressable>
        )}
      </View>

      {/* ── Content ───────────────────────────────────────────── */}
      {hasQuery
        ? renderPostSearchState()
        : isRecentLoading
          ? <PreSearchSkeleton />
          : renderPreSearchState()}
    </SafeAreaView>
  );
}

// ── Search result row components (full-width, not carousel) ────────────

function RestaurantSearchRow({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${restaurant.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, rated ${restaurant.rating ?? 'unrated'}`}
      className="flex-row gap-x-3 mb-3 pb-3 border-b border-gray-100"
    >
      <Image
        source={restaurant.cover_image_url ?? undefined}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        contentFit="cover"
        className="w-20 h-20 rounded-xl bg-gray-200"
        accessibilityLabel={`${restaurant.name} photo`}
      />
      <View className="flex-1 justify-center">
        <Text className="font-[Karla_700Bold] text-sm text-gray-900" numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View className="flex-row items-center mt-1">
          {restaurant.cuisine_type && (
            <Text className="font-[Karla_400Regular] text-xs text-gray-500">
              {restaurant.cuisine_type}
            </Text>
          )}
          {restaurant.cuisine_type && restaurant.price_range && (
            <Text className="font-[Karla_400Regular] text-xs text-gray-400 mx-1">·</Text>
          )}
          {restaurant.price_range && (
            <Text className="font-[Karla_400Regular] text-xs text-gray-500">
              {restaurant.price_range}
            </Text>
          )}
        </View>
        <View className="flex-row items-center mt-1">
          {restaurant.rating != null && (
            <View className="flex-row items-center mr-2">
              <Star size={12} color="#ca8a04" fill="#ca8a04" />
              <Text className="font-[Karla_600SemiBold] text-xs text-gray-700 ml-0.5">
                {restaurant.rating.toFixed(1)}
              </Text>
            </View>
          )}
          {restaurant.delivery_time_min != null && (
            <Text className="font-[Karla_400Regular] text-xs text-gray-500">
              {restaurant.delivery_time_min} min
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function DishSearchRow({ dish }: { dish: TrendingDish }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${dish.restaurant.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${dish.price} DA, from ${dish.restaurant.name}`}
      className="flex-row gap-x-3 mb-3 pb-3 border-b border-gray-100"
    >
      {dish.image_url ? (
        <Image
          source={dish.image_url}
          contentFit="cover"
          className="w-20 h-20 rounded-xl bg-gray-200"
          accessibilityLabel={`${dish.name} photo`}
        />
      ) : (
        <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center">
          <UtensilsCrossed size={24} color="#d1d5db" />
        </View>
      )}
      <View className="flex-1 justify-center">
        <Text className="font-[Karla_700Bold] text-sm text-gray-900" numberOfLines={1}>
          {dish.name}
        </Text>
        <Text className="font-[Karla_700Bold] text-sm text-red-600 mt-0.5">
          {dish.price} DA
        </Text>
        <Text className="font-[Karla_400Regular] text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {dish.restaurant.name}
        </Text>
      </View>
    </Pressable>
  );
}
