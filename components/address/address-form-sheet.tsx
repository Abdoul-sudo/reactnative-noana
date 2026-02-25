import { forwardRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { createAddress, updateAddress, type Address } from '@/lib/api/addresses';
import { AddressForm } from '@/components/address/address-form';
import { type AddressFormData } from '@/lib/schemas/address';

type AddressFormSheetProps = {
  userId: string;
  editAddress?: Address | null;
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

export const AddressFormSheet = forwardRef<BottomSheetModal, AddressFormSheetProps>(
  function AddressFormSheet({ userId, editAddress, onSaved }, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');

    function dismiss() {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    async function handleSubmit(data: AddressFormData) {
      setIsLoading(true);
      setSaveError('');
      try {
        if (editAddress) {
          await updateAddress(editAddress.id, data);
        } else {
          await createAddress({ ...data, user_id: userId });
        }
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        onSaved();
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save address';
        setSaveError(message);
      } finally {
        setIsLoading(false);
      }
    }

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
      >
        <BottomSheetScrollView>
          {/* Header */}
          <View className="px-6 pt-2 pb-3 border-b border-gray-100">
            <Text className="font-[Karla_700Bold] text-lg text-gray-900 text-center">
              {editAddress ? 'Edit Address' : 'Add New Address'}
            </Text>
          </View>

          {saveError !== '' && (
            <View className="mx-6 mt-3 bg-red-100 rounded-lg p-3">
              <Text className="font-[Karla_400Regular] text-red-600 text-sm text-center">
                {saveError}
              </Text>
            </View>
          )}

          <AddressForm
            defaultValues={
              editAddress
                ? {
                    label: editAddress.label,
                    address: editAddress.address,
                    city: editAddress.city,
                    lat: editAddress.lat,
                    lng: editAddress.lng,
                    is_default: editAddress.is_default,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={dismiss}
            isLoading={isLoading}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
