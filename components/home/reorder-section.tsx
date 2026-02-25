import { FlatList, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecentOrders } from '@/hooks/use-recent-orders';
import { useCartStore } from '@/stores/cart-store';
import { handleReorder } from '@/lib/reorder';
import { ReorderCard } from './reorder-card';
import { type OrderWithRestaurant } from '@/lib/api/orders';

/**
 * "Order Again" section for the home screen.
 * Shows a horizontal FlatList of previous order cards.
 * Returns null when the user has no delivered orders (section hidden).
 */
export function ReorderSection() {
  const { orders, isLoading } = useRecentOrders();
  const startReorder = useCartStore((s) => s.startReorder);
  const confirmConflict = useCartStore((s) => s.confirmConflict);
  const cancelConflict = useCartStore((s) => s.cancelConflict);
  const router = useRouter();

  // Hide section entirely when no orders or still loading
  if (isLoading || orders.length === 0) return null;

  async function onReorder(order: OrderWithRestaurant) {
    await handleReorder(order, {
      startReorder,
      confirmConflict,
      cancelConflict,
      navigate: (path) => router.navigate(path as never),
    });
  }

  return (
    <View className="mt-4">
      <Text className="font-[Karla_700Bold] text-base text-gray-900 px-4 mb-2">
        Order Again
      </Text>
      <FlatList
        data={orders}
        keyExtractor={(item: OrderWithRestaurant) => item.id}
        renderItem={({ item }: { item: OrderWithRestaurant }) => (
          <ReorderCard order={item} onReorder={onReorder} />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}
