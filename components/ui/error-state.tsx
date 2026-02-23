import { View, Text, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <AlertCircle size={48} color="#EF4444" />
      <Text className="font-[Karla_700Bold] text-lg text-gray-800 mt-4 text-center">
        Something went wrong
      </Text>
      <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-2 text-center leading-5">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        className="mt-6 px-6 py-3 border border-gray-300 rounded-full"
      >
        <Text className="font-[Karla_600SemiBold] text-sm text-gray-700">
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
