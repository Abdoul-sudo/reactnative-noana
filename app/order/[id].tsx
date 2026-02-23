import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-red-50 items-center justify-center">
      <Text className="font-[Karla_400Regular] text-gray-500">
        Order #{id} — coming in Epic 5
      </Text>
    </View>
  );
}
