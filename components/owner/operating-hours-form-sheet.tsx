import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  operatingHoursSchema,
  type OperatingHoursFormData,
} from '@/lib/schemas/restaurant-settings';
import {
  updateOperatingHours,
  type OperatingHours,
} from '@/lib/api/owner-settings';

const WEEKDAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const;

const DEFAULT_HOURS: OperatingHoursFormData = {
  monday: { open: '09:00', close: '22:00', closed: false },
  tuesday: { open: '09:00', close: '22:00', closed: false },
  wednesday: { open: '09:00', close: '22:00', closed: false },
  thursday: { open: '09:00', close: '22:00', closed: false },
  friday: { open: '09:00', close: '23:00', closed: false },
  saturday: { open: '10:00', close: '23:00', closed: false },
  sunday: { open: '10:00', close: '21:00', closed: false },
};

type OperatingHoursFormSheetProps = {
  restaurantId: string;
  operatingHours: OperatingHours | null;
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

export const OperatingHoursFormSheet = forwardRef<BottomSheetModal, OperatingHoursFormSheetProps>(
  function OperatingHoursFormSheet({ restaurantId, operatingHours, onSaved }, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');

    const {
      control,
      handleSubmit,
      reset,
      setValue,
      watch,
      formState: { errors },
    } = useForm<OperatingHoursFormData>({
      resolver: zodResolver(operatingHoursSchema),
      defaultValues: DEFAULT_HOURS,
    });

    useEffect(() => {
      if (operatingHours) {
        const formData: OperatingHoursFormData = { ...DEFAULT_HOURS };
        for (const day of WEEKDAYS) {
          const dayData = operatingHours[day.key];
          if (dayData) {
            formData[day.key] = {
              open: dayData.open,
              close: dayData.close,
              closed: dayData.closed,
            };
          }
        }
        reset(formData);
      } else {
        reset(DEFAULT_HOURS);
      }
      setSaveError('');
    }, [operatingHours, reset]);

    function dismiss() {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    async function onSubmit(data: OperatingHoursFormData) {
      setIsLoading(true);
      setSaveError('');

      try {
        const hours: OperatingHours = {};
        for (const day of WEEKDAYS) {
          hours[day.key] = {
            open: data[day.key].open,
            close: data[day.key].close,
            closed: data[day.key].closed,
          };
        }
        await updateOperatingHours(restaurantId, hours);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        onSaved();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Failed to save');
        if (__DEV__) console.warn('[operating-hours-form] save failed:', e);
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
            Operating Hours
          </Text>

          {saveError ? (
            <View className="bg-red-900/30 rounded-lg p-3 mb-4">
              <Text className="font-[Karla_400Regular] text-sm text-red-300">{saveError}</Text>
            </View>
          ) : null}

          {WEEKDAYS.map((day) => {
            const isClosed = watch(`${day.key}.closed`);
            return (
              <View
                key={day.key}
                className="flex-row items-center py-3 border-b border-stone-800"
                accessibilityLabel={`${day.label} hours`}
                accessibilityRole="summary"
              >
                {/* Day label */}
                <Text className="font-[Karla_600SemiBold] text-sm text-stone-200 w-10">
                  {day.label}
                </Text>

                {/* Closed toggle */}
                <Controller
                  control={control}
                  name={`${day.key}.closed`}
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row items-center mr-3">
                      <Switch
                        value={value}
                        onValueChange={onChange}
                        trackColor={{ false: '#44403c', true: '#dc2626' }}
                        thumbColor="#fafaf9"
                        accessibilityLabel={`${day.label} closed`}
                        accessibilityRole="switch"
                        style={{ transform: [{ scale: 0.7 }] }}
                      />
                      <Text className="font-[Karla_400Regular] text-xs text-stone-500 ml-1">
                        {value ? 'Closed' : 'Open'}
                      </Text>
                    </View>
                  )}
                />

                {/* Time inputs */}
                {!isClosed && (
                  <View className="flex-row items-center flex-1">
                    <Controller
                      control={control}
                      name={`${day.key}.open`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="09:00"
                          placeholderTextColor="#78716c"
                          maxLength={5}
                          accessibilityLabel={`${day.label} open time`}
                          className="bg-stone-800 rounded px-2 py-1.5 text-stone-100 font-[Karla_400Regular] text-xs text-center flex-1"
                        />
                      )}
                    />
                    <Text className="font-[Karla_400Regular] text-xs text-stone-500 mx-1">–</Text>
                    <Controller
                      control={control}
                      name={`${day.key}.close`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="22:00"
                          placeholderTextColor="#78716c"
                          maxLength={5}
                          accessibilityLabel={`${day.label} close time`}
                          className="bg-stone-800 rounded px-2 py-1.5 text-stone-100 font-[Karla_400Regular] text-xs text-center flex-1"
                        />
                      )}
                    />
                  </View>
                )}

                {isClosed && (
                  <Text className="font-[Karla_400Regular] text-xs text-stone-500 flex-1 text-center">
                    Closed all day
                  </Text>
                )}
              </View>
            );
          })}

          {/* Global error */}
          {errors.monday?.root || errors.tuesday?.root || errors.wednesday?.root ||
            errors.thursday?.root || errors.friday?.root || errors.saturday?.root ||
            errors.sunday?.root ? (
            <Text className="font-[Karla_400Regular] text-xs text-red-400 mt-2">
              Close time must be after open time for all open days
            </Text>
          ) : null}

          {/* Actions */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Save operating hours"
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
