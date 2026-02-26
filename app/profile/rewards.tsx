import { useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Flame, Gift, Info, Star, Trophy } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useRewards } from '@/hooks/use-rewards';

export default function RewardsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  const { rewards, isLoading, error, refetch } = useRewards(userId);
  const isFirstFocusRef = useRef(true);

  useFocusEffect(() => {
    if (isFirstFocusRef.current) {
      isFirstFocusRef.current = false;
      return;
    }
    if (userId) refetch();
  });

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
            accessibilityLabel="Retry loading rewards"
            className="bg-red-600 rounded-lg px-6 py-2.5"
          >
            <Text className="font-[Karla_700Bold] text-sm text-white">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const points = rewards?.loyaltyPoints ?? 0;
  const currentStreak = rewards?.currentStreak ?? 0;
  const longestStreak = rewards?.longestStreak ?? 0;
  const isZero = points === 0 && currentStreak === 0 && longestStreak === 0;

  // Zero state
  if (isZero) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full bg-yellow-50 items-center justify-center mb-4">
            <Trophy size={28} color="#f59e0b" />
          </View>
          <Text className="font-[Karla_700Bold] text-base text-gray-900 mb-1">
            Start earning rewards!
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-gray-500 text-center mb-6">
            Place your first order to earn loyalty points and build your streak
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/');
            }}
            accessibilityRole="button"
            accessibilityLabel="Place your first order"
            className="bg-red-600 rounded-lg px-6 py-3"
          >
            <Text className="font-[Karla_700Bold] text-sm text-white">Place Your First Order</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Content — rewards display
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Header onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Points card */}
        <View className="bg-red-50 rounded-2xl p-5 items-center mb-4">
          <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-3">
            <Gift size={24} color="#dc2626" />
          </View>
          <Text className="font-[Karla_700Bold] text-3xl text-red-600">
            {points}
          </Text>
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-700 mt-1">
            Loyalty Points
          </Text>
          <Text className="font-[Karla_400Regular] text-xs text-gray-500 mt-1">
            Earn 10 points per delivered order
          </Text>
        </View>

        {/* Streak cards row */}
        <View className="flex-row gap-x-3 mb-4">
          {/* Current streak */}
          <View className="flex-1 bg-orange-50 rounded-2xl p-4 items-center">
            <Flame size={20} color="#ea580c" />
            <Text className="font-[Karla_700Bold] text-2xl text-orange-600 mt-2">
              {currentStreak}
            </Text>
            <Text className="font-[Karla_600SemiBold] text-xs text-gray-700 mt-1">
              Current Streak
            </Text>
            <Text className="font-[Karla_400Regular] text-xs text-gray-500">days</Text>
          </View>

          {/* Longest streak */}
          <View className="flex-1 bg-purple-50 rounded-2xl p-4 items-center">
            <Star size={20} color="#9333ea" />
            <Text className="font-[Karla_700Bold] text-2xl text-purple-600 mt-2">
              {longestStreak}
            </Text>
            <Text className="font-[Karla_600SemiBold] text-xs text-gray-700 mt-1">
              Longest Streak
            </Text>
            <Text className="font-[Karla_400Regular] text-xs text-gray-500">days</Text>
          </View>
        </View>

        {/* How to earn section */}
        <View className="bg-gray-50 rounded-2xl p-4">
          <View className="flex-row items-center mb-3">
            <Info size={16} color="#6b7280" />
            <Text className="font-[Karla_700Bold] text-sm text-gray-900 ml-2">
              How to Earn
            </Text>
          </View>
          <View className="gap-y-2">
            <Text className="font-[Karla_400Regular] text-sm text-gray-600">
              {'\u2022'} Earn 10 points for every delivered order
            </Text>
            <Text className="font-[Karla_400Regular] text-sm text-gray-600">
              {'\u2022'} Order on consecutive days to build your streak
            </Text>
            <Text className="font-[Karla_400Regular] text-sm text-gray-600">
              {'\u2022'} Your streak resets if you skip a day
            </Text>
          </View>
        </View>
      </ScrollView>
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
      <Text className="font-[Karla_700Bold] text-lg text-gray-900 ml-3">Rewards</Text>
    </View>
  );
}
