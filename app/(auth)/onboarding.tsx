import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as SecureStore from 'expo-secure-store';

import { updateProfile } from '@/lib/api/profiles';
import { useAuthStore } from '@/stores/auth-store';
import { StepLocation } from '@/components/onboarding/step-location';
import { StepCuisines } from '@/components/onboarding/step-cuisines';
import { StepDietary } from '@/components/onboarding/step-dietary';

type Step = 0 | 1 | 2;

export default function OnboardingScreen() {
  const { session, setOnboardingCompleted } = useAuthStore();

  const [step, setStep] = useState<Step>(0);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reanimated fade + slide transition between steps
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  // Skip the fade-in effect on initial mount (step = 0 starts fully visible).
  const isFirstRender = useRef(true);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  // After React re-renders the new step, slide it in from the right.
  // Running fade-in here (instead of inside the worklet callback) guarantees
  // the new component is mounted before the animation begins — otherwise
  // the incoming step would fade in while the outgoing content is still visible.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    translateX.value = 40;
    opacity.value = withTiming(1, { duration: 180 });
    translateX.value = withTiming(0, { duration: 180 });
  }, [step]);

  const goToStep = (nextStep: Step) => {
    // Fade + slide out current step; on completion, swap the step.
    // The useEffect above then handles the fade-in once React has re-rendered.
    opacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(setStep)(nextStep);
    });
  };

  // Called when all steps complete or skipped.
  // Saves preferences to DB, sets completion flag, updates store.
  // The auth guard in _layout.tsx detects onboardingCompleted = true
  // and redirects to (tabs) — we do NOT navigate directly (AR19).
  const handleDone = async (dietary: string[]) => {
    const userId = session?.user.id;
    if (!userId) return;

    setIsLoading(true);
    setError('');
    try {
      await updateProfile(userId, {
        cuisine_preferences: cuisines,
        dietary_preferences: dietary,
        onboarding_completed: true,
      });
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      setOnboardingCompleted(true); // triggers auth guard → router.replace('/(tabs)')
      // isLoading left true intentionally — the guard navigates away immediately,
      // so the spinner stays visible during the transition rather than flashing
      // the form back for one frame. No cleanup needed.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-red-50 items-center justify-center">
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="font-[Karla_400Regular] text-base text-gray-600 mt-4">
          Saving your preferences…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-red-50">
      {error !== '' && (
        <View className="bg-red-100 rounded-lg mx-6 mt-4 p-3">
          <Text className="font-[Karla_400Regular] text-red-600 text-sm text-center">
            {error}
          </Text>
        </View>
      )}

      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {step === 0 && (
          <StepLocation
            onGrant={() => goToStep(1)}
            onSkip={() => goToStep(1)}
          />
        )}
        {step === 1 && (
          <StepCuisines
            onContinue={(selected) => {
              setCuisines(selected);
              goToStep(2);
            }}
            onSkip={() => goToStep(2)}
          />
        )}
        {step === 2 && (
          <StepDietary
            onDone={handleDone}
            onSkip={() => handleDone([])}
          />
        )}
      </Animated.View>
    </View>
  );
}
