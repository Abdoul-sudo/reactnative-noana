import { useState } from 'react';
import { SectionList, View, Text, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Minus } from 'lucide-react-native';
import { useCartStore } from '@/stores/cart-store';
import { RestaurantHeader } from '@/components/restaurant/restaurant-header';
import { RestaurantDetailSkeleton } from '@/components/restaurant/restaurant-detail-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useRestaurantDetail } from '@/hooks/use-restaurant-detail';
import { type MenuItem } from '@/lib/api/menu';

type TabKey = 'menu' | 'reviews' | 'info';

type SectionData = {
  key: string;
  title: string;
  data: (MenuItem | null)[];
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'menu', label: 'Menu' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'info', label: 'Info' },
];

/**
 * Restaurant detail screen with cover photo header & sticky tab bar.
 *
 * Route: /restaurant/[slug]
 * Pattern: Single SectionList to avoid nested VirtualizedLists.
 *   - ListHeaderComponent = cover photo + restaurant info
 *   - Section 0 = tab bar (sticky via stickyHeaderIndices)
 *   - Remaining sections = content based on active tab
 *
 * Data flow: lib/api → hooks/use-restaurant-detail → this screen
 */
export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('menu');

  const {
    restaurant,
    menuCategories,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useRestaurantDetail(slug ?? '');

  // ── Loading state ────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <BackButton onPress={() => router.back()} />
        <RestaurantDetailSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <BackButton onPress={() => router.back()} />
        <ErrorState message={error.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  // ── Not found state (AC#8) ───────────────────────────
  if (!restaurant) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <BackButton onPress={() => router.back()} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-[Karla_700Bold] text-lg text-gray-800 text-center">
            Restaurant not found
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-2 text-center">
            This restaurant may have been removed or the link is invalid.
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="mt-6 px-6 py-3 bg-red-600 rounded-full"
          >
            <Text className="font-[Karla_600SemiBold] text-sm text-white">
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Build sections based on active tab ───────────────
  const tabBarSection: SectionData = { key: 'tab-bar', title: '', data: [null] };

  function buildSections(): SectionData[] {
    if (activeTab === 'menu') {
      if (menuCategories.length === 0) {
        return [tabBarSection, { key: 'menu-empty', title: '', data: [null] }];
      }
      return [
        tabBarSection,
        ...menuCategories.map((cat) => ({
          key: cat.id,
          title: cat.name,
          data: cat.items as (MenuItem | null)[],
        })),
      ];
    }

    // Reviews and Info: placeholder content (Story 4.3)
    return [
      tabBarSection,
      { key: `${activeTab}-placeholder`, title: '', data: [null] },
    ];
  }

  const sections = buildSections();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <BackButton onPress={() => router.back()} />

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => (item as MenuItem)?.id ?? `placeholder-${index}`}
        stickySectionHeadersEnabled
        ListHeaderComponent={<RestaurantHeader restaurant={restaurant} />}
        renderSectionHeader={({ section }) => {
          if (section.key === 'tab-bar') {
            return (
              <DetailTabBar activeTab={activeTab} onTabChange={setActiveTab} />
            );
          }
          // Menu category header
          if (activeTab === 'menu' && section.title) {
            return (
              <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <Text
                  accessibilityRole="header"
                  className="font-[Karla_700Bold] text-base text-gray-900"
                >
                  {section.title}
                </Text>
              </View>
            );
          }
          return null;
        }}
        renderItem={({ item, section }) => {
          // Tab bar section has a null data item — render nothing
          if (section.key === 'tab-bar') return null;

          // Menu empty state
          if (section.key === 'menu-empty') {
            return <EmptyState type="restaurant_menu_empty" />;
          }

          // Reviews / Info placeholders
          if (section.key === 'reviews-placeholder') {
            return (
              <View className="items-center justify-center py-16 px-8">
                <Text className="font-[Karla_600SemiBold] text-base text-gray-500">
                  Reviews coming soon
                </Text>
                <Text className="font-[Karla_400Regular] text-sm text-gray-400 mt-1 text-center">
                  Reviews will be available in a future update.
                </Text>
              </View>
            );
          }
          if (section.key === 'info-placeholder') {
            return (
              <View className="items-center justify-center py-16 px-8">
                <Text className="font-[Karla_600SemiBold] text-base text-gray-500">
                  Info coming soon
                </Text>
                <Text className="font-[Karla_400Regular] text-sm text-gray-400 mt-1 text-center">
                  Operating hours, address, and contact info will be available soon.
                </Text>
              </View>
            );
          }

          // Menu item row
          if (item && 'price' in item) {
            return <MenuItemRow item={item as MenuItem} />;
          }

          return null;
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            tintColor="#dc2626"
          />
        }
      />
    </SafeAreaView>
  );
}

