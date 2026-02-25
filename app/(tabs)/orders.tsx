import { FlatList, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOrderHistory } from '@/hooks/use-order-history';
import { useCartStore } from '@/stores/cart-store';
import { handleReorder } from '@/lib/reorder';
import { OrderHistoryCard } from '@/components/order/order-history-card';
import { OrderHistorySkeleton } from '@/components/order/order-history-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { type OrderWithRestaurant } from '@/lib/api/orders';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isLoading, error, refetch } = useOrderHistory();
  const startReorder = useCartStore((s) => s.startReorder);
  const confirmConflict = useCartStore((s) => s.confirmConflict);
  const cancelConflict = useCartStore((s) => s.cancelConflict);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  function handlePress(order: OrderWithRestaurant) {
    router.push(`/order/${order.id}`);
  }

  async function onReorder(order: OrderWithRestaurant) {
    await handleReorder(order, {
      startReorder,
      confirmConflict,
      cancelConflict,
      navigate: (path) => router.navigate(path as never),
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <Text className="font-[Karla_700Bold] text-lg text-gray-900 px-4 py-3">
        My Orders
      </Text>

      {isLoading ? (
        <OrderHistorySkeleton />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : orders.length === 0 ? (
        <EmptyState
          type="order_history"
          onCta={() => router.navigate('/(tabs)/')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: OrderWithRestaurant) => item.id}
          renderItem={({ item }: { item: OrderWithRestaurant }) => (
            <OrderHistoryCard
              order={item}
              onPress={handlePress}
              onReorder={onReorder}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#DC2626"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
