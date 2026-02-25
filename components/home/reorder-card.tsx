import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { RotateCcw } from 'lucide-react-native';
import { type OrderWithRestaurant, type OrderItem } from '@/lib/api/orders';

interface ReorderCardProps {
  order: OrderWithRestaurant;
  onReorder: (order: OrderWithRestaurant) => void;
}

/**
 * A card shown in the "Order Again" horizontal list on the home screen.
 * Displays restaurant image, name, items summary, total, and a Reorder button.
 */
export function ReorderCard({ order, onReorder }: ReorderCardProps) {
  const items = order.items as unknown as OrderItem[];
  const summary = formatItemsSummary(items);

  return (
    <View className="mr-3 bg-white rounded-xl overflow-hidden border border-gray-100" style={{ width: 208 }}>
      {/* Restaurant cover image */}
      <Image
        source={order.restaurants.cover_image_url ?? undefined}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        contentFit="cover"
        className="w-full h-24 bg-gray-200"
        accessibilityLabel={`${order.restaurants.name} cover photo`}
      />

      {/* Card body */}
      <View className="p-3">
        {/* Restaurant name */}
        <Text
          className="font-[Karla_700Bold] text-sm text-gray-900"
          numberOfLines={1}
        >
          {order.restaurants.name}
        </Text>

        {/* Items summary */}
        <Text
          className="font-[Karla_400Regular] text-xs text-gray-500 mt-0.5"
          numberOfLines={2}
        >
          {summary}
        </Text>

        {/* Total */}
        <Text className="font-[Karla_600SemiBold] text-sm text-gray-900 mt-1">
          {order.total} DA
        </Text>

        {/* Reorder button */}
        <Pressable
          onPress={() => onReorder(order)}
          accessibilityRole="button"
          accessibilityLabel={`Reorder from ${order.restaurants.name}`}
          className="flex-row items-center justify-center bg-red-600 rounded-full py-2 mt-2"
        >
          <RotateCcw size={14} color="#ffffff" />
          <Text className="font-[Karla_700Bold] text-xs text-white ml-1.5">
            Reorder
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Builds a short text summary of order items, e.g. "Shawarma x2, Fries x1".
 * Truncates to 3 items max with "..." suffix.
 */
function formatItemsSummary(items: OrderItem[]): string {
  const parts = items.slice(0, 3).map((item) => `${item.name} x${item.quantity}`);
  if (items.length > 3) parts.push('...');
  return parts.join(', ');
}
