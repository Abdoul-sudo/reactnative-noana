import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import {
  fetchOrderDetail,
  updateOrderStatus,
  getNextStatus,
  getStatusActionLabel,
  type OrderDetail,
} from '@/lib/api/owner-orders';
import { STATUS_COLORS } from '@/constants/order-status';
import { formatPrice, formatTimeSince } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────

type OrderDetailsSheetProps = {
  orderId: string | null;
  onStatusUpdated: () => void;
};

// ── Backdrop ─────────────────────────────────────────────

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
    />
  );
}

// ── Component ────────────────────────────────────────────

export const OrderDetailsSheet = forwardRef<BottomSheetModal, OrderDetailsSheetProps>(
  function OrderDetailsSheet({ orderId, onStatusUpdated }, ref) {
    const [detail, setDetail] = useState<OrderDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Fetch order detail when orderId changes
    useEffect(() => {
      if (!orderId) {
        setDetail(null);
        return;
      }

      const id = orderId;
      let cancelled = false;

      async function load() {
        setIsLoadingDetail(true);
        setError('');

        try {
          const data = await fetchOrderDetail(id);
          if (!cancelled) setDetail(data);
        } catch (e) {
          if (!cancelled) {
            setError('Failed to load order details');
            if (__DEV__) console.warn('[order-details-sheet] load failed:', e);
          }
        } finally {
          if (!cancelled) setIsLoadingDetail(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [orderId]);

    async function handleStatusUpdate() {
      if (!detail || isSaving) return;

      const nextStatus = getNextStatus(detail.status);
      if (!nextStatus) return;

      setIsSaving(true);
      setError('');

      try {
        await updateOrderStatus(detail.id, nextStatus);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Close sheet and trigger parent refetch
        if (ref && 'current' in ref) {
          ref.current?.dismiss();
        }
        onStatusUpdated();
      } catch (e) {
        setError('Failed to update status');
        if (__DEV__) console.warn('[order-details-sheet] update failed:', e);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSaving(false);
      }
    }

    const nextStatus = detail ? getNextStatus(detail.status) : null;
    const nextColor = nextStatus ? STATUS_COLORS[nextStatus] ?? '#dc2626' : '#dc2626';

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#1c1917' }}
        handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}
      >
        <BottomSheetScrollView className="px-6 pt-2 pb-8">
          {isLoadingDetail ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#dc2626" />
            </View>
          ) : error && !detail ? (
            <View className="items-center py-12">
              <Text className="font-[Karla_400Regular] text-sm text-red-400">{error}</Text>
            </View>
          ) : detail ? (
            <View>
              {/* Header: Order # + time */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View
                    className="w-2.5 h-2.5 rounded-full mr-2"
                    style={{ backgroundColor: STATUS_COLORS[detail.status] ?? '#a8a29e' }}
                    accessible={false}
                  />
                  <Text className="font-[Karla_700Bold] text-lg text-stone-100">
                    #{detail.id.slice(0, 8)}
                  </Text>
                </View>
                <Text className="font-[Karla_400Regular] text-xs text-stone-500">
                  {detail.placed_at ? formatTimeSince(detail.placed_at) : ''}
                </Text>
              </View>

              {/* Customer */}
              <Text className="font-[Karla_600SemiBold] text-xs text-stone-500 uppercase tracking-wide mb-1">
                Customer
              </Text>
              <Text
                className="font-[Karla_400Regular] text-sm text-stone-200 mb-4"
                accessibilityLabel={`Customer: ${detail.customerName}`}
              >
                {detail.customerName}
              </Text>

              {/* Items */}
              <Text className="font-[Karla_600SemiBold] text-xs text-stone-500 uppercase tracking-wide mb-2">
                Items
              </Text>
              {detail.parsedItems.map((item, idx) => (
                <View
                  key={`${item.menu_item_id}-${idx}`}
                  className="flex-row items-center justify-between mb-1.5"
                >
                  <Text className="font-[Karla_400Regular] text-sm text-stone-200 flex-1">
                    {item.quantity}x  {item.name}
                  </Text>
                  <Text className="font-[Karla_400Regular] text-sm text-stone-400 ml-4">
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))}

              {/* Divider */}
              <View className="h-px bg-stone-700 my-4" accessible={false} />

              {/* Delivery Address */}
              {detail.parsedAddress && (
                <>
                  <Text className="font-[Karla_600SemiBold] text-xs text-stone-500 uppercase tracking-wide mb-1">
                    Delivery Address
                  </Text>
                  <Text
                    className="font-[Karla_400Regular] text-sm text-stone-200 mb-4"
                    accessibilityLabel={`Delivery to ${detail.parsedAddress.label}, ${detail.parsedAddress.address}, ${detail.parsedAddress.city}`}
                  >
                    {detail.parsedAddress.label ? `${detail.parsedAddress.label} — ` : ''}
                    {detail.parsedAddress.address}
                    {detail.parsedAddress.city ? `, ${detail.parsedAddress.city}` : ''}
                  </Text>
                </>
              )}

              {/* Special Instructions */}
              {detail.special_instructions ? (
                <>
                  <Text className="font-[Karla_600SemiBold] text-xs text-stone-500 uppercase tracking-wide mb-1">
                    Special Instructions
                  </Text>
                  <Text className="font-[Karla_400Regular] text-sm text-stone-300 mb-4">
                    {detail.special_instructions}
                  </Text>
                </>
              ) : null}

              {/* Divider */}
              <View className="h-px bg-stone-700 my-2" accessible={false} />

              {/* Totals */}
              <View className="flex-row justify-between mb-1">
                <Text className="font-[Karla_400Regular] text-sm text-stone-400">Subtotal</Text>
                <Text className="font-[Karla_400Regular] text-sm text-stone-300">
                  {formatPrice(detail.subtotal)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="font-[Karla_400Regular] text-sm text-stone-400">Delivery fee</Text>
                <Text className="font-[Karla_400Regular] text-sm text-stone-300">
                  {formatPrice(detail.delivery_fee)}
                </Text>
              </View>
              <View className="flex-row justify-between mt-2 mb-6">
                <Text className="font-[Karla_600SemiBold] text-base text-stone-100">Total</Text>
                <Text className="font-[Karla_600SemiBold] text-base text-stone-100">
                  {formatPrice(detail.total)}
                </Text>
              </View>

              {/* Error message */}
              {error ? (
                <Text className="font-[Karla_400Regular] text-xs text-red-400 text-center mb-3">
                  {error}
                </Text>
              ) : null}

              {/* Status Action Button */}
              {nextStatus ? (
                <Pressable
                  onPress={handleStatusUpdate}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel={getStatusActionLabel(nextStatus)}
                  accessibilityState={{ disabled: isSaving }}
                  className="items-center rounded-xl py-3.5 mb-4"
                  style={{
                    backgroundColor: nextColor,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#1c1917" />
                  ) : (
                    <Text className="font-[Karla_700Bold] text-sm" style={{ color: '#1c1917' }}>
                      {getStatusActionLabel(nextStatus)}
                    </Text>
                  )}
                </Pressable>
              ) : (
                <View className="items-center rounded-xl py-3.5 mb-4 bg-stone-800">
                  <Text className="font-[Karla_600SemiBold] text-sm text-stone-500">
                    Order Complete
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
