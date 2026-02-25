import { Text, Pressable, View } from 'react-native';
import { MapPin, Pencil, Trash2 } from 'lucide-react-native';
import { type Address } from '@/lib/api/addresses';

type AddressCardProps = {
  address: Address;
  isSelected: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function AddressCard({ address, isSelected, onPress, onEdit, onDelete }: AddressCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select address: ${address.label}, ${address.address}`}
      className={`flex-row items-center p-4 rounded-xl mb-2 ${
        isSelected ? 'border-2 border-red-600 bg-red-50' : 'border border-gray-200 bg-white'
      }`}
    >
      {/* Icon */}
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        <MapPin size={20} color={isSelected ? '#DC2626' : '#6B7280'} />
      </View>

      {/* Address info */}
      <View className="flex-1 mr-2">
        <View className="flex-row items-center gap-2">
          <Text className="font-[Karla_700Bold] text-base text-gray-900">
            {address.label}
          </Text>
          {address.is_default && (
            <View className="bg-red-100 rounded-full px-2 py-0.5">
              <Text className="font-[Karla_600SemiBold] text-xs text-red-600">
                Default
              </Text>
            </View>
          )}
        </View>
        <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-0.5" numberOfLines={1}>
          {address.address}, {address.city}
        </Text>
      </View>

      {/* Action buttons */}
      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit address ${address.label}`}
          className="w-8 h-8 items-center justify-center"
        >
          <Pencil size={16} color="#6B7280" />
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete address ${address.label}`}
          className="w-8 h-8 items-center justify-center"
        >
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );
}
