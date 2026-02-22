import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <ThemedText type="title">noana</ThemedText>
      <View style={{ height: 8 }} />
      <ThemedText>Discover restaurants near you</ThemedText>
    </ThemedView>
  );
}
