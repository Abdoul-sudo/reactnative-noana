import { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { addressSchema, type AddressFormData } from '@/lib/schemas/address';

type AddressFormProps = {
  defaultValues?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function AddressForm({ defaultValues, onSubmit, onCancel, isLoading }: AddressFormProps) {
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'denied' | 'error'>('idle');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: defaultValues?.label ?? 'Home',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      lat: defaultValues?.lat ?? undefined,
      lng: defaultValues?.lng ?? undefined,
      is_default: defaultValues?.is_default ?? false,
    },
  });

  async function handleUseCurrentLocation() {
    setGpsStatus('loading');

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsStatus('denied');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded) {
        const formattedAddress = `${geocoded.streetNumber ?? ''} ${geocoded.street ?? ''}`.trim();
        setValue('address', formattedAddress || `${latitude}, ${longitude}`, { shouldValidate: true });
        setValue('city', geocoded.city ?? '', { shouldValidate: true });
        setValue('lat', latitude);
        setValue('lng', longitude);
        setGpsStatus('idle');
      } else {
        setGpsStatus('error');
      }
    } catch {
      setGpsStatus('error');
    }
  }

  return (
    <View className="px-6 pt-2 pb-4">
      {/* Label field */}
      <View className="mb-4">
        <Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-1">Label</Text>
        <Controller
          control={control}
          name="label"
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. Home, Work, Mom's"
              className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 bg-white"
              accessibilityLabel="Address label"
            />
          )}
        />
        {errors.label && (
          <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
            {errors.label.message}
          </Text>
        )}
      </View>

      {/* GPS button */}
      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={gpsStatus === 'loading'}
        accessibilityRole="button"
        accessibilityLabel="Use current location"
        className={`flex-row items-center justify-center py-3 rounded-lg mb-4 ${
          gpsStatus === 'denied' ? 'bg-gray-100' : 'bg-blue-50'
        }`}
      >
        {gpsStatus === 'loading' ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <MapPin size={18} color={gpsStatus === 'denied' ? '#9CA3AF' : '#2563EB'} />
        )}
        <Text
          className={`font-[Karla_600SemiBold] text-sm ml-2 ${
            gpsStatus === 'denied' ? 'text-gray-400' : 'text-blue-600'
          }`}
        >
          {gpsStatus === 'denied'
            ? 'Location permission required'
            : gpsStatus === 'error'
              ? 'Could not get location — try again'
              : 'Use current location'}
        </Text>
      </Pressable>

      {/* Address field */}
      <View className="mb-4">
        <Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-1">Street address</Text>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Enter your street address"
              multiline
              className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 bg-white"
              accessibilityLabel="Street address"
            />
          )}
        />
        {errors.address && (
          <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
            {errors.address.message}
          </Text>
        )}
      </View>

      {/* City field */}
      <View className="mb-4">
        <Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-1">City</Text>
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Enter your city"
              className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 bg-white"
              accessibilityLabel="City"
            />
          )}
        />
        {errors.city && (
          <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
            {errors.city.message}
          </Text>
        )}
      </View>

      {/* Default address toggle */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="font-[Karla_500Medium] text-sm text-gray-700">Set as default address</Text>
        <Controller
          control={control}
          name="is_default"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
              thumbColor={value ? '#DC2626' : '#F3F4F6'}
              accessibilityLabel="Set as default address"
            />
          )}
        />
      </View>

      {/* Buttons */}
      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Save address"
        className="bg-red-600 rounded-full py-3 mb-3 disabled:opacity-50"
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-[Karla_700Bold] text-base text-white text-center">
            Save address
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        className="bg-gray-100 rounded-full py-3"
      >
        <Text className="font-[Karla_600SemiBold] text-base text-gray-700 text-center">
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}
