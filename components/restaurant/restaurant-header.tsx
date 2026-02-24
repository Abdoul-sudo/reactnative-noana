import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Star, Clock } from 'lucide-react-native';
import { type Restaurant } from '@/lib/api/restaurants';

type RestaurantHeaderProps = {
  restaurant: Restaurant;
};

/**
 * Cover photo + restaurant info block for the detail screen.
 * Used as ListHeaderComponent in the SectionList.
 *
 * Shows: cover image, name (Playfair Display SC), cuisine, dietary badges,
 * rating, delivery time, price range.
 */
export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  const dietaryBadges = Array.isArray(restaurant.dietary_options)
    ? (restaurant.dietary_options as string[])
    : [];

  return (
    <View>
      {/* ── Cover image ─────────────────────────────────── */}
      <Image
        source={restaurant.cover_image_url}
        style={{ width: '100%', height: 200 }}
        contentFit="cover"
        accessibilityLabel={`${restaurant.name} cover photo`}
      />

      {/* ── Restaurant info ──────────────────────────────── */}
      <View className="px-4 pt-4 pb-2">
        {/* Name */}
        <Text
          accessibilityRole="header"
          className="font-[PlayfairDisplaySC_700Bold] text-xl text-gray-900"
          numberOfLines={2}
        >
          {restaurant.name}
        </Text>

        {/* Cuisine + price range */}
        <View className="flex-row items-center mt-1.5">
          {restaurant.cuisine_type && (
            <Text className="font-[Karla_400Regular] text-sm text-gray-500">
              {restaurant.cuisine_type}
            </Text>
          )}
          {restaurant.cuisine_type && restaurant.price_range && (
            <Text className="font-[Karla_400Regular] text-sm text-gray-400 mx-1.5">
              ·
            </Text>
          )}
          {restaurant.price_range && (
            <Text className="font-[Karla_600SemiBold] text-sm text-gray-600">
              {restaurant.price_range}
            </Text>
          )}
        </View>

        {/* Rating + delivery time */}
        <View className="flex-row items-center mt-2">
          {restaurant.rating != null && (
            <View className="flex-row items-center mr-4">
              <Star size={16} color="#ca8a04" fill="#ca8a04" />
              <Text className="font-[Karla_600SemiBold] text-sm text-yellow-600 ml-1">
                {restaurant.rating.toFixed(1)}
              </Text>
            </View>
          )}
          {restaurant.delivery_time_min != null && (
            <View className="flex-row items-center">
              <Clock size={14} color="#6b7280" />
              <Text className="font-[Karla_400Regular] text-sm text-gray-500 ml-1">
                {restaurant.delivery_time_min} min
              </Text>
            </View>
          )}
        </View>

        {/* Dietary badges */}
        {dietaryBadges.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-2.5">
            {dietaryBadges.map((tag) => (
              <View key={tag} className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200">
                <Text className="font-[Karla_500Medium] text-xs text-green-700">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
