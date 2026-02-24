import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Star, Clock } from 'lucide-react-native';
import { type Restaurant } from '@/lib/api/restaurants';

interface RestaurantCardProps {
  restaurant: Restaurant;
  /** 'carousel' = fixed 208px width (horizontal list). 'grid' = flex width (2-column grid). */
  layout?: 'carousel' | 'grid';
}

export function RestaurantCard({ restaurant, layout = 'carousel' }: RestaurantCardProps) {
  const router = useRouter();
  const isGrid = layout === 'grid';

  const dietaryBadges = Array.isArray(restaurant.dietary_options)
    ? (restaurant.dietary_options as string[])
    : [];

  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${restaurant.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, rated ${restaurant.rating ?? 'unrated'}`}
      className={isGrid ? 'flex-1' : 'mr-3'}
      style={isGrid ? undefined : { width: 208 }}
    >
      {/* Cover photo */}
      <Image
        source={restaurant.cover_image_url ?? undefined}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        contentFit="cover"
        className={isGrid ? 'w-full h-28 rounded-xl bg-gray-200' : 'w-full h-36 rounded-xl bg-gray-200'}
        accessibilityLabel={`${restaurant.name} cover photo`}
      />

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
