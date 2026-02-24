import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Sparkles, UtensilsCrossed, RotateCcw } from 'lucide-react-native';
import { type TrendingDish } from '@/lib/api/menu';

type SurpriseMeCardProps = {
  surprise: TrendingDish | null;
  hasResults: boolean;
  onTrigger: () => void;
  onReset: () => void;
};

export function SurpriseMeCard({
  surprise,
  hasResults,
  onTrigger,
  onReset,
}: SurpriseMeCardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function handleTrigger() {
    // Reset animation values before picking
    scale.value = 0.85;
    opacity.value = 0;
    onTrigger();
    // Skip spring animation when user prefers reduced motion
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 120 });
      opacity.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  }

  function handleReset() {
    scale.value = 0.85;
    opacity.value = 0;
    onReset();
  }

  // ── Idle state: show the trigger button ──────────────────────────
  if (!surprise) {
    return (
      <Pressable
        onPress={hasResults ? handleTrigger : undefined}
        accessibilityRole="button"
        accessibilityLabel="Surprise me with a random restaurant"
        accessibilityState={{ disabled: !hasResults }}
        className={`mx-4 mt-4 rounded-2xl px-5 py-4 flex-row items-center ${
          hasResults ? 'bg-red-600' : 'bg-gray-300'
        }`}
      >
        <Sparkles size={22} color={hasResults ? '#ffffff' : '#9ca3af'} />
        <View className="ml-3 flex-1">
          <Text
            className={`font-[Karla_700Bold] text-base ${
              hasResults ? 'text-white' : 'text-gray-500'
            }`}
          >
            Surprise Me!
          </Text>
          <Text
            className={`font-[Karla_400Regular] text-xs mt-0.5 ${
              hasResults ? 'text-red-100' : 'text-gray-400'
            }`}
          >
            {hasResults ? 'Tap to discover a random dish' : 'No dishes match your filters'}
          </Text>
        </View>
      </Pressable>
    );
  }

  // ── Revealed state: show the selected dish ───────────────────────
  return (
    <Animated.View style={revealStyle} className="mx-4 mt-4">
      <View className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
        {/* Dish image or placeholder */}
        {surprise.image_url ? (
          <Image
            source={surprise.image_url}
            contentFit="cover"
            className="w-full h-40 bg-gray-200"
            accessibilityLabel={`${surprise.name} photo`}
          />
        ) : (
          <View className="w-full h-40 bg-gray-100 items-center justify-center">
            <UtensilsCrossed size={40} color="#d1d5db" />
          </View>
        )}

        <View className="p-4">
          {/* Dish name + price */}
          <View className="flex-row items-center justify-between">
            <Text
              className="font-[Karla_700Bold] text-lg text-gray-900 flex-1"
              numberOfLines={1}
            >
              {surprise.name}
            </Text>
            <Text className="font-[Karla_700Bold] text-base text-red-600 ml-2">
              {surprise.price} DA
            </Text>
          </View>

          {/* Restaurant attribution */}
          <Text
            className="font-[Karla_400Regular] text-sm text-gray-500 mt-1"
            numberOfLines={1}
          >
            from {surprise.restaurant.name}
          </Text>

          {/* Action buttons */}
          <View className="flex-row mt-4 gap-x-3">
            <Pressable
              onPress={() => router.push(`/restaurant/${surprise.restaurant.slug}`)}
              accessibilityRole="button"
              accessibilityLabel={`View ${surprise.restaurant.name}`}
              className="flex-1 bg-red-600 rounded-xl py-3 items-center"
            >
              <Text className="font-[Karla_600SemiBold] text-sm text-white">
                View restaurant
              </Text>
            </Pressable>

            <Pressable
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="Try another surprise"
              className="bg-gray-100 rounded-xl py-3 px-4 flex-row items-center"
            >
              <RotateCcw size={16} color="#374151" />
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-700 ml-1.5">
                Try again
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
