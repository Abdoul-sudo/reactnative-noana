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
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera } from 'lucide-react-native';
import {
  restaurantInfoSchema,
  type RestaurantInfoFormData,
} from '@/lib/schemas/restaurant-settings';
import {
  updateRestaurantInfo,
  type RestaurantSettings,
} from '@/lib/api/owner-settings';
import {
  uploadRestaurantImage,
  getRestaurantImagePublicUrl,
} from '@/lib/storage';

type RestaurantInfoFormSheetProps = {
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

export const RestaurantInfoFormSheet = forwardRef<BottomSheetModal, RestaurantInfoFormSheetProps>(
  function RestaurantInfoFormSheet({ restaurantId, restaurant, onSaved }, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [coverChanged, setCoverChanged] = useState(false);
    const [logoChanged, setLogoChanged] = useState(false);

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<RestaurantInfoFormData>({
      resolver: zodResolver(restaurantInfoSchema),
      defaultValues: {
        name: '',
        description: '',
      },
    });

    useEffect(() => {
      reset({
        name: restaurant.name,
        description: restaurant.description ?? '',
      });
      setCoverUri(getRestaurantImagePublicUrl(restaurant.coverImageUrl) ?? null);
      setLogoUri(getRestaurantImagePublicUrl(restaurant.logoUrl) ?? null);
      setCoverChanged(false);
      setLogoChanged(false);
      setSaveError('');
    }, [restaurant, reset]);

    async function pickImage(target: 'cover' | 'logo') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: target === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (target === 'cover') {
          setCoverUri(result.assets[0].uri);
          setCoverChanged(true);
        } else {
          setLogoUri(result.assets[0].uri);
          setLogoChanged(true);
        }
      }
    }

    function dismiss() {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    async function onSubmit(data: RestaurantInfoFormData) {
      setIsLoading(true);
      setSaveError('');

      try {
        let newCoverPath: string | undefined;
        let newLogoPath: string | undefined;

        if (coverChanged && coverUri) {
          newCoverPath = await uploadRestaurantImage(restaurantId, 'cover', coverUri);
        }
        if (logoChanged && logoUri) {
          newLogoPath = await uploadRestaurantImage(restaurantId, 'logo', logoUri);
        }

        await updateRestaurantInfo(restaurantId, {
          name: data.name,
          description: data.description || null,
          coverImageUrl: newCoverPath !== undefined ? newCoverPath : undefined,
          logoUrl: newLogoPath !== undefined ? newLogoPath : undefined,
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        onSaved();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Failed to save');
        if (__DEV__) console.warn('[restaurant-info-form] save failed:', e);
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
          <Text
            accessibilityRole="header"
            className="font-[Karla_700Bold] text-lg text-stone-100 mb-4"
          >
            Edit Restaurant Info
          </Text>

          {saveError ? (
            <View className="bg-red-900/30 rounded-lg p-3 mb-4">
              <Text className="font-[Karla_400Regular] text-sm text-red-300">{saveError}</Text>
            </View>
          ) : null}

          {/* Cover Photo */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-300 mb-2">Cover Photo</Text>
          <Pressable
            onPress={() => pickImage('cover')}
            accessibilityRole="button"
            accessibilityLabel="Pick cover photo"
            className="h-32 rounded-lg bg-stone-800 items-center justify-center overflow-hidden mb-4"
          >
            {coverUri ? (
              <Image
                source={{ uri: coverUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                accessibilityLabel="Cover photo preview"
              />
            ) : (
              <View className="items-center">
                <Camera size={24} color="#78716c" />
                <Text className="font-[Karla_400Regular] text-xs text-stone-500 mt-1">
                  Tap to add cover
                </Text>
              </View>
            )}
          </Pressable>

          {/* Logo */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-300 mb-2">Logo</Text>
          <Pressable
            onPress={() => pickImage('logo')}
            accessibilityRole="button"
            accessibilityLabel="Pick logo"
            className="w-20 h-20 rounded-full bg-stone-800 items-center justify-center overflow-hidden mb-4 self-center"
          >
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                contentFit="cover"
                accessibilityLabel="Logo preview"
              />
            ) : (
              <Camera size={20} color="#78716c" />
            )}
          </Pressable>

          {/* Name */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-300 mb-1">Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Restaurant name"
                placeholderTextColor="#78716c"
                accessibilityLabel="Restaurant name"
                className="bg-stone-800 rounded-lg px-4 py-3 text-stone-100 font-[Karla_400Regular] mb-1"
              />
            )}
          />
          {errors.name && (
            <Text className="font-[Karla_400Regular] text-xs text-red-400 mb-3">
              {errors.name.message}
            </Text>
          )}

          {/* Description */}
          <Text className="font-[Karla_500Medium] text-sm text-stone-300 mb-1 mt-3">
            Description
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Tell customers about your restaurant"
                placeholderTextColor="#78716c"
                multiline
                numberOfLines={3}
                accessibilityLabel="Restaurant description"
                className="bg-stone-800 rounded-lg px-4 py-3 text-stone-100 font-[Karla_400Regular] mb-1"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            )}
          />
          {errors.description && (
            <Text className="font-[Karla_400Regular] text-xs text-red-400 mb-3">
              {errors.description.message}
            </Text>
          )}

          {/* Actions */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Save restaurant info"
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
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
