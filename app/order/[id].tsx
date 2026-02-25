import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, MapPin, Clock } from 'lucide-react-native';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { useOrderTracking } from '@/hooks/use-order-tracking';
import { OrderStatusStepper } from '@/components/order/order-status-stepper';
import { ReviewFormSheet } from '@/components/review/review-form-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { ORDER_STATUS } from '@/constants/order-status';
import { hasUserReviewedRestaurant } from '@/lib/api/reviews';
import { type OrderItem, type DeliveryAddress } from '@/lib/api/orders';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { order, isLoading, error, refetch } = useOrderTracking(id!);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const reviewSheetRef = useRef<BottomSheetModal>(null);

  // Check if the user already reviewed this restaurant (prevents duplicate reviews on revisit)
  useEffect(() => {
    if (!order || order.status !== ORDER_STATUS.DELIVERED) return;

    hasUserReviewedRestaurant(order.user_id, order.restaurant_id).then(
      (reviewed) => {
        if (reviewed) setHasReviewed(true);
      },
    );
  }, [order?.id, order?.status]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // Parse jsonb fields from the order
  const items: OrderItem[] = order ? (order.items as unknown as OrderItem[]) : [];
  const deliveryAddress: DeliveryAddress | null = order
    ? (order.delivery_address as unknown as DeliveryAddress)
    : null;

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 bg-red-50">
        <View
          className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100"
          style={{ paddingTop: Math.max(insets.top, 16) }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
          <Skeleton className="h-5 w-32 rounded ml-4" />
        </View>
        <ScrollView className="flex-1 px-4 pt-4">
          {/* Stepper skeleton */}
          <View className="bg-white rounded-xl p-4 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} className="flex-row items-center mb-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24 rounded ml-4" />
              </View>
            ))}
          </View>
          {/* ETA skeleton */}
          <View className="bg-white rounded-xl p-4 mb-3">
            <Skeleton className="h-4 w-40 rounded mb-2" />
            <Skeleton className="h-5 w-56 rounded" />
          </View>
          {/* Order summary skeleton */}
          <View className="bg-white rounded-xl p-4 mb-3">
            <Skeleton className="h-4 w-32 rounded mb-3" />
            <Skeleton className="h-3 w-full rounded mb-2" />
            <Skeleton className="h-3 w-full rounded mb-2" />
            <Skeleton className="h-4 w-24 rounded mt-2" />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <View className="flex-1 bg-red-50">
        <View
          className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100"
          style={{ paddingTop: Math.max(insets.top, 16) }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
        </View>
        <ErrorState
          message={error?.message ?? 'Order not found'}
          onRetry={refetch}
        />
      </View>
    );
  }

  const shortId = order.id.slice(0, 8);
  const restaurant = order.restaurants;

  return (
    <View className="flex-1 bg-red-50">
      {/* ── Header ── */}
      <View
        className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
        >
          <ArrowLeft size={20} color="#374151" />
        </Pressable>
        <Text className="flex-1 font-[Karla_700Bold] text-lg text-gray-900 text-center mr-10">
          Order #{shortId}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#DC2626"
          />
        }
      >
        {/* ── Status Stepper ── */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-4">
            Order Status
          </Text>
          <OrderStatusStepper order={order} />
        </View>

        {/* ── ETA Display ── */}
        <View className="bg-white mx-4 mt-3 rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <Clock size={18} color="#DC2626" />
            <Text className="font-[Karla_700Bold] text-base text-gray-900 ml-2">
              Estimated Delivery
            </Text>
          </View>
          {order.estimated_delivery_at ? (
            <Text className="font-[Karla_600SemiBold] text-sm text-gray-800">
              {formatEta(order.estimated_delivery_at)}
            </Text>
          ) : (
            <Text className="font-[Karla_400Regular] text-sm text-gray-400">
              Estimating delivery time...
            </Text>
          )}
        </View>

        {/* ── Order Summary ── */}
        <View className="bg-white mx-4 mt-3 rounded-xl p-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-3">
            Order Summary
          </Text>

          {items.map((item) => (
            <View key={item.menu_item_id} className="flex-row justify-between py-1.5">
              <Text className="font-[Karla_400Regular] text-sm text-gray-800 flex-1">
                {item.name} x{item.quantity}
              </Text>
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                {Number((item.price * item.quantity).toFixed(2))} DA
              </Text>
            </View>
          ))}

          <View className="border-t border-gray-100 mt-2 pt-2">
            <View className="flex-row justify-between mb-1">
              <Text className="font-[Karla_400Regular] text-sm text-gray-600">Subtotal</Text>
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                {order.subtotal} DA
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="font-[Karla_400Regular] text-sm text-gray-600">Delivery fee</Text>
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                {order.delivery_fee} DA
              </Text>
            </View>
            <View className="border-t border-gray-200 pt-2 flex-row justify-between">
              <Text className="font-[Karla_700Bold] text-base text-gray-900">Total</Text>
              <Text className="font-[Karla_700Bold] text-base text-red-600">
                {order.total} DA
              </Text>
            </View>
          </View>
        </View>

        {/* ── Delivery Address ── */}
        {deliveryAddress && (
          <View className="bg-white mx-4 mt-3 rounded-xl p-4">
            <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-2">
              Delivery To
            </Text>
            <View className="flex-row items-start">
              <MapPin size={18} color="#DC2626" />
              <View className="flex-1 ml-2">
                <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                  {deliveryAddress.label}
                </Text>
                <Text className="font-[Karla_400Regular] text-sm text-gray-600 mt-0.5">
                  {deliveryAddress.address}, {deliveryAddress.city}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Restaurant Contact ── */}
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 mb-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-2">
            Restaurant
          </Text>
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-800">
            {restaurant.name}
          </Text>
          {restaurant.address && (
            <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-0.5">
              {restaurant.address}
            </Text>
          )}
          {restaurant.phone && (
            <Pressable
              onPress={() => handleCall(restaurant.phone!)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${restaurant.name}`}
              className="flex-row items-center bg-red-50 rounded-lg px-4 py-3 mt-3"
            >
              <Phone size={18} color="#DC2626" />
              <Text className="font-[Karla_600SemiBold] text-sm text-red-600 ml-2">
                {restaurant.phone}
              </Text>
              <Text className="font-[Karla_400Regular] text-xs text-red-400 ml-auto">
                Tap to call
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Leave a Review (only when delivered) ── */}
        {order.status === ORDER_STATUS.DELIVERED && !hasReviewed && (
          <Pressable
            onPress={() => reviewSheetRef.current?.present()}
            accessibilityRole="button"
            accessibilityLabel="Leave a review for this restaurant"
            className="mx-4 mb-4 bg-red-600 rounded-full py-3"
          >
            <Text className="font-[Karla_700Bold] text-base text-white text-center">
              Leave a Review
            </Text>
          </Pressable>
        )}

        {hasReviewed && (
          <View className="mx-4 mb-4 bg-green-50 border border-green-200 rounded-xl py-3 px-4">
            <Text className="font-[Karla_600SemiBold] text-sm text-green-700 text-center">
              Thank you for your review!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Review bottom sheet — rendered outside ScrollView */}
      <ReviewFormSheet
        ref={reviewSheetRef}
        restaurantId={order.restaurant_id}
        onSuccess={() => setHasReviewed(true)}
      />
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEta(iso: string): string {
  const eta = new Date(iso);
  const now = Date.now();
  const diffMs = eta.getTime() - now;
  const diffMin = Math.round(diffMs / 60_000);

  const timeStr = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffMin <= 0) {
    return 'Arriving now';
  }
  if (diffMin < 5) {
    return `Arriving soon (~${timeStr})`;
  }
  return `~${timeStr} (${diffMin} min remaining)`;
}
