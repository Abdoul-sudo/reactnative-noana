import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  deliverySettingsSchema,
  type DeliverySettingsFormData,
} from '@/lib/schemas/restaurant-settings';
import {
  updateDeliverySettings,
  type RestaurantSettings,
} from '@/lib/api/owner-settings';
import { centimesToPrice, priceToCentimes } from '@/lib/schemas/menu-item';

type DeliverySettingsFormSheetProps = {
  restaurantId: string;
  restaurant: RestaurantSettings;
  onSaved: () => void;
};

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

export const DeliverySettingsFormSheet = forwardRef<BottomSheetModal, DeliverySettingsFormSheetProps>(
  function DeliverySettingsFormSheet({ restaurantId, restaurant, onSaved }, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<DeliverySettingsFormData>({
      resolver: zodResolver(deliverySettingsSchema),
      defaultValues: {
        deliveryRadiusKm: '',
        deliveryFee: '',
        minimumOrder: '',
      },
    });

    useEffect(() => {
      reset({
        deliveryRadiusKm: restaurant.deliveryRadiusKm?.toString() ?? '5',
        deliveryFee: restaurant.deliveryFee != null ? centimesToPrice(restaurant.deliveryFee) : '0',
        minimumOrder: restaurant.minimumOrder != null ? centimesToPrice(restaurant.minimumOrder) : '0',
      });
      setSaveError('');
    }, [restaurant, reset]);

    function dismiss() {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    async function onSubmit(data: DeliverySettingsFormData) {
      setIsLoading(true);
      setSaveError('');

      try {
        await updateDeliverySettings(restaurantId, {
          deliveryRadiusKm: parseFloat(data.deliveryRadiusKm),
          deliveryFee: priceToCentimes(data.deliveryFee),
          minimumOrder: priceToCentimes(data.minimumOrder),
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        onSaved();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Failed to save');
        if (__DEV__) console.warn('[delivery-settings-form] save failed:', e);
      } finally {
        setIsLoading(false);
      }
    }

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#1c1917' }}
        handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}
      >
        <BottomSheetView className="px-6 pt-2 pb-8">
          <Text
            accessibilityRole="header"
            className="font-[Karla_700Bold] text-lg text-stone-100 mb-4"
          >
            Delivery Settings
          </Text>

          {saveError ? (
            <View className="bg-red-900/30 rounded-lg p-3 mb-4">
              <Text className="font-[Karla_400Regular] text-sm text-red-300">{saveError}</Text>
            </View>
          ) : null}

          {/* Delivery Radius */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-300 mb-1">
            Delivery Radius (km)
          </Text>
          <Controller
            control={control}
            name="deliveryRadiusKm"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="5.0"
                placeholderTextColor="#78716c"
                keyboardType="decimal-pad"
                accessibilityLabel="Delivery radius in kilometers"
                className="bg-stone-800 rounded-lg px-4 py-3 text-stone-100 font-[Karla_400Regular] mb-1"
              />
            )}
          />
          {errors.deliveryRadiusKm && (
            <Text className="font-[Karla_400Regular] text-xs text-red-400 mb-3">
              {errors.deliveryRadiusKm.message}
            </Text>
          )}

          {/* Delivery Fee */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-300 mb-1 mt-3">
            Delivery Fee (CFA)
          </Text>
          <Controller
            control={control}
            name="deliveryFee"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="0"
                placeholderTextColor="#78716c"
                keyboardType="decimal-pad"
                accessibilityLabel="Delivery fee"
                className="bg-stone-800 rounded-lg px-4 py-3 text-stone-100 font-[Karla_400Regular] mb-1"
              />
            )}
          />
          {errors.deliveryFee && (
            <Text className="font-[Karla_400Regular] text-xs text-red-400 mb-3">
              {errors.deliveryFee.message}
            </Text>
          )}

          {/* Minimum Order */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-300 mb-1 mt-3">
            Minimum Order (CFA)
          </Text>
          <Controller
            control={control}
            name="minimumOrder"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="0"
                placeholderTextColor="#78716c"
                keyboardType="decimal-pad"
                accessibilityLabel="Minimum order amount"
                className="bg-stone-800 rounded-lg px-4 py-3 text-stone-100 font-[Karla_400Regular] mb-1"
              />
            )}
          />
          {errors.minimumOrder && (
            <Text className="font-[Karla_400Regular] text-xs text-red-400 mb-3">
              {errors.minimumOrder.message}
            </Text>
          )}

          {/* Actions */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Save delivery settings"
            className="bg-red-600 rounded-full py-3 mt-5 items-center disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-[Karla_600SemiBold] text-sm text-white">Save</Text>
            )}
          </Pressable>
          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="py-3 mt-2 items-center"
          >
            <Text className="font-[Karla_500Medium] text-sm text-stone-400">Cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
