import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus } from 'lucide-react-native';
import {
  menuItemSchema,
  type MenuItemFormData,
  priceToCentimes,
  centimesToPrice,
} from '@/lib/schemas/menu-item';
import {
  createMenuItem,
  updateMenuItem,
  type MenuItemDisplay,
} from '@/lib/api/owner-menu';
import { uploadMenuImage, deleteMenuImage, getMenuImagePublicUrl } from '@/lib/storage';
import { DIETARY_TAGS, type DietaryTag } from '@/constants/dietary';

type MenuItemFormSheetProps = {
  restaurantId: string;
  categoryId: string;
  editItem?: MenuItemDisplay | null;
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

export const MenuItemFormSheet = forwardRef<BottomSheetModal, MenuItemFormSheetProps>(
  function MenuItemFormSheet({ restaurantId, categoryId, editItem, onSaved }, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageChanged, setImageChanged] = useState(false);

    const {
      control,
      handleSubmit,
      reset,
      setValue,
      watch,
      formState: { errors },
    } = useForm<MenuItemFormData>({
      resolver: zodResolver(menuItemSchema),
      defaultValues: {
        name: editItem?.name ?? '',
        description: editItem?.description ?? '',
        price: editItem ? centimesToPrice(editItem.price) : '',
        prepTimeMin: editItem?.prepTimeMin?.toString() ?? '',
        isAvailable: editItem?.isAvailable ?? true,
        dietaryTags: editItem?.dietaryTags ?? [],
      },
    });

    const dietaryTags = watch('dietaryTags');

    useEffect(() => {
      reset({
        name: editItem?.name ?? '',
        description: editItem?.description ?? '',
        price: editItem ? centimesToPrice(editItem.price) : '',
        prepTimeMin: editItem?.prepTimeMin?.toString() ?? '',
        isAvailable: editItem?.isAvailable ?? true,
        dietaryTags: editItem?.dietaryTags ?? [],
      });
      setImageUri(
        editItem?.imageUrl ? getMenuImagePublicUrl(editItem.imageUrl) ?? null : null,
      );
      setImageChanged(false);
      setSaveError('');
    }, [editItem, reset]);

    function dismiss() {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    async function handlePickImage() {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageChanged(true);
      }
    }

    function toggleTag(tag: DietaryTag) {
      const current = dietaryTags ?? [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      setValue('dietaryTags', next);
    }

    async function onSubmit(data: MenuItemFormData) {
      setIsLoading(true);
      setSaveError('');

      try {
        const priceInCentimes = priceToCentimes(data.price);
        const prepTime = data.prepTimeMin ? parseInt(data.prepTimeMin, 10) : null;

        if (editItem) {
          // Update existing item
          let newImageUrl = editItem.imageUrl;

          // Upload new image if user picked a different one
          if (imageChanged && imageUri) {
            // Delete old image if exists
            if (editItem.imageUrl) {
              await deleteMenuImage(editItem.imageUrl);
            }
            newImageUrl = await uploadMenuImage(restaurantId, editItem.id, imageUri);
          }

          await updateMenuItem(editItem.id, {
            name: data.name,
            description: data.description || null,
            price: priceInCentimes,
            prepTimeMin: prepTime,
            isAvailable: data.isAvailable,
            dietaryTags: data.dietaryTags ?? [],
            imageUrl: newImageUrl,
          });
        } else {
          // Create new item
          const itemId = await createMenuItem(restaurantId, categoryId, {
            name: data.name,
            description: data.description || null,
            price: priceInCentimes,
            prepTimeMin: prepTime,
            isAvailable: data.isAvailable,
            dietaryTags: data.dietaryTags ?? [],
          });

          // Upload image if user picked one
          if (imageChanged && imageUri) {
            const path = await uploadMenuImage(restaurantId, itemId, imageUri);
            await updateMenuItem(itemId, {
              name: data.name,
              description: data.description || null,
              price: priceInCentimes,
              prepTimeMin: prepTime,
              isAvailable: data.isAvailable,
              dietaryTags: data.dietaryTags ?? [],
              imageUrl: path,
            });
          }
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        onSaved();
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save item';
        setSaveError(message);
        if (__DEV__) console.warn('[menu-item-form-sheet] save failed:', e);
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
        <BottomSheetScrollView className="px-6 pt-2 pb-8">
          {/* Header */}
          <Text className="font-[Karla_700Bold] text-lg text-stone-100 text-center mb-4">
            {editItem ? 'Edit Item' : 'Add Item'}
          </Text>

          {/* Error banner */}
          {saveError !== '' && (
            <View className="bg-red-900/30 rounded-lg p-3 mb-4">
              <Text className="font-[Karla_400Regular] text-red-400 text-sm text-center">
                {saveError}
              </Text>
            </View>
          )}

          {/* Image picker */}
          <Pressable
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel={imageUri ? 'Change item image' : 'Add item image'}
            className="w-full h-40 rounded-xl bg-stone-800 border border-stone-600 items-center justify-center mb-4 overflow-hidden"
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View className="items-center">
                <ImagePlus size={32} color="#a8a29e" />
                <Text className="font-[Karla_400Regular] text-sm text-stone-400 mt-2">
                  Tap to add photo
                </Text>
              </View>
            )}
          </Pressable>

          {/* Name field */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-400 mb-1">Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Margherita Pizza"
                placeholderTextColor="#a8a29e"
                maxLength={100}
                className="border border-stone-600 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 bg-stone-800"
                accessibilityLabel="Item name"
              />
            )}
          />
          {errors.name && (
            <Text className="font-[Karla_400Regular] text-red-400 text-sm mt-1">
              {errors.name.message}
            </Text>
          )}

          {/* Description field */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-400 mb-1 mt-4">
            Description (optional)
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Brief description of the dish"
                placeholderTextColor="#a8a29e"
                multiline
                numberOfLines={3}
                maxLength={500}
                className="border border-stone-600 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 bg-stone-800"
                style={{ textAlignVertical: 'top', minHeight: 80 }}
                accessibilityLabel="Item description"
              />
            )}
          />

          {/* Price field */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-400 mb-1 mt-4">
            Price (DA)
          </Text>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="12.50"
                placeholderTextColor="#a8a29e"
                keyboardType="decimal-pad"
                className="border border-stone-600 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 bg-stone-800"
                accessibilityLabel="Item price in DA"
              />
            )}
          />
          {errors.price && (
            <Text className="font-[Karla_400Regular] text-red-400 text-sm mt-1">
              {errors.price.message}
            </Text>
          )}

          {/* Prep time field */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-400 mb-1 mt-4">
            Prep time in minutes (optional)
          </Text>
          <Controller
            control={control}
            name="prepTimeMin"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="15"
                placeholderTextColor="#a8a29e"
                keyboardType="number-pad"
                className="border border-stone-600 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 bg-stone-800"
                accessibilityLabel="Preparation time in minutes"
              />
            )}
          />

          {errors.prepTimeMin && (
            <Text className="font-[Karla_400Regular] text-red-400 text-sm mt-1">
              {errors.prepTimeMin.message}
            </Text>
          )}

          {/* Availability toggle */}
          <View className="flex-row items-center justify-between mt-4">
            <Text className="font-[Karla_500Medium] text-sm text-stone-400">Available</Text>
            <Controller
              control={control}
              name="isAvailable"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: '#44403c', true: '#dc2626' }}
                  thumbColor="#fafaf9"
                  accessibilityLabel="Item availability toggle"
                  accessibilityRole="switch"
                />
              )}
            />
          </View>

          {/* Dietary tags */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-400 mb-2 mt-4">
            Dietary Tags
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => {
              const selected = (dietaryTags ?? []).includes(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => toggleTag(tag.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${tag.label}${selected ? ', selected' : ''}`}
                  accessibilityState={{ selected }}
                  className={`px-3 py-1.5 rounded-full border ${
                    selected
                      ? 'bg-red-600 border-red-600'
                      : 'bg-stone-800 border-stone-600'
                  }`}
                >
                  <Text
                    className={`font-[Karla_500Medium] text-sm ${
                      selected ? 'text-white' : 'text-stone-400'
                    }`}
                  >
                    {tag.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={editItem ? 'Save item changes' : 'Create new item'}
            className="bg-red-600 rounded-full py-3 mt-5 disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-[Karla_700Bold] text-base text-white text-center">
                {editItem ? 'Save' : 'Add Item'}
              </Text>
            )}
          </Pressable>

          {/* Cancel button */}
          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="py-3 mt-2 mb-4"
          >
            <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 text-center">
              Cancel
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
