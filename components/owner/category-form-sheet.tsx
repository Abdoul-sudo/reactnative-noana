import { forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryFormData } from '@/lib/schemas/menu-category';
import { createCategory, updateCategory, type CategoryWithCount } from '@/lib/api/owner-menu';

type CategoryFormSheetProps = {
  restaurantId: string;
  editCategory?: CategoryWithCount | null;
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

export const CategoryFormSheet = forwardRef<BottomSheetModal, CategoryFormSheetProps>(
  function CategoryFormSheet({ restaurantId, editCategory, onSaved }, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<CategoryFormData>({
      resolver: zodResolver(categorySchema),
      defaultValues: { name: editCategory?.name ?? '' },
    });

    // Reset form when editCategory changes (switching between add/edit)
    useEffect(() => {
      reset({ name: editCategory?.name ?? '' });
      setSaveError('');
    }, [editCategory, reset]);

    function dismiss() {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    async function onSubmit(data: CategoryFormData) {
      setIsLoading(true);
      setSaveError('');
      try {
        if (editCategory) {
          await updateCategory(editCategory.id, data.name);
        } else {
          await createCategory(restaurantId, data.name);
        }
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        onSaved();
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save category';
        setSaveError(message);
        if (__DEV__) console.warn('[category-form-sheet] save failed:', e);
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
          {/* Header */}
          <Text className="font-[Karla_700Bold] text-lg text-stone-100 text-center mb-4">
            {editCategory ? 'Edit Category' : 'Add Category'}
          </Text>

          {/* Error banner */}
          {saveError !== '' && (
            <View className="bg-red-900/30 rounded-lg p-3 mb-4">
              <Text className="font-[Karla_400Regular] text-red-400 text-sm text-center">
                {saveError}
              </Text>
            </View>
          )}

          {/* Name field */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-400 mb-1">
            Category Name
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Pizzas, Desserts, Drinks"
                placeholderTextColor="#a8a29e"
                autoFocus
                maxLength={50}
                className="border border-stone-600 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 bg-stone-800"
                accessibilityLabel="Category name"
              />
            )}
          />
          {errors.name && (
            <Text className="font-[Karla_400Regular] text-red-400 text-sm mt-1">
              {errors.name.message}
            </Text>
          )}

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={editCategory ? 'Save category changes' : 'Create new category'}
            className="bg-red-600 rounded-full py-3 mt-5 disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-[Karla_700Bold] text-base text-white text-center">
                {editCategory ? 'Save' : 'Add Category'}
              </Text>
            )}
          </Pressable>

          {/* Cancel button */}
          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="py-3 mt-2"
          >
            <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 text-center">
              Cancel
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
