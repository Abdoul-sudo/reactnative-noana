import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { chipContainerStyles, chipTextStyles } from './chip-styles';

const CUISINES = [
  'French', 'Italian', 'Asian', 'Mexican',
  'American', 'Mediterranean', 'Indian', 'Japanese',
];

interface StepCuisinesProps {
  onContinue: (cuisines: string[]) => void;
  onSkip: () => void;
}

export function StepCuisines({ onContinue, onSkip }: StepCuisinesProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (cuisine: string) => {
    setSelected((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine],
    );
  };

  return (
    <View className="flex-1 bg-red-50">
      {/* Skip — top right */}
      <View className="flex-row justify-end px-6 pt-4">
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip cuisine preferences"
        >
          <Text className="font-[Karla_500Medium] text-sm text-gray-500">Skip</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6">
        <Text className="font-[PlayfairDisplaySC_700Bold] text-2xl text-gray-900 text-center">
          Your Cuisine Preferences
        </Text>
        <Text className="font-[Karla_400Regular] text-base text-gray-600 text-center mt-2">
          Select all that apply
        </Text>

        {/* Chip grid */}
        <View className="flex-row flex-wrap gap-3 mt-8 justify-center">
          {CUISINES.map((cuisine) => {
            const isSelected = selected.includes(cuisine);
            return (
              <Pressable
                key={cuisine}
                onPress={() => toggle(cuisine)}
                className={chipContainerStyles[isSelected ? 'active' : 'inactive']}
                accessibilityRole="button"
                accessibilityLabel={`${cuisine} cuisine`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text className={chipTextStyles[isSelected ? 'active' : 'inactive']}>
                  {cuisine}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Continue button */}
      <View className="px-6 pb-10">
        <Pressable
          onPress={() => onContinue(selected)}
          className="bg-red-600 rounded-lg py-3 items-center"
          accessibilityRole="button"
          accessibilityLabel="Continue to dietary preferences"
        >
          <Text className="font-[Karla_700Bold] text-base text-white">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
