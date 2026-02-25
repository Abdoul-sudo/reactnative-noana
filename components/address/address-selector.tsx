import { forwardRef } from 'react';
import { Text, Pressable, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Plus } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { type Address } from '@/lib/api/addresses';
import { useAddresses } from '@/hooks/use-addresses';
import { AddressCard } from '@/components/address/address-card';
import { EmptyState } from '@/components/ui/empty-state';

type AddressSelectorProps = {
  userId: string;
  selectedAddressId?: string;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
};

const ADDRESS_SHEET_SNAP_POINTS = ['50%', '85%'];

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

function SkeletonCard() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center p-4 rounded-xl mb-2 border border-gray-100 bg-white"
    >
      <View className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
      <View className="flex-1">
        <View className="w-20 h-4 bg-gray-200 rounded mb-2" />
        <View className="w-40 h-3 bg-gray-100 rounded" />
      </View>
    </Animated.View>
  );
}

export const AddressSelector = forwardRef<BottomSheetModal, AddressSelectorProps>(
  function AddressSelector(
    { userId, selectedAddressId, onSelect, onAddNew, onEdit, onDelete },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const { addresses, isLoading, error } = useAddresses(userId);

    function handleDelete(address: Address) {
      Alert.alert(
        'Delete address?',
        `Are you sure you want to delete "${address.label}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(address.id),
          },
        ],
      );
    }

    function renderContent() {
      if (isLoading) {
        return (
          <View className="px-4 pt-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        );
      }

      if (error) {
        return (
          <View className="flex-1 items-center justify-center py-12 px-4">
            <Text className="font-[Karla_400Regular] text-base text-red-500 text-center">
              {error.message}
            </Text>
          </View>
        );
      }

      if (addresses.length === 0) {
        return <EmptyState type="addresses" onCta={onAddNew} />;
      }

      return (
        <BottomSheetFlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              isSelected={item.id === selectedAddressId}
              onPress={() => onSelect(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      );
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={ADDRESS_SHEET_SNAP_POINTS}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
      >
        {/* Header */}
        <View className="px-4 pb-3 border-b border-gray-100">
          <Text className="font-[Karla_700Bold] text-lg text-gray-900 text-center">
            Delivery Address
          </Text>
        </View>

        {renderContent()}

        {/* Add new address button */}
        <View
          className="px-4 pt-3 border-t border-gray-100"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <Pressable
            onPress={onAddNew}
            accessibilityRole="button"
            accessibilityLabel="Add new address"
            className="flex-row items-center justify-center py-3 bg-gray-100 rounded-full"
          >
            <Plus size={18} color="#374151" />
            <Text className="font-[Karla_600SemiBold] text-base text-gray-700 ml-2">
              Add new address
            </Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    );
  },
);
