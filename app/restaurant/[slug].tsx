import { useState, useEffect, useRef } from 'react';
import {
  SectionList, View, Text, Pressable, RefreshControl, Linking, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Minus, Star, MapPin, Phone, Globe } from 'lucide-react-native';
import { Image } from 'expo-image';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCartStore } from '@/stores/cart-store';
import { CartFloatingBar } from '@/components/cart/cart-floating-bar';
import { CartConflictDialog } from '@/components/cart/cart-conflict-dialog';
import { CartBottomSheet } from '@/components/cart/cart-bottom-sheet';
import { RestaurantHeader } from '@/components/restaurant/restaurant-header';
import { RestaurantDetailSkeleton } from '@/components/restaurant/restaurant-detail-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useRestaurantDetail } from '@/hooks/use-restaurant-detail';
import { useRestaurantReviews } from '@/hooks/use-restaurant-reviews';
import { type MenuItem } from '@/lib/api/menu';
import { type ReviewWithProfile } from '@/lib/api/reviews';
import { type Restaurant } from '@/lib/api/restaurants';

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

  const cartItems = useCartStore((s) => s.items);
  const cartRestaurantId = useCartStore((s) => s.restaurantId);
  const cartRestaurantName = useCartStore((s) => s.restaurantName);
  const hasConflict = useCartStore((s) => s.hasConflict);
  const confirmConflict = useCartStore((s) => s.confirmConflict);
  const cancelConflict = useCartStore((s) => s.cancelConflict);

  const conflictDialogRef = useRef<BottomSheetModal>(null);
  const cartSheetRef = useRef<BottomSheetModal>(null);

  // Present conflict dialog when store detects a restaurant mismatch
  useEffect(() => {
    if (hasConflict) {
      conflictDialogRef.current?.present();
    }
  }, [hasConflict]);

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

    return [
      tabBarSection,
      { key: `${activeTab}-content`, title: '', data: [null] },
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
        contentContainerStyle={{
          paddingBottom: cartItems.length > 0 && cartRestaurantId === restaurant.id ? 72 : 0,
        }}
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

          // Reviews tab content
          if (section.key === 'reviews-content') {
            return <ReviewsTabContent restaurantId={restaurant.id} />;
          }

          // Info tab content
          if (section.key === 'info-content') {
            return <InfoTabContent restaurant={restaurant} />;
          }

          // Menu item row
          if (item && 'price' in item) {
            return <MenuItemRow item={item as MenuItem} restaurantName={restaurant.name} />;
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

      <CartFloatingBar
        currentRestaurantId={restaurant.id}
        onViewCart={() => cartSheetRef.current?.present()}
      />

      <CartConflictDialog
        ref={conflictDialogRef}
        currentRestaurantName={cartRestaurantName ?? restaurant.name}
        onReplace={() => {
          confirmConflict();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          conflictDialogRef.current?.dismiss();
        }}
        onKeep={() => {
          cancelConflict();
          conflictDialogRef.current?.dismiss();
        }}
      />

      <CartBottomSheet
        ref={cartSheetRef}
        onCheckout={() => Alert.alert('Checkout', 'Checkout flow coming in Story 5.4')}
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

function MenuItemRow({ item, restaurantName }: { item: MenuItem; restaurantName: string }) {
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
              onPress={() => {
                addItem({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  restaurant_id: item.restaurant_id,
                  restaurant_name: restaurantName,
                });
                // Only haptic when item was actually added (not on conflict)
                if (!useCartStore.getState().hasConflict) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
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

// ── Reviews tab content ────────────────────────────────────────────────────

function ReviewsTabContent({ restaurantId }: { restaurantId: string }) {
  const { reviews, isLoading, error, refetch } = useRestaurantReviews(restaurantId);

  if (isLoading) {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator size="small" color="#dc2626" />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  if (reviews.length === 0) {
    return <EmptyState type="restaurant_reviews_empty" />;
  }

  return (
    <View className="pb-4">
      <RatingBreakdown reviews={reviews} />
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </View>
  );
}

// ── Rating breakdown bar chart ─────────────────────────────────────────────

function RatingBreakdown({ reviews }: { reviews: ReviewWithProfile[] }) {
  const total = reviews.length;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  // Count reviews per star level
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    counts[r.rating] = (counts[r.rating] ?? 0) + 1;
  }
  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <View className="px-4 py-4 border-b border-gray-100">
      {/* Average + total */}
      <View className="flex-row items-center mb-3">
        <Text className="font-[Karla_700Bold] text-2xl text-gray-900 mr-1.5">
          {average.toFixed(1)}
        </Text>
        <Star size={20} color="#ca8a04" fill="#ca8a04" />
        <Text className="font-[Karla_400Regular] text-sm text-gray-500 ml-2">
          ({total} {total === 1 ? 'review' : 'reviews'})
        </Text>
      </View>

      {/* Bar chart — 5 down to 1 */}
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star];
        const percentage = (count / maxCount) * 100;

        return (
          <View key={star} className="flex-row items-center mb-1">
            <Text className="font-[Karla_600SemiBold] text-xs text-gray-600 w-3">
              {star}
            </Text>
            <Star size={10} color="#ca8a04" fill="#ca8a04" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
              <View
                className="h-2 bg-yellow-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </View>
            <Text className="font-[Karla_400Regular] text-xs text-gray-500 w-4 text-right">
              {count}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Individual review card ─────────────────────────────────────────────────

function getRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function ReviewCard({ review }: { review: ReviewWithProfile }) {
  const displayName = review.profiles?.display_name ?? 'Anonymous';
  const avatarUrl = review.profiles?.avatar_url;

  return (
    <View className="px-4 py-3 border-b border-gray-50">
      <View className="flex-row items-start">
        {/* Avatar */}
        {avatarUrl ? (
          <Image
            source={avatarUrl}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
            accessibilityLabel={`${displayName} avatar`}
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center">
            <Text className="font-[Karla_700Bold] text-xs text-gray-600">
              {getInitials(displayName)}
            </Text>
          </View>
        )}

        {/* Name, rating, date */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
              {displayName}
            </Text>
            <Text className="font-[Karla_400Regular] text-xs text-gray-400">
              {review.created_at ? getRelativeDate(review.created_at) : ''}
            </Text>
          </View>

          {/* Star rating */}
          <View className="flex-row mt-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={12}
                color={star <= review.rating ? '#ca8a04' : '#d1d5db'}
                fill={star <= review.rating ? '#ca8a04' : 'transparent'}
              />
            ))}
          </View>

          {/* Comment */}
          {review.comment && (
            <Text className="font-[Karla_400Regular] text-sm text-gray-700 mt-1.5">
              {review.comment}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Info tab content ───────────────────────────────────────────────────────

function InfoTabContent({ restaurant }: { restaurant: Restaurant }) {
  return (
    <View className="px-4 py-4">
      {/* Open/Closed status */}
      <View className="flex-row items-center mb-5">
        <View
          className={`w-2.5 h-2.5 rounded-full mr-2 ${
            restaurant.is_open ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <Text
          className={`font-[Karla_600SemiBold] text-base ${
            restaurant.is_open ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {restaurant.is_open ? 'Open now' : 'Closed'}
        </Text>
      </View>

      {/* Address */}
      {restaurant.address && (
        <View className="flex-row items-start mb-4">
          <MapPin size={20} color="#6b7280" />
          <Text className="font-[Karla_400Regular] text-sm text-gray-700 ml-3 flex-1">
            {restaurant.address}
          </Text>
        </View>
      )}

      {/* Phone — tap to call */}
      {restaurant.phone && (
        <Pressable
          onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}
          accessibilityRole="link"
          accessibilityLabel={`Call restaurant at ${restaurant.phone}`}
          className="flex-row items-center mb-4"
        >
          <Phone size={20} color="#6b7280" />
          <Text className="font-[Karla_400Regular] text-sm text-red-600 ml-3">
            {restaurant.phone}
          </Text>
        </Pressable>
      )}

      {/* Website — tap to open */}
      {restaurant.website && (
        <Pressable
          onPress={() => { if (restaurant.website) Linking.openURL(restaurant.website); }}
          accessibilityRole="link"
          accessibilityLabel={`Open website ${restaurant.website}`}
          className="flex-row items-center mb-4"
        >
          <Globe size={20} color="#6b7280" />
          <Text className="font-[Karla_400Regular] text-sm text-red-600 ml-3">
            {restaurant.website}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
