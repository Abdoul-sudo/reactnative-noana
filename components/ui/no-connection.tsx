import { View, Text, Pressable } from 'react-native';
import { WifiOff } from 'lucide-react-native';

interface NoConnectionProps {
  onRetry: () => void;
}

export function NoConnection({ onRetry }: NoConnectionProps) {
  return (
    <View className="flex-1 bg-red-50 items-center justify-center px-8">
      <WifiOff size={48} color="#dc2626" />
      <Text className="font-[PlayfairDisplaySC_700Bold] text-2xl text-gray-900 text-center mt-6">
        No connection
      </Text>
      <Text className="font-[Karla_400Regular] text-base text-gray-600 text-center mt-2">
        Check your internet connection and try again.
      </Text>
      <Pressable
        onPress={onRetry}
        className="bg-red-600 rounded-lg py-3 px-8 mt-8 disabled:opacity-50"
        accessibilityRole="button"
        accessibilityLabel="Retry connection"
      >
        <Text className="font-[Karla_700Bold] text-base text-white">
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}
