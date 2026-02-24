import { Pressable, Text, View } from 'react-native';
import { Clock, X, Trash2 } from 'lucide-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

type SwipeableRecentItemProps = {
  label: string;
  onPress: () => void;
  onRemove: () => void;
};

function RightAction() {
  return (
    <View className="bg-red-500 justify-center items-center px-5">
      <Trash2 size={18} color="#ffffff" />
    </View>
  );
}

export function SwipeableRecentItem({ label, onPress, onRemove }: SwipeableRecentItemProps) {
  const reduceMotion = useReducedMotion();

  const row = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Recent search: ${label}`}
      className="flex-row items-center bg-white py-3 px-1"
    >
      <Clock size={16} color="#6b7280" />
      <Text className="font-[Karla_400Regular] text-sm text-gray-700 ml-2.5 flex-1" numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label} from recent searches`}
        className="p-2"
        hitSlop={8}
      >
        <X size={14} color="#9ca3af" />
      </Pressable>
    </Pressable>
  );

  if (reduceMotion) return row;

  return (
    <ReanimatedSwipeable
      renderRightActions={RightAction}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableOpen={onRemove}
    >
      {row}
    </ReanimatedSwipeable>
  );
}
