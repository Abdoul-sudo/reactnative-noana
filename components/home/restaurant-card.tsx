import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Star, Clock, Tag } from 'lucide-react-native';
import { type Restaurant } from '@/lib/api/restaurants';
import { type Promotion } from '@/lib/api/promotions';
import { formatPromotionBadge } from '@/lib/utils/promotion-helpers';
import { HeartToggle } from '@/components/ui/heart-toggle';

type RestaurantCardProps = {
  restaurant: Restaurant;
  /** Active promotions for this restaurant (optional — badge shown when present) */
  promotions?: Promotion[];
  /**
   * 'carousel' = fixed 208px width (horizontal list).
   * 'grid'     = flex width (2-column grid).
   * 'list'     = full-width horizontal row (listing screen).
   */
  layout?: 'carousel' | 'grid' | 'list';
};

export function RestaurantCard({ restaurant, promotions, layout = 'carousel' }: RestaurantCardProps) {
  const router = useRouter();
  const isGrid = layout === 'grid';
  const isList = layout === 'list';

  const dietaryBadges = Array.isArray(restaurant.dietary_options)
    ? (restaurant.dietary_options as string[])
    : [];

  const badgeText = promotions && promotions.length > 0
    ? formatPromotionBadge(promotions)
    : '';

  // ── List layout: full-width horizontal row ────────────────────────
  if (isList) {
    return (
      <Pressable
        onPress={() => router.push(`/restaurant/${restaurant.slug}`)}
        accessibilityRole="button"
        accessibilityLabel={`${restaurant.name}, rated ${restaurant.rating ?? 'unrated'}`}
        className="flex-row px-4 py-3"
      >
        {/* Image left — 80×80 */}
        <Image
          source={restaurant.cover_image_url ?? undefined}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          contentFit="cover"
          className="w-20 h-20 rounded-xl bg-gray-200"
          accessibilityLabel={`${restaurant.name} cover photo`}
        />

        {/* Details right */}
        <View className="flex-1 ml-3 justify-center">
          <View className="flex-row items-center">
            <Text
              className="font-[Karla_700Bold] text-sm text-gray-900 flex-1"
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            <HeartToggle restaurantId={restaurant.id} size={18} />
          </View>

          {/* Cuisine + price range */}
          <View className="flex-row items-center mt-0.5">
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

          {/* Promotion badge */}
          {badgeText !== '' && (
            <View className="flex-row items-center mt-1">
              <View className="flex-row items-center rounded px-1.5 py-0.5" style={{ backgroundColor: '#fef3c7' }}>
                <Tag size={10} color="#d97706" />
                <Text className="font-[Karla_600SemiBold] text-[10px] ml-0.5" style={{ color: '#d97706' }}>
                  {badgeText}
                </Text>
              </View>
            </View>
          )}

          {/* Rating + delivery time */}
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
              <View className="flex-row items-center">
                <Clock size={12} color="#6b7280" />
                <Text className="font-[Karla_400Regular] text-xs text-gray-500 ml-0.5">
                  {restaurant.delivery_time_min} min
                </Text>
              </View>
            )}
          </View>

          {/* Dietary badges */}
          {dietaryBadges.length > 0 && (
            <View className="flex-row flex-wrap mt-1.5 gap-1">
              {dietaryBadges.map((badge) => (
                <View key={badge} className="bg-green-50 px-1.5 py-0.5 rounded">
                  <Text className="font-[Karla_500Medium] text-[10px] text-green-700">
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  // ── Carousel / Grid layout (original) ─────────────────────────────
  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${restaurant.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, rated ${restaurant.rating ?? 'unrated'}`}
      className={isGrid ? 'flex-1' : 'mr-3'}
      style={isGrid ? undefined : { width: 208 }}
    >
      {/* Cover photo with heart overlay and promotion badge */}
      <View className="relative">
        <Image
          source={restaurant.cover_image_url ?? undefined}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          contentFit="cover"
          className={isGrid ? 'w-full h-28 rounded-xl bg-gray-200' : 'w-full h-36 rounded-xl bg-gray-200'}
          accessibilityLabel={`${restaurant.name} cover photo`}
        />
        {badgeText !== '' && (
          <View
            className="absolute top-2 left-2 flex-row items-center rounded-full px-2 py-1"
            style={{ backgroundColor: '#d97706' }}
          >
            <Tag size={10} color="#ffffff" />
            <Text className="font-[Karla_600SemiBold] text-[10px] text-white ml-0.5">
              {badgeText}
            </Text>
          </View>
        )}
        <View className="absolute top-2 right-2">
          <HeartToggle restaurantId={restaurant.id} onImage />
        </View>
      </View>

      {/* Restaurant name */}
      <Text
        className="font-[Karla_700Bold] text-sm text-gray-900 mt-2"
        numberOfLines={1}
      >
        {restaurant.name}
      </Text>

      {/* Cuisine tag (grid shows only cuisine, carousel shows cuisine + price range) */}
      <View className="flex-row items-center mt-0.5">
        {restaurant.cuisine_type && (
          <Text className="font-[Karla_400Regular] text-xs text-gray-500">
            {restaurant.cuisine_type}
          </Text>
        )}
        {!isGrid && restaurant.cuisine_type && restaurant.price_range && (
          <Text className="font-[Karla_400Regular] text-xs text-gray-400 mx-1">
            ·
          </Text>
        )}
        {!isGrid && restaurant.price_range && (
          <Text className="font-[Karla_400Regular] text-xs text-gray-500">
            {restaurant.price_range}
          </Text>
        )}
      </View>

      {/* Rating + delivery time */}
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
          <View className="flex-row items-center">
            <Clock size={12} color="#6b7280" />
            <Text className="font-[Karla_400Regular] text-xs text-gray-500 ml-0.5">
              {restaurant.delivery_time_min} min
            </Text>
          </View>
        )}
      </View>

      {/* Dietary badges (carousel only — grid omits for compactness) */}
      {!isGrid && dietaryBadges.length > 0 && (
        <View className="flex-row flex-wrap mt-1.5 gap-1">
          {dietaryBadges.map((badge) => (
            <View key={badge} className="bg-green-50 px-1.5 py-0.5 rounded">
              <Text className="font-[Karla_500Medium] text-[10px] text-green-700">
                {badge}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
