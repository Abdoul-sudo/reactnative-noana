import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Check, Circle } from 'lucide-react-native';
import { ORDER_STEPS } from '@/constants/order-status';
import { type Order } from '@/lib/api/orders';

type OrderStatusStepperProps = {
  order: Order;
};

export function OrderStatusStepper({ order }: OrderStatusStepperProps) {
  const currentStepIndex = ORDER_STEPS.findIndex((step) => step.key === order.status);

  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="summary">
      {ORDER_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const isFuture = index > currentStepIndex;
        const isLast = index === ORDER_STEPS.length - 1;

        const timestamp = order[step.timestampKey as keyof Order] as string | null;

        return (
          <View
            key={step.key}
            className="flex-row"
            accessibilityLabel={`${step.label}, ${isCompleted ? 'completed' : isActive ? 'in progress' : 'pending'}${timestamp ? `, at ${formatTimestamp(timestamp)}` : ''}`}
          >
            {/* Left: icon + connector line */}
            <View className="items-center mr-4" style={{ width: 32 }}>
              {isCompleted ? (
                <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center">
                  <Check size={16} color="#ffffff" />
                </View>
              ) : isActive ? (
                <PulsingDot />
              ) : (
                <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                  <Circle size={14} color="#9CA3AF" />
                </View>
              )}

              {/* Connector line */}
              {!isLast && (
                <View
                  className={`w-0.5 flex-1 my-1 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ minHeight: 24 }}
                />
              )}
            </View>

            {/* Right: label + timestamp */}
            <View className="flex-1 pb-6">
              <Text
                className={`font-[Karla_600SemiBold] text-sm ${
                  isCompleted
                    ? 'text-green-700'
                    : isActive
                      ? 'text-gray-900'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </Text>
              {timestamp && (
                <Text className="font-[Karla_400Regular] text-xs text-gray-500 mt-0.5">
                  {formatTimestamp(timestamp)}
                </Text>
              )}
              {isActive && !timestamp && (
                <Text className="font-[Karla_400Regular] text-xs text-gray-400 mt-0.5">
                  In progress...
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Pulsing dot for the active step ──────────────────────────────────────────

function PulsingDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-8 h-8 rounded-full bg-red-600 items-center justify-center"
    >
      <View className="w-3 h-3 rounded-full bg-white" />
    </Animated.View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
