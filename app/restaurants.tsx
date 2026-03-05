import { useRef } from 'react';
import { FlatList, ScrollView, View, Text, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react-native';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { DietaryFilterBar } from '@/components/home/dietary-filter-bar';
import { RestaurantCard } from '@/components/home/restaurant-card';
import { ListingSkeleton } from '@/components/restaurant/listing-skeleton';
import { FilterBottomSheet } from '@/components/restaurant/filter-bottom-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useDietaryFilters } from '@/hooks/use-dietary-filters';
import { useRestaurantListing, type ListingFilters } from '@/hooks/use-restaurant-listing';
import { type Restaurant } from '@/lib/api/restaurants';
import { useRestaurantPromotions } from '@/hooks/use-restaurant-promotions';

/**
 * Restaurant listing screen with filters, cards, and infinite scroll.
 *
 * Route: /restaurants?cuisine=Italian
 * Accessible from: home screen cuisine categories, future entry points.
 *
 * Data flow (AR29): DB → lib/api/restaurants.ts → hooks/use-restaurant-listing.ts → this screen
 */
export default function RestaurantsScreen() {
  const router = useRouter();
  const { cuisine } = useLocalSearchParams<{ cuisine?: string }>();
  const filterSheetRef = useRef<BottomSheetModal>(null);

  const { activeFilters, toggleFilter, clearFilters } = useDietaryFilters();
  const {
    restaurants,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refetch,
    filters,
    updateFilters,
    clearAllFilters,
    hasActiveFilters,
  } = useRestaurantListing(cuisine, activeFilters);

  const { promotionsMap } = useRestaurantPromotions(restaurants.map((r) => r.id));

  function handleClearAll() {
    clearFilters();
    clearAllFilters();
  }

  // Remove a single server-side filter by key
  function removeFilter(key: keyof ListingFilters) {
    updateFilters({ [key]: undefined });
  }

  function renderItem({ item }: { item: Restaurant }) {
    return <RestaurantCard restaurant={item} layout="list" promotions={promotionsMap.get(item.id)} />;
  }

  function renderFooter() {
    if (!isLoadingMore || !hasMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#dc2626" />
      </View>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;
    return (
      <EmptyState
        type={hasActiveFilters ? 'restaurant_listing_filtered' : 'restaurant_listing'}
        onCta={hasActiveFilters ? handleClearAll : undefined}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Header title={cuisine ?? 'Restaurants'} onBack={() => router.back()} />
        <ListingSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Header title={cuisine ?? 'Restaurants'} onBack={() => router.back()} />
        <ErrorState message={error.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* ── Header ────────────────────────────────────── */}
      <Header
        title={cuisine ?? 'Restaurants'}
        onBack={() => router.back()}
        onFilter={() => filterSheetRef.current?.present()}
      />

      {/* ── Dietary filter bar ────────────────────────── */}
      <DietaryFilterBar activeFilters={activeFilters} onToggle={toggleFilter} />

      {/* ── Active server-side filter chips (AC#1, Task 7.3) ── */}
      <ActiveFilterChips
        filters={filters}
        onRemove={removeFilter}
        onOpenSheet={() => filterSheetRef.current?.present()}
      />

      {/* ── Restaurant list (infinite scroll) ─────────── */}
      <FlatList
        data={restaurants}
        keyExtractor={(item: Restaurant) => item.id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={restaurants.length === 0 ? { flex: 1 } : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            tintColor="#dc2626"
          />
        }
      />

      {/* ── Filter bottom sheet (AR31) ────────────────── */}
      <FilterBottomSheet
        ref={filterSheetRef}
        currentFilters={filters}
        onApply={updateFilters}
        onClear={handleClearAll}
      />
    </SafeAreaView>
  );
}

// ── Active filter chips ─────────────────────────────────────────────────────
// Shows active server-side filters as removable chips + "Filters" button.
// Only renders when at least one server-side filter is active or as entry
// point to the bottom sheet.

type ActiveFilterChipsProps = {
  filters: ListingFilters;
  onRemove: (key: keyof ListingFilters) => void;
  onOpenSheet: () => void;
};

function ActiveFilterChips({ filters, onRemove, onOpenSheet }: ActiveFilterChipsProps) {
  const chips: { key: keyof ListingFilters; label: string }[] = [];

  if (filters.cuisine) chips.push({ key: 'cuisine', label: filters.cuisine });
  if (filters.priceRange) chips.push({ key: 'priceRange', label: filters.priceRange });
  if (filters.minRating != null) chips.push({ key: 'minRating', label: `${filters.minRating}+ ★` });
  if (filters.maxDeliveryTime != null) chips.push({ key: 'maxDeliveryTime', label: `≤${filters.maxDeliveryTime} min` });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-1.5"
    >
      {/* "Filters" entry button — always visible */}
      <Pressable
        onPress={onOpenSheet}
        accessibilityRole="button"
        accessibilityLabel="Open filter options"
        className="flex-row items-center px-3 py-2 rounded-full border border-gray-300"
      >
        <SlidersHorizontal size={14} color="#4b5563" />
        <Text className="font-[Karla_600SemiBold] text-xs text-gray-600 ml-1.5">
          Filters
        </Text>
      </Pressable>

      {/* Active filter chips — tap to remove */}
      {chips.map(chip => (
        <Pressable
          key={chip.key}
          onPress={() => onRemove(chip.key)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${chip.label} filter`}
          className="flex-row items-center px-3 py-2 rounded-full bg-red-600"
        >
          <Text className="font-[Karla_600SemiBold] text-xs text-white">
            {chip.label}
          </Text>
          <X size={12} color="#ffffff" className="ml-1" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ── Header subcomponent ─────────────────────────────────────────────────────

type HeaderProps = {
  title: string;
  onBack: () => void;
  onFilter?: () => void;
};

function Header({ title, onBack, onFilter }: HeaderProps) {
  return (
    <View className="flex-row items-center px-4 py-3">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="p-2"
      >
        <ArrowLeft size={24} color="#1f2937" />
      </Pressable>
      <Text
        accessibilityRole="header"
        className="flex-1 font-[Karla_700Bold] text-lg text-gray-900 ml-2"
        numberOfLines={1}
      >
        {title}
      </Text>
      {onFilter && (
        <Pressable
          onPress={onFilter}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          className="p-2"
        >
          <SlidersHorizontal size={22} color="#1f2937" />
        </Pressable>
      )}
    </View>
  );
}
