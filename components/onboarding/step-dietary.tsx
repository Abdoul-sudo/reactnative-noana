import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { chipContainerStyles, chipTextStyles } from './chip-styles';

// From architecture AR29 — fixed list
const DIETARY = ['Vegan', 'Halal', 'Gluten-free', 'Keto'];

interface StepDietaryProps {
  onDone: (dietary: string[]) => void;
  onSkip: () => void;
}

export function StepDietary({ onDone, onSkip }: StepDietaryProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <View className="flex-1 bg-red-50">
      {/* Skip — top right */}
      <View className="flex-row justify-end px-6 pt-4">
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip dietary preferences"
        >
          <Text className="font-[Karla_500Medium] text-sm text-gray-500">Skip</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6">
        <Text className="font-[PlayfairDisplaySC_700Bold] text-2xl text-gray-900 text-center">
          Dietary Preferences
        </Text>
        <Text className="font-[Karla_400Regular] text-base text-gray-600 text-center mt-2">
          We'll filter restaurants for you
        </Text>

        {/* Chip grid */}
        <View className="flex-row flex-wrap gap-3 mt-8 justify-center">
          {DIETARY.map((tag) => {
            const isSelected = selected.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggle(tag)}
                className={chipContainerStyles[isSelected ? 'active' : 'inactive']}
                accessibilityRole="button"
                accessibilityLabel={tag}
                accessibilityState={{ selected: isSelected }}
              >
                <Text className={chipTextStyles[isSelected ? 'active' : 'inactive']}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Done button */}
      <View className="px-6 pb-10">
        <Pressable
          onPress={() => onDone(selected)}
          className="bg-red-600 rounded-lg py-3 items-center"
          accessibilityRole="button"
          accessibilityLabel="Complete onboarding"
        >
          <Text className="font-[Karla_700Bold] text-base text-white">Done</Text>
        </Pressable>
      </View>
    </View>
  );
}
