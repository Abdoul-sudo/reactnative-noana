import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AlertCircle, ChefHat } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useOwnerOrders } from '@/hooks/use-owner-orders';
import { ORDER_STATUS, STATUS_COLORS, type OrderStatus } from '@/constants/order-status';
import { type OwnerOrder } from '@/lib/api/owner-orders';
import { formatPrice, formatTimeSince } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { OrderDetailsSheet } from '@/components/owner/order-details-sheet';

// ── Status Tab Config ────────────────────────────────────

const STATUS_TABS: ReadonlyArray<{
  status: OrderStatus;
  label: string;
}> = [
  { status: ORDER_STATUS.PLACED, label: 'New' },
  { status: ORDER_STATUS.CONFIRMED, label: 'Confirmed' },
  { status: ORDER_STATUS.PREPARING, label: 'Preparing' },
  { status: ORDER_STATUS.ON_THE_WAY, label: 'Ready' },
  { status: ORDER_STATUS.DELIVERED, label: 'Completed' },
] as const;

// ── Items Summary Helper ─────────────────────────────────

function formatItemsSummary(order: OwnerOrder): string {
  const items = order.parsedItems;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const names = items.slice(0, 2).map((i) => i.name);
  const label = count === 1 ? 'item' : 'items';

  if (names.length === 0) return `${count} ${label}`;
  const joined = names.join(', ');
  return items.length > 2
    ? `${count} ${label}: ${joined}...`
    : `${count} ${label}: ${joined}`;
}

// ── Status Tab Bar ───────────────────────────────────────

function StatusTabBar({
  activeStatus,
  counts,
  onSelect,
}: {
  activeStatus: OrderStatus;
  counts: Record<string, number>;
  onSelect: (status: OrderStatus) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="mb-3"
    >
      {STATUS_TABS.map((tab) => {
        const isActive = tab.status === activeStatus;
        const count = counts[tab.status] ?? 0;

        return (
          <Pressable
            key={tab.status}
            onPress={() => onSelect(tab.status)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab, ${count} orders`}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: isActive ? STATUS_COLORS[tab.status] ?? '#a8a29e' : '#292524' }}
          >
            <Text
              className="font-[Karla_600SemiBold] text-xs"
              style={{ color: isActive ? '#1c1917' : '#a8a29e' }}
            >
              {tab.label}
            </Text>
            {count > 0 && (
              <View
                className="ml-1.5 rounded-full px-1.5 min-w-[18px] items-center"
                style={{ backgroundColor: isActive ? '#1c191740' : '#44403c' }}
              >
                <Text
                  className="font-[Karla_700Bold] text-[10px]"
                  style={{ color: isActive ? '#1c1917' : '#d6d3d1' }}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Order Card ───────────────────────────────────────────

function OrderCard({ order, onPress }: { order: OwnerOrder; onPress: () => void }) {
  const dotColor = STATUS_COLORS[order.status] ?? '#a8a29e';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View order ${order.id.slice(0, 8)}, ${formatItemsSummary(order)}, ${formatPrice(order.total)}`}
      className="bg-stone-800 rounded-xl p-4 mx-4"
    >
      {/* Top row: order # + time */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: dotColor }}
            accessible={false}
          />
          <Text className="font-[Karla_700Bold] text-sm text-stone-100">
            #{order.id.slice(0, 8)}
          </Text>
        </View>
        <Text className="font-[Karla_400Regular] text-xs text-stone-500">
          {order.placed_at ? formatTimeSince(order.placed_at) : ''}
        </Text>
      </View>

      {/* Items summary */}
      <Text
        className="font-[Karla_400Regular] text-xs text-stone-400 mb-2"
        numberOfLines={1}
      >
        {formatItemsSummary(order)}
      </Text>

      {/* Total */}
      <Text className="font-[Karla_600SemiBold] text-sm text-stone-200">
        {formatPrice(order.total)}
      </Text>
    </Pressable>
  );
}

// ── Skeleton ─────────────────────────────────────────────

function OrdersSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Skeleton className="h-7 w-20 rounded bg-stone-800" />
      </View>
      {/* Tab bar skeleton */}
      <View className="flex-row px-4 mb-3 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full bg-stone-800" />
        ))}
      </View>
      {/* Order card skeletons */}
      <View className="px-4 gap-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-stone-800 rounded-xl p-4">
            <Skeleton className="h-4 w-24 rounded bg-stone-700 mb-3" />
            <Skeleton className="h-3 w-48 rounded bg-stone-700 mb-2" />
            <Skeleton className="h-4 w-16 rounded bg-stone-700" />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Error State ──────────────────────────────────────────

function OrdersErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <AlertCircle size={48} color="#f87171" />
      <Text className="font-[Karla_700Bold] text-lg text-stone-200 mt-4 text-center">
        Something went wrong
      </Text>
      <Text className="font-[Karla_400Regular] text-sm text-stone-400 mt-2 text-center leading-5">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        className="mt-6 px-6 py-3 border border-stone-600 rounded-full"
      >
        <Text className="font-[Karla_600SemiBold] text-sm text-stone-300">Try again</Text>
      </Pressable>
    </View>
  );
}

// ── Separator ────────────────────────────────────────────

function CardSeparator() {
  return <View className="h-3" />;
}

// ── Main Screen ──────────────────────────────────────────

export default function OwnerOrdersScreen() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  const {
    orders,
    counts,
    isLoading,
    error,
    isEmpty,
    refetch,
    activeStatus,
    setActiveStatus,
    newOrderIds,
  } = useOwnerOrders(userId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  function handleOpenDetail(order: OwnerOrder) {
    setSelectedOrderId(order.id);
    sheetRef.current?.present();
  }

  function handleStatusUpdated() {
    refetch();
  }

  // Refetch on tab focus (skip first mount)
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // ── State branching ──
  if (isLoading) return <OrdersSkeleton />;

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <OrdersErrorState message={error.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (isEmpty) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <ChefHat size={48} color="#57534e" />
          <Text className="font-[Karla_700Bold] text-lg text-stone-300 mt-4 text-center">
            No restaurant found
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-stone-500 mt-2 text-center">
            You need a restaurant to manage orders.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text
          accessibilityRole="header"
          className="font-[Karla_700Bold] text-xl text-stone-100"
        >
          Orders
        </Text>
      </View>

      {/* Status Tabs */}
      <StatusTabBar
        activeStatus={activeStatus}
        counts={counts}
        onSelect={setActiveStatus}
      />

      {/* Order List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isNew = newOrderIds.has(item.id);
          const card = <OrderCard order={item} onPress={() => handleOpenDetail(item)} />;

          if (isNew) {
            return (
              <Animated.View entering={FadeIn.duration(400)}>
                {card}
              </Animated.View>
            );
          }

          return card;
        }}
        ItemSeparatorComponent={CardSeparator}
        ListEmptyComponent={<EmptyState type="owner_orders" />}
        contentContainerStyle={orders.length === 0 ? { flexGrow: 1 } : { paddingTop: 4, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#dc2626"
          />
        }
      />

      {/* Order Details Bottom Sheet */}
      <OrderDetailsSheet
        ref={sheetRef}
        orderId={selectedOrderId}
        onStatusUpdated={handleStatusUpdated}
      />
    </SafeAreaView>
  );
}
