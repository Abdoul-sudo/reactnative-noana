import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function RestaurantDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <View className="flex-1 bg-red-50 items-center justify-center">
      <Text className="font-[Karla_400Regular] text-gray-500">
        Restaurant: {slug} — coming in Epic 4
      </Text>
    </View>
  );
}
