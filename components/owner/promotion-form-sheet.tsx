import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
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
  promotionSchema,
  type PromotionFormData,
} from '@/lib/schemas/promotion';
import {
  createPromotion,
  updatePromotion,
  type Promotion,
} from '@/lib/api/owner-promotions';

// ── Types ────────────────────────────────────────────────

type MenuItem = {
  id: string;
  name: string;
};

type PromotionFormSheetProps = {
  restaurantId: string;
  menuItems: MenuItem[];
  editPromotion: Promotion | null;
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

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Component ────────────────────────────────────────────

export const PromotionFormSheet = forwardRef<BottomSheetModal, PromotionFormSheetProps>(
  function PromotionFormSheet({ restaurantId, menuItems, editPromotion, nonce, onSaved }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
      control,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors },
    } = useForm<PromotionFormData>({
      resolver: zodResolver(promotionSchema),
      defaultValues: {
        name: '',
        discount_type: 'percentage',
        discount_value: '',
        applicable_item_ids: [],
        start_date: todayString(),
        end_date: todayString(),
        push_enabled: false,
      },
    });

    const discountType = watch('discount_type');
    const selectedItems = watch('applicable_item_ids');

    // Pre-fill when editing (nonce forces re-run for same promotion)
    useEffect(() => {
      if (editPromotion) {
        reset({
          name: editPromotion.name,
          discount_type: editPromotion.discount_type,
          discount_value: String(editPromotion.discount_value),
          applicable_item_ids: editPromotion.applicable_item_ids,
          start_date: editPromotion.start_date,
          end_date: editPromotion.end_date,
          push_enabled: editPromotion.push_enabled,
        });
      } else {
        reset({
          name: '',
          discount_type: 'percentage',
          discount_value: '',
          applicable_item_ids: [],
          start_date: todayString(),
          end_date: todayString(),
          push_enabled: false,
        });
      }
      setServerError(null);
    }, [editPromotion, nonce, reset]);

    function toggleItem(itemId: string) {
      const current = selectedItems ?? [];
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      setValue('applicable_item_ids', next);
    }

    async function onSubmit(data: PromotionFormData) {
      if (isSubmitting) return;

      setIsSubmitting(true);
      setServerError(null);

      try {
        const params = {
          restaurant_id: restaurantId,
          name: data.name,
          discount_type: data.discount_type,
          discount_value: parseInt(data.discount_value, 10),
          applicable_item_ids: data.applicable_item_ids,
          start_date: data.start_date,
          end_date: data.end_date,
          push_enabled: data.push_enabled,
        };

        if (editPromotion) {
          await updatePromotion(editPromotion.id, params);
        } else {
          await createPromotion(params);
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        reset();

        if (ref && 'current' in ref && ref.current) {
          ref.current.dismiss();
        }

        onSaved();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to save promotion';
        setServerError(message);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (__DEV__) console.warn('[promotion-form] submit failed:', err);
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
            {editPromotion ? 'Edit Promotion' : 'Create Promotion'}
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
            Promotion name
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Summer Special"
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

          {/* Dates */}
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1">
              <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-1">
                Start date
              </Text>
              <Controller
                control={control}
                name="start_date"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#78716c"
                    className="bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 font-[Karla_400Regular] text-base text-stone-100"
                  />
                )}
              />
              {errors.start_date && (
                <Text className="font-[Karla_400Regular] text-xs text-red-400 mt-1">
                  {errors.start_date.message}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-1">
                End date
              </Text>
              <Controller
                control={control}
                name="end_date"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#78716c"
                    className="bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 font-[Karla_400Regular] text-base text-stone-100"
                  />
                )}
              />
              {errors.end_date && (
                <Text className="font-[Karla_400Regular] text-xs text-red-400 mt-1">
                  {errors.end_date.message}
                </Text>
              )}
            </View>
          </View>

          {/* Push notification toggle */}
          <View className="flex-row items-center justify-between mt-4 mb-4">
            <Text className="font-[Karla_600SemiBold] text-sm text-stone-400">
              Push notification
            </Text>
            <Controller
              control={control}
              name="push_enabled"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: '#44403c', true: '#dc2626' }}
                  thumbColor={value ? '#ffffff' : '#a8a29e'}
                />
              )}
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
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
              accessibilityLabel={editPromotion ? 'Save promotion' : 'Create promotion'}
              accessibilityState={{ disabled: isSubmitting }}
              className="flex-1 bg-red-600 rounded-full py-3"
              style={isSubmitting ? { opacity: 0.5 } : undefined}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-[Karla_700Bold] text-base text-white text-center">
                  {editPromotion ? 'Save' : 'Create'}
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
