import { forwardRef } from 'react';
import { Text, Pressable, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

type CartConflictDialogProps = {
  currentRestaurantName: string;
  onReplace: () => void;
  onKeep: () => void;
};

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="none"
    />
  );
}

export const CartConflictDialog = forwardRef<BottomSheetModal, CartConflictDialogProps>(
  function CartConflictDialog({ currentRestaurantName, onReplace, onKeep }, ref) {
    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView className="px-6 pt-2 pb-8">
          <Text className="font-[Karla_700Bold] text-xl text-gray-900 text-center mb-2">
            Replace your cart?
          </Text>

          <Text className="font-[Karla_400Regular] text-sm text-gray-600 text-center mb-6">
            Your cart contains items from {currentRestaurantName}. Adding this item will clear your
            current cart and start a new one.
          </Text>

          <Pressable
            onPress={onReplace}
            accessibilityRole="button"
            accessibilityLabel="Clear cart and add new item"
            className="bg-red-600 rounded-full py-3 mb-3"
          >
            <Text className="font-[Karla_600SemiBold] text-base text-white text-center">
              Start new cart
            </Text>
          </Pressable>

          <Pressable
            onPress={onKeep}
            accessibilityRole="button"
            accessibilityLabel={`Keep items from ${currentRestaurantName}`}
            className="bg-gray-100 rounded-full py-3"
          >
            <Text className="font-[Karla_600SemiBold] text-base text-gray-700 text-center">
              Keep current cart
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
