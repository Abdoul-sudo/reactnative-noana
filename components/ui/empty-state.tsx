import { View, Text, Pressable } from 'react-native';
import {
  MapPin, Star, TrendingUp, Award, Search, Heart,
  ClipboardList, Clock, Bell, ChefHat, UtensilsCrossed, Tag, Sparkles, FilterX,
  MessageSquare,
  type LucideProps,
} from 'lucide-react-native';
import { type ComponentType } from 'react';
import { EMPTY_STATES, type EmptyStateType } from '@/constants/empty-states';

// Map config iconName strings to the actual imported components.
// Named imports allow Metro to tree-shake all other Lucide icons (~224KB saved).
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  MapPin, Star, TrendingUp, Award, Search, Heart,
  ClipboardList, Clock, Bell, ChefHat, UtensilsCrossed, Tag, Sparkles, FilterX,
  MessageSquare,
};

interface EmptyStateProps {
  type: EmptyStateType;
  onCta?: () => void;
}

export function EmptyState({ type, onCta }: EmptyStateProps) {
  const config = EMPTY_STATES[type];

  if (__DEV__ && config.ctaLabel && !onCta) {
    console.warn(
      `EmptyState[${type}]: config has ctaLabel "${config.ctaLabel}" but no onCta prop was provided — the button will not render.`,
    );
  }

  const IconComponent = ICON_MAP[config.iconName];

  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {IconComponent && (
        <IconComponent size={48} color="#9CA3AF" />
      )}
      <Text className="font-[Karla_700Bold] text-lg text-gray-800 mt-4 text-center">
        {config.title}
      </Text>
      <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-2 text-center leading-5">
        {config.message}
      </Text>
      {config.ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={config.ctaLabel}
          className="mt-6 px-6 py-3 bg-red-600 rounded-full"
        >
          <Text className="font-[Karla_600SemiBold] text-sm text-white">
            {config.ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
