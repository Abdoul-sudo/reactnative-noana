import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { type ViewStyle } from 'react-native';

interface SkeletonProps {
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 800 }),
      -1,   // -1 = infinite repetitions
      true, // reverse = true → ping-pong: 1.0 → 0.3 → 1.0
    );
    return () => cancelAnimation(opacity); // stop worklet when component unmounts
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[style, animatedStyle]}
      className={`bg-gray-200 ${className}`}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    />
  );
}
