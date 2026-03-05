import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import {
  flashDealSchema,
  type FlashDealFormData,
} from '@/lib/schemas/flash-deal';
import { createFlashDeal } from '@/lib/api/owner-promotions';

// ── Types ────────────────────────────────────────────────

type MenuItem = {
  id: string;
  name: string;
};

type FlashDealFormSheetProps = {
  restaurantId: string;
  menuItems: MenuItem[];
  nonce: number;
  onSaved: () => void;
};

// ── Helpers ──────────────────────────────────────────────

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

export const FlashDealFormSheet = forwardRef<BottomSheetModal, FlashDealFormSheetProps>(
  function FlashDealFormSheet({ restaurantId, menuItems, nonce, onSaved }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
      control,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors },
    } = useForm<FlashDealFormData>({
      resolver: zodResolver(flashDealSchema),
      defaultValues: {
        name: '',
        discount_type: 'percentage',
        discount_value: '',
        applicable_item_ids: [],
        duration_hours: '',
      },
    });

    const discountType = watch('discount_type');
    const selectedItems = watch('applicable_item_ids');

    // Reset form when sheet opens (nonce changes)
    useEffect(() => {
      reset({
        name: '',
        discount_type: 'percentage',
        discount_value: '',
        applicable_item_ids: [],
        duration_hours: '',
      });
      setServerError(null);
    }, [nonce, reset]);

    function toggleItem(itemId: string) {
      const current = selectedItems ?? [];
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      setValue('applicable_item_ids', next);
    }

    async function onSubmit(data: FlashDealFormData) {
      if (isSubmitting) return;

      setIsSubmitting(true);
      setServerError(null);

      try {
        await createFlashDeal({
          restaurant_id: restaurantId,
          name: data.name,
          discount_type: data.discount_type,
          discount_value: parseInt(data.discount_value, 10),
          applicable_item_ids: data.applicable_item_ids,
          duration_hours: parseInt(data.duration_hours, 10),
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        reset();

        if (ref && 'current' in ref && ref.current) {
          ref.current.dismiss();
        }

        onSaved();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to create flash deal';
        setServerError(message);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (__DEV__) console.warn('[flash-deal-form] submit failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    }

    function handleDismiss() {
      reset();
      setServerError(null);
    }

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        onDismiss={handleDismiss}
        backgroundStyle={{ backgroundColor: '#1c1917' }}
        handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}
      >
        <BottomSheetScrollView className="px-6 pt-2 pb-8">
          {/* Header */}
          <Text className="font-[Karla_700Bold] text-lg text-stone-100 text-center mb-4">
            Flash Deal
          </Text>

          {/* Server error */}
          {serverError && (
            <View className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 mb-4">
              <Text className="font-[Karla_400Regular] text-sm text-red-400">
                {serverError}
              </Text>
            </View>
          )}

          {/* Name */}
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-1">
            Deal name
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Lunch Rush Deal"
                placeholderTextColor="#78716c"
                maxLength={100}
                className="bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 mb-1"
              />
            )}
          />
          {errors.name && (
            <Text className="font-[Karla_400Regular] text-sm text-red-400 mb-3">
              {errors.name.message}
            </Text>
          )}

          {/* Discount type */}
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-2 mt-2">
            Discount type
          </Text>
          <View className="flex-row gap-2 mb-1">
            {(['percentage', 'fixed'] as const).map((type) => {
              const selected = discountType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setValue('discount_type', type)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="flex-1 rounded-full py-2.5 items-center"
                  style={{
                    backgroundColor: selected ? '#ca8a04' : '#292524',
                    borderWidth: 1,
                    borderColor: selected ? '#ca8a04' : '#57534e',
                  }}
                >
                  <Text
                    className="font-[Karla_600SemiBold] text-sm"
                    style={{ color: selected ? '#1c1917' : '#a8a29e' }}
                  >
                    {type === 'percentage' ? 'Percentage %' : 'Fixed (DA)'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.discount_type && (
            <Text className="font-[Karla_400Regular] text-sm text-red-400 mb-2">
              {errors.discount_type.message}
            </Text>
          )}

          {/* Discount value */}
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-1 mt-2">
            Discount value {discountType === 'percentage' ? '(%)' : '(DA)'}
          </Text>
          <Controller
            control={control}
            name="discount_value"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                placeholderTextColor="#78716c"
                keyboardType="numeric"
                className="bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 mb-1"
              />
            )}
          />
          {errors.discount_value && (
            <Text className="font-[Karla_400Regular] text-sm text-red-400 mb-3">
              {errors.discount_value.message}
            </Text>
          )}

          {/* Applicable items */}
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-2 mt-2">
            Applicable items
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            className="mb-1"
          >
            {menuItems.map((item) => {
              const selected = (selectedItems ?? []).includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name} ${selected ? 'selected' : 'not selected'}`}
                  className="rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: selected ? '#dc2626' : '#292524',
                    borderWidth: 1,
                    borderColor: selected ? '#dc2626' : '#57534e',
                  }}
                >
                  <Text
                    className="font-[Karla_400Regular] text-xs"
                    style={{ color: selected ? '#ffffff' : '#a8a29e' }}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {errors.applicable_item_ids && (
            <Text className="font-[Karla_400Regular] text-sm text-red-400 mb-3">
              {errors.applicable_item_ids.message}
            </Text>
          )}

          {/* Duration */}
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-1 mt-2">
            Duration (hours)
          </Text>
          <Controller
            control={control}
            name="duration_hours"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. 6"
                placeholderTextColor="#78716c"
                keyboardType="numeric"
                className="bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 mb-1"
              />
            )}
          />
          {errors.duration_hours && (
            <Text className="font-[Karla_400Regular] text-sm text-red-400 mb-4">
              {errors.duration_hours.message}
            </Text>
          )}

          {/* Buttons */}
          <View className="flex-row gap-3 mt-4">
            <Pressable
              onPress={() => {
                if (ref && 'current' in ref && ref.current) {
                  ref.current.dismiss();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              className="flex-1 border border-stone-600 rounded-full py-3"
            >
              <Text className="font-[Karla_600SemiBold] text-base text-stone-300 text-center">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Create flash deal"
              accessibilityState={{ disabled: isSubmitting }}
              className="flex-1 rounded-full py-3"
              style={{ backgroundColor: '#d97706', opacity: isSubmitting ? 0.5 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-[Karla_700Bold] text-base text-white text-center">
                  Create Deal
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
