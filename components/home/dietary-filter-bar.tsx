import { ScrollView, Pressable, Text } from 'react-native';
import { DIETARY_TAGS, type DietaryTag } from '@/constants/dietary';

interface DietaryFilterBarProps {
  activeFilters: Set<DietaryTag>;
  onToggle: (tag: DietaryTag) => void;
}

export function DietaryFilterBar({ activeFilters, onToggle }: DietaryFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-2"
    >
      {DIETARY_TAGS.map(({ id, label }) => {
        const active = activeFilters.has(id);
        return (
          <Pressable
            key={id}
            onPress={() => onToggle(id)}
            accessibilityRole="button"
            accessibilityLabel={`${label} filter, ${active ? 'active' : 'inactive'}`}
            accessibilityState={{ selected: active }}
            className={
              active
                ? 'px-4 py-2.5 rounded-full border bg-red-600 border-red-600'
                : 'px-4 py-2.5 rounded-full border bg-white border-red-200'
            }
          >
            <Text
              className={
                active
                  ? 'font-[Karla_600SemiBold] text-sm text-white'
                  : 'font-[Karla_600SemiBold] text-sm text-gray-600'
              }
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
