import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { UtensilsCrossed } from 'lucide-react-native';
import { type TrendingDish } from '@/lib/api/menu';

interface DishCardProps {
  dish: TrendingDish;
}

export function DishCard({ dish }: DishCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${dish.restaurant.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${dish.price} DA, from ${dish.restaurant.name}`}
      className="mr-3"
      style={{ width: 160 }}
    >
      {/* Dish image or placeholder */}
      {dish.image_url ? (
        <Image
          source={dish.image_url}
          contentFit="cover"
          className="w-full h-28 rounded-xl bg-gray-200"
          accessibilityLabel={`${dish.name} photo`}
        />
      ) : (
        <View className="w-full h-28 rounded-xl bg-gray-100 items-center justify-center">
          <UtensilsCrossed size={32} color="#d1d5db" />
        </View>
      )}

      {/* Dish name */}
      <Text
        className="font-[Karla_600SemiBold] text-sm text-gray-900 mt-1.5"
        numberOfLines={1}
      >
        {dish.name}
      </Text>

      {/* Price */}
      <Text className="font-[Karla_700Bold] text-sm text-red-600 mt-0.5">
        {dish.price} DA
      </Text>

      {/* Restaurant attribution */}
      <Text
        className="font-[Karla_400Regular] text-xs text-gray-500 mt-0.5"
        numberOfLines={1}
      >
        {dish.restaurant.name}
      </Text>
    </Pressable>
  );
}
