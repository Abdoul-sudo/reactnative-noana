import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center p-5">
      <ThemedText type="title">noana</ThemedText>
      <View className="h-2" />
      <ThemedText>Discover restaurants near you</ThemedText>
    </ThemedView>
  );
}
