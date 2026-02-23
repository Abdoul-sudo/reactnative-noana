import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUp } from '@/lib/api/auth';
import { signupSchema, type SignupFormData } from '@/lib/schemas/auth';

export default function SignupScreen() {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'customer',
    },
  });

  const selectedRole = watch('role');

  // Mapping objects instead of dynamic className template literals (ANTI-8)
  const roleCardStyles = {
    active: 'flex-1 rounded-lg py-3 items-center border bg-red-600 border-red-600',
    inactive: 'flex-1 rounded-lg py-3 items-center border bg-white border-gray-300',
  };
  const roleTextStyles = {
    active: 'font-[Karla_600SemiBold] text-base text-white',
    inactive: 'font-[Karla_600SemiBold] text-base text-gray-700',
  };

  const onSubmit = handleSubmit(async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.role);
      // onAuthStateChange listener in auth-store handles redirect
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text className="font-[PlayfairDisplaySC_700Bold] text-3xl text-gray-900 text-center">
            noana
          </Text>
          <Text className="font-[Karla_400Regular] text-base text-gray-600 text-center mt-2">
            Create your account
          </Text>
        </View>

        {serverError !== '' && (
          <View className="bg-red-100 rounded-lg p-3 mb-4">
            <Text className="font-[Karla_400Regular] text-red-600 text-sm text-center">
              {serverError}
            </Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-1">
            Email
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 bg-white"
              />
            )}
          />
          {errors.email && (
            <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
              {errors.email.message}
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-1">
            Password
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Minimum 8 characters"
                secureTextEntry
                autoComplete="new-password"
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 bg-white"
              />
            )}
          />
          {errors.password && (
            <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
              {errors.password.message}
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-1">
            Confirm Password
          </Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Re-enter your password"
                secureTextEntry
                autoComplete="new-password"
                className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 bg-white"
              />
            )}
          />
          {errors.confirmPassword && (
            <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
              {errors.confirmPassword.message}
            </Text>
          )}
        </View>

        <View className="mb-6">
          <Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-2">
            I am a...
          </Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange } }) => (
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => onChange('customer')}
                  className={roleCardStyles[selectedRole === 'customer' ? 'active' : 'inactive']}
                >
                  <Text
                    className={roleTextStyles[selectedRole === 'customer' ? 'active' : 'inactive']}
                  >
                    Customer
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onChange('owner')}
                  className={roleCardStyles[selectedRole === 'owner' ? 'active' : 'inactive']}
                >
                  <Text
                    className={roleTextStyles[selectedRole === 'owner' ? 'active' : 'inactive']}
                  >
                    Restaurant Owner
                  </Text>
                </Pressable>
              </View>
            )}
          />
          {errors.role && (
            <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
              {errors.role.message}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={isLoading}
          className="bg-red-600 rounded-lg py-3 items-center disabled:opacity-50"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-[Karla_700Bold] text-base text-white">
              Create Account
            </Text>
          )}
        </Pressable>

        <View className="flex-row justify-center mt-6">
          <Text className="font-[Karla_400Regular] text-gray-600">
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="font-[Karla_700Bold] text-red-600">Log in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
