import { forwardRef, useEffect } from 'react';
import { Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Swipeable } from 'react-native-gesture-handler';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useCartStore, type CartItem } from '@/stores/cart-store';

type CartBottomSheetProps = {
  onCheckout: () => void;
};

const CART_SHEET_SNAP_POINTS = ['60%', '90%'];

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

export const CartBottomSheet = forwardRef<BottomSheetModal, CartBottomSheetProps>(
  function CartBottomSheet({ onCheckout }, ref) {
    const insets = useSafeAreaInsets();
    const items = useCartStore((s) => s.items);
    const getTotal = useCartStore((s) => s.getTotal);
    const getItemCount = useCartStore((s) => s.getItemCount);

    const total = getTotal();
    const itemCount = getItemCount();

    // Auto-dismiss when cart becomes empty
    useEffect(() => {
      if (items.length === 0 && ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }, [items.length, ref]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={CART_SHEET_SNAP_POINTS}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
      >
        {/* Header */}
        <View className="px-4 pb-3 border-b border-gray-100">
          <Text className="font-[Karla_700Bold] text-lg text-gray-900 text-center">
            Your Cart
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-gray-500 text-center mt-0.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* Item list */}
        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="font-[Karla_400Regular] text-base text-gray-400">
              Your cart is empty
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CartItemRow item={item} />}
            contentContainerStyle={{ paddingBottom: 160 }}
          />
        )}

        {/* Footer: subtotal, delivery, total, checkout */}
        {items.length > 0 && (
          <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="flex-row justify-between mb-1">
              <Text className="font-[Karla_400Regular] text-sm text-gray-600">
                Subtotal
              </Text>
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                {total} DA
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="font-[Karla_400Regular] text-sm text-gray-600">
                Delivery fee
              </Text>
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                0 DA
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="font-[Karla_700Bold] text-base text-gray-900">
                Total
              </Text>
              <Text className="font-[Karla_700Bold] text-base text-gray-900">
                {total} DA
              </Text>
            </View>

            <Pressable
              onPress={onCheckout}
              accessibilityRole="button"
              accessibilityLabel={`Proceed to checkout, total ${total} DA`}
              className="bg-red-600 rounded-full py-3"
            >
              <Text className="font-[Karla_700Bold] text-base text-white text-center">
                Proceed to Checkout
              </Text>
            </Pressable>
          </View>
        )}
      </BottomSheetModal>
    );
  },
);

// ── Individual cart item row with swipe-to-delete ────────────────────────────

function CartItemRow({ item }: { item: CartItem }) {
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  function renderRightActions() {
    return (
      <View className="bg-red-500 justify-center items-center px-6">
        <Trash2 size={20} color="#ffffff" />
        <Text className="font-[Karla_600SemiBold] text-xs text-white mt-1">
          Delete
        </Text>
      </View>
    );
  }

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => removeItem(item.id)}
    >
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-50">
        {/* Item name and per-item total */}
        <View className="flex-1 mr-3">
          <Text className="font-[Karla_600SemiBold] text-base text-gray-900">
            {item.name}
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-0.5">
            {item.price * item.quantity} DA
          </Text>
        </View>

        {/* Quantity controls */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity of ${item.name}`}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
          >
            <Minus size={16} color="#374151" />
          </Pressable>

          <Text className="font-[Karla_700Bold] text-sm text-gray-900 min-w-[20px] text-center">
            {item.quantity}
          </Text>

          <Pressable
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity of ${item.name}`}
            className="w-8 h-8 rounded-full bg-red-600 items-center justify-center"
          >
            <Plus size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </Swipeable>
  );
}
