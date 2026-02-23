import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useState } from 'react';

interface StepLocationProps {
  onGrant: () => void;
  onSkip: () => void;
}

export function StepLocation({ onGrant, onSkip }: StepLocationProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      // Request permission — advance regardless of whether granted or denied.
      // We do NOT store GPS coordinates; this just prompts the system dialog.
      await Location.requestForegroundPermissionsAsync();
    } finally {
      setIsRequesting(false);
      onGrant();
    }
  };

  return (
    <View className="flex-1 bg-red-50">
      {/* Skip — top right */}
      <View className="flex-row justify-end px-6 pt-4">
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip location permission"
        >
          <Text className="font-[Karla_500Medium] text-sm text-gray-500">Skip</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        <MapPin size={64} color="#dc2626" />
        <Text className="font-[PlayfairDisplaySC_700Bold] text-2xl text-gray-900 text-center mt-6">
          Enable Location
        </Text>
        <Text className="font-[Karla_400Regular] text-base text-gray-600 text-center mt-3">
          Find restaurants near you and get personalized recommendations based on where you are.
        </Text>

        <Pressable
          onPress={handleAllow}
          disabled={isRequesting}
          className="bg-red-600 rounded-lg py-3 px-8 mt-10 w-full items-center disabled:opacity-50"
          accessibilityRole="button"
          accessibilityLabel="Allow location access"
        >
          {isRequesting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-[Karla_700Bold] text-base text-white">
              Allow Location
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
