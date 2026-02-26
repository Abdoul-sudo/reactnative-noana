import { useRef, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, MapPin, Plus } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useAddresses } from '@/hooks/use-addresses';
import { deleteAddress, type Address } from '@/lib/api/addresses';
import { AddressCard } from '@/components/address/address-card';
import { AddressFormSheet } from '@/components/address/address-form-sheet';

export default function AddressesScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  const { addresses, isLoading, error, refetch } = useAddresses(userId);
  const formSheetRef = useRef<BottomSheetModal>(null);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const isFirstFocusRef = useRef(true);

  useFocusEffect(() => {
    if (isFirstFocusRef.current) {
      isFirstFocusRef.current = false;
      return; // useAddresses already fetches on mount — skip first focus
    }
    if (userId) refetch();
  });

  function handleAdd() {
    setEditAddress(null);
    formSheetRef.current?.present();
  }

  function handleEdit(address: Address) {
    setEditAddress(address);
    formSheetRef.current?.present();
  }

  function handleDelete(address: Address) {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${address.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(address.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch (err) {
              if (__DEV__) console.warn('[addresses] deleteAddress failed:', err);
              Alert.alert('Error', 'Could not delete address. Please try again.');
            }
          },
        },
      ],
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DC2626" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-[Karla_600SemiBold] text-base text-gray-900 mb-2">
            Something went wrong
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-gray-500 text-center mb-4">
            {error.message}
          </Text>
          <Pressable
            onPress={refetch}
            accessibilityRole="button"
            accessibilityLabel="Retry loading addresses"
            className="bg-red-600 rounded-lg px-6 py-2.5"
          >
            <Text className="font-[Karla_700Bold] text-sm text-white">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!addresses.length) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
            <MapPin size={28} color="#9ca3af" />
          </View>
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-1">
            No addresses saved yet
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-gray-500 text-center mb-6">
            Add your first delivery address to speed up checkout
          </Text>
          <Pressable
            onPress={handleAdd}
            accessibilityRole="button"
            accessibilityLabel="Add your first address"
            className="bg-red-600 rounded-lg px-6 py-3"
          >
            <Text className="font-[Karla_700Bold] text-sm text-white">Add Address</Text>
          </Pressable>
        </View>
        <AddressFormSheet
          ref={formSheetRef}
          userId={userId}
          editAddress={editAddress}
          onSaved={refetch}
        />
      </SafeAreaView>
    );
  }

  // Content — address list
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Header onBack={() => router.back()} />
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <AddressCard
            address={item}
            isSelected={item.is_default}
            onPress={() => handleEdit(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      {/* Fixed bottom button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Pressable
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel="Add new address"
          className="bg-red-600 rounded-lg py-3 flex-row items-center justify-center"
        >
          <Plus size={18} color="#ffffff" />
          <Text className="font-[Karla_700Bold] text-sm text-white ml-2">Add Address</Text>
        </Pressable>
      </View>

      <AddressFormSheet
        ref={formSheetRef}
        userId={userId}
        editAddress={editAddress}
        onSaved={refetch}
      />
    </SafeAreaView>
  );
}

// Private sub-component for the header (< 15 lines)
function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <ArrowLeft size={24} color="#111827" />
      </Pressable>
      <Text className="font-[Karla_700Bold] text-lg text-gray-900 ml-3">Saved Addresses</Text>
    </View>
  );
}
