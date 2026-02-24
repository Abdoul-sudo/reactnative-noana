import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ShoppingCart } from 'lucide-react-native';
import { useCartStore } from '@/stores/cart-store';

type CartFloatingBarProps = {
  currentRestaurantId: string;
  onViewCart: () => void;
};

export function CartFloatingBar({ currentRestaurantId, onViewCart }: CartFloatingBarProps) {
  const insets = useSafeAreaInsets();

  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const total = getTotal();
  const itemCount = getItemCount();
  const isVisible = items.length > 0 && restaurantId === currentRestaurantId;

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(200)}
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: icon + item count */}
        <View className="flex-row items-center">
          <ShoppingCart size={20} color="#374151" />
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-700 ml-2">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* Right: total + View Cart button */}
        <View className="flex-row items-center">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mr-3">
            {total} DA
          </Text>
          <Pressable
            onPress={onViewCart}
            accessibilityRole="button"
            accessibilityLabel={`View cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}, ${total} DA`}
            className="bg-red-600 rounded-full px-5 py-2"
          >
            <Text className="font-[Karla_700Bold] text-sm text-white">
              View Cart
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