// ── Back button ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <View className="absolute top-12 left-4 z-10">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="w-10 h-10 rounded-full bg-white/80 items-center justify-center"
      >
        <ArrowLeft size={22} color="#1f2937" />
      </Pressable>
    </View>
  );
}

// ── Detail tab bar (sticky) ─────────────────────────────────────────────────

type DetailTabBarProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
};

function DetailTabBar({ activeTab, onTabChange }: DetailTabBarProps) {
  return (
    <View className="flex-row bg-white border-b border-gray-200">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} tab`}
            accessibilityState={{ selected: isActive }}
            className="flex-1 items-center py-3"
          >
            <Text
              className={
                isActive
                  ? 'font-[Karla_700Bold] text-sm text-red-600'
                  : 'font-[Karla_500Medium] text-sm text-gray-500'
              }
            >
              {tab.label}
            </Text>
            {isActive && (
              <View className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-600 rounded-full" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Menu item row with add-to-cart ───────────────────────────────────────────

function MenuItemRow({ item }: { item: MenuItem }) {
  const dietaryTags = Array.isArray(item.dietary_tags)
    ? (item.dietary_tags as string[])
    : [];
  const isUnavailable = item.is_available === false;

  const quantity = useCartStore(
    (s) => s.items.find((i) => i.id === item.id)?.quantity ?? 0,
  );
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  return (
    <View
      className={`px-4 py-3 border-b border-gray-50 ${isUnavailable ? 'opacity-50' : ''}`}
      accessibilityRole="summary"
      accessibilityLabel={
        `${item.name}, ${item.price} DA${isUnavailable ? ', unavailable' : ''}`
      }
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          {/* Name */}
          <Text className="font-[Karla_600SemiBold] text-base text-gray-900">
            {item.name}
          </Text>

          {/* Description */}
          {item.description && (
            <Text
              className="font-[Karla_400Regular] text-sm text-gray-500 mt-0.5"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          {/* Dietary tags */}
          {dietaryTags.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-1.5">
              {dietaryTags.map((tag) => (
                <View key={tag} className="px-1.5 py-0.5 rounded bg-green-50">
                  <Text className="font-[Karla_400Regular] text-xs text-green-700">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Prep time */}
          {item.prep_time_min != null && (
            <Text className="font-[Karla_400Regular] text-xs text-gray-400 mt-1">
              ~{item.prep_time_min} min
            </Text>
          )}
        </View>

        {/* Price + cart controls */}
        <View className="items-end">
          <Text className="font-[Karla_700Bold] text-base text-gray-900">
            {item.price} DA
          </Text>

          {!isUnavailable && quantity === 0 && (
            <Pressable
              onPress={() =>
                addItem({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  restaurant_id: item.restaurant_id,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name} to cart`}
              className="mt-2 bg-red-600 rounded-full px-4 py-1.5"
            >
              <Text className="font-[Karla_600SemiBold] text-sm text-white">
                Add
              </Text>
            </Pressable>
          )}

          {!isUnavailable && quantity > 0 && (
            <View className="flex-row items-center mt-2 gap-3">
              <Pressable
                onPress={() => updateQuantity(item.id, quantity - 1)}
                accessibilityRole="button"
                accessibilityLabel={`Decrease quantity of ${item.name}`}
                className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
              >
                <Minus size={16} color="#374151" />
              </Pressable>

              <Text className="font-[Karla_700Bold] text-sm text-gray-900 min-w-[20px] text-center">
                {quantity}
              </Text>

              <Pressable
                onPress={() => updateQuantity(item.id, quantity + 1)}
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${item.name}`}
                className="w-7 h-7 rounded-full bg-red-600 items-center justify-center"
              >
                <Plus size={16} color="#ffffff" />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Unavailable label */}
      {isUnavailable && (
        <Text className="font-[Karla_600SemiBold] text-xs text-red-500 mt-1">
          Unavailable
        </Text>
      )}
    </View>
  );
}
