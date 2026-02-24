import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3 p-2.5"
        >
          <ChevronLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="font-[Karla_700Bold] text-lg text-gray-900">Notifications</Text>
      </View>

      <EmptyState type="notifications" />
    </SafeAreaView>
  );
}
