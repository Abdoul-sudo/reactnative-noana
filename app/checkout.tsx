import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, CreditCard, Plus } from 'lucide-react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useAddresses } from '@/hooks/use-addresses';
import { createOrder } from '@/lib/api/orders';
import { type Address } from '@/lib/api/addresses';
import { AddressSelector } from '@/components/address/address-selector';
import { AddressFormSheet } from '@/components/address/address-form-sheet';
import { buildOrderPayload } from '@/lib/checkout';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Stores
  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id ?? '';

  // Addresses
  const { addresses, isLoading: addressesLoading, refetch: refetchAddresses } = useAddresses(userId);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Pre-select default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress]);

  // Form state
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Bottom sheet refs
  const addressSelectorRef = useRef<BottomSheetModal>(null);
  const addressFormRef = useRef<BottomSheetModal>(null);

  const subtotal = getTotal();
  const deliveryFee = 0;
  const total = Number((subtotal + deliveryFee).toFixed(2));

  // Redirect back if cart is empty (e.g. navigated directly)
  if (items.length === 0) {
    return (
      <View className="flex-1 bg-red-50 items-center justify-center px-6">
        <Text className="font-[Karla_700Bold] text-lg text-gray-800 mb-2">Cart is empty</Text>
        <Text className="font-[Karla_400Regular] text-sm text-gray-500 text-center mb-6">
          Add items from a restaurant before checking out.
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="bg-red-600 rounded-full px-8 py-3"
        >
          <Text className="font-[Karla_700Bold] text-base text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      setOrderError('Please select a delivery address.');
      return;
    }

    setIsProcessing(true);
    setOrderError('');

    try {
      const payload = buildOrderPayload({
        userId,
        restaurantId: restaurantId!,
        items,
        selectedAddress,
        subtotal,
        deliveryFee,
        total,
        specialInstructions: specialInstructions.trim() || undefined,
      });

      // Simulate processing delay for realistic feel (1-2s)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const order = await createOrder(payload);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
      router.replace(`/order/${order.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to place order. Please try again.';
      setOrderError(message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View className="flex-1 bg-red-50">
      {/* Header */}
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
          Checkout
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Delivery Address ── */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-3">
            Delivery Address
          </Text>

          {addressesLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#DC2626" />
            </View>
          ) : selectedAddress ? (
            <View className="flex-row items-start">
              <MapPin size={18} color="#DC2626" />
              <View className="flex-1 ml-3">
                <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                  {selectedAddress.label}
                  {selectedAddress.is_default && (
                    <Text className="font-[Karla_400Regular] text-xs text-red-600"> (default)</Text>
                  )}
                </Text>
                <Text className="font-[Karla_400Regular] text-sm text-gray-600 mt-0.5">
                  {selectedAddress.address}, {selectedAddress.city}
                </Text>
              </View>
              <Pressable
                onPress={() => addressSelectorRef.current?.present()}
                accessibilityRole="button"
                accessibilityLabel="Change delivery address"
                className="bg-gray-100 rounded-lg px-3 py-1.5"
              >
                <Text className="font-[Karla_600SemiBold] text-xs text-gray-700">Change</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => addressFormRef.current?.present()}
              accessibilityRole="button"
              accessibilityLabel="Add delivery address"
              className="flex-row items-center justify-center py-3 bg-red-50 rounded-lg"
            >
              <Plus size={16} color="#DC2626" />
              <Text className="font-[Karla_600SemiBold] text-sm text-red-600 ml-2">
                Add delivery address
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Order Summary ── */}
        <View className="bg-white mx-4 mt-3 rounded-xl p-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-1">
            Order Summary
          </Text>
          {restaurantName && (
            <Text className="font-[Karla_400Regular] text-sm text-gray-500 mb-3">
              {restaurantName}
            </Text>
          )}

          {items.map((item) => (
            <View key={item.id} className="flex-row justify-between py-2">
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
                {subtotal} DA
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="font-[Karla_400Regular] text-sm text-gray-600">Delivery fee</Text>
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
                {deliveryFee} DA
              </Text>
            </View>
            <View className="border-t border-gray-200 pt-2 flex-row justify-between">
              <Text className="font-[Karla_700Bold] text-base text-gray-900">Total</Text>
              <Text className="font-[Karla_700Bold] text-base text-red-600">
                {total} DA
              </Text>
            </View>
          </View>
        </View>

        {/* ── Special Instructions ── */}
        <View className="bg-white mx-4 mt-3 rounded-xl p-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-2">
            Special Instructions
          </Text>
          <TextInput
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="No onions, extra sauce..."
            multiline
            numberOfLines={3}
            className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 bg-white"
            style={{ textAlignVertical: 'top', minHeight: 80 }}
            accessibilityLabel="Special instructions for your order"
          />
        </View>

        {/* ── Payment (Mock Stripe) ── */}
        <View className="bg-white mx-4 mt-3 rounded-xl p-4">
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-3">Payment</Text>
          <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center mb-3">
              <CreditCard size={20} color="#374151" />
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-700 ml-2">
                Test Card
              </Text>
            </View>
            <Text className="font-[Karla_400Regular] text-base text-gray-900 tracking-wider mb-2">
              4242 4242 4242 4242
            </Text>
            <View className="flex-row">
              <Text className="font-[Karla_400Regular] text-sm text-gray-600 mr-6">
                Exp: 12/34
              </Text>
              <Text className="font-[Karla_400Regular] text-sm text-gray-600">
                CVC: 567
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Footer: Place Order ── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        {orderError !== '' && (
          <View className="bg-red-100 rounded-lg p-3 mb-3">
            <Text className="font-[Karla_400Regular] text-red-600 text-sm text-center">
              {orderError}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handlePlaceOrder}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel={`Place order for ${total} DA`}
          accessibilityState={{ disabled: isProcessing }}
          className="bg-red-600 rounded-full py-3 disabled:opacity-50"
        >
          {isProcessing ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="font-[Karla_700Bold] text-base text-white ml-2">
                Processing...
              </Text>
            </View>
          ) : (
            <Text className="font-[Karla_700Bold] text-base text-white text-center">
              Place Order — {total} DA
            </Text>
          )}
        </Pressable>
      </View>

      {/* ── Address Selector Sheet ── */}
      <AddressSelector
        ref={addressSelectorRef}
        userId={userId}
        selectedAddressId={selectedAddress?.id}
        onSelect={(address) => {
          setSelectedAddress(address);
          addressSelectorRef.current?.dismiss();
        }}
        onAddNew={() => {
          addressSelectorRef.current?.dismiss();
          addressFormRef.current?.present();
        }}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      {/* ── Address Form Sheet ── */}
      <AddressFormSheet
        ref={addressFormRef}
        userId={userId}
        onSaved={() => {
          refetchAddresses();
        }}
      />
    </View>
  );
}
