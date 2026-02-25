import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { fetchProfile } from '@/lib/api/auth';
import { updateProfile } from '@/lib/api/profiles';
import { supabase } from '@/lib/supabase';
import {
  profileSchema,
  passwordChangeSchema,
  type ProfileFormData,
  type PasswordChangeFormData,
} from '@/lib/schemas/profile';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // ── Profile form ────────────────────────────────────────────────────
  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: '', email: '' },
  });

  // ── Password form ──────────────────────────────────────────────────
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // Load current profile data into form
  useEffect(() => {
    if (!session?.user?.id) return;
    fetchProfile(session.user.id)
      .then((p) => {
        setProfileValue('display_name', p.display_name ?? '');
        setProfileValue('email', p.email ?? session.user.email ?? '');
      })
      .catch((err) => {
        if (__DEV__) console.warn('[settings] fetchProfile failed:', err);
        Alert.alert('Error', 'Could not load profile data.');
      });
  }, [session?.user?.id]);

  async function onSaveProfile(data: ProfileFormData) {
    if (!session?.user?.id) return;
    setIsSavingProfile(true);
    try {
      // Update profile table
      await updateProfile(session.user.id, {
        display_name: data.display_name,
        email: data.email,
      });
      // Sync email with Supabase Auth so login credentials stay in sync
      const { error: authError } = await supabase.auth.updateUser({
        email: data.email,
      });
      if (authError) throw authError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onChangePassword(data: PasswordChangeFormData) {
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetPassword();
      Alert.alert('Success', 'Password changed.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="font-[Karla_700Bold] text-lg text-gray-900 ml-3">
            Edit Profile
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        >
          {/* ── Section: Profile Info ──────────────────────────────── */}
          <Text className="font-[Karla_700Bold] text-sm text-gray-900 mb-3">
            Profile Information
          </Text>

          {/* Display Name */}
          <Text className="font-[Karla_600SemiBold] text-xs text-gray-500 mb-1">
            Display Name
          </Text>
          <Controller
            control={profileControl}
            name="display_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-2.5 font-[Karla_400Regular] text-sm text-gray-900"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Your name"
                autoCapitalize="words"
              />
            )}
          />
          {profileErrors.display_name && (
            <Text className="font-[Karla_400Regular] text-xs text-red-600 mt-1">
              {profileErrors.display_name.message}
            </Text>
          )}

          {/* Email */}
          <Text className="font-[Karla_600SemiBold] text-xs text-gray-500 mb-1 mt-4">
            Email
          </Text>
          <Controller
            control={profileControl}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-2.5 font-[Karla_400Regular] text-sm text-gray-900"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {profileErrors.email && (
            <Text className="font-[Karla_400Regular] text-xs text-red-600 mt-1">
              {profileErrors.email.message}
            </Text>
          )}

          {/* Save Profile Button */}
          <Pressable
            onPress={handleProfileSubmit(onSaveProfile)}
            disabled={isSavingProfile}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
            className="bg-red-600 rounded-lg py-3 mt-5 items-center"
            style={isSavingProfile ? { opacity: 0.6 } : undefined}
          >
            <Text className="font-[Karla_700Bold] text-sm text-white">
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Text>
          </Pressable>

          {/* ── Section: Change Password ──────────────────────────── */}
          <Text className="font-[Karla_700Bold] text-sm text-gray-900 mb-3 mt-8">
            Change Password
          </Text>

          {/* New Password */}
          <Text className="font-[Karla_600SemiBold] text-xs text-gray-500 mb-1">
            New Password
          </Text>
          <Controller
            control={passwordControl}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-2.5 font-[Karla_400Regular] text-sm text-gray-900"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Min. 8 characters"
                secureTextEntry
              />
            )}
          />
          {passwordErrors.newPassword && (
            <Text className="font-[Karla_400Regular] text-xs text-red-600 mt-1">
              {passwordErrors.newPassword.message}
            </Text>
          )}

          {/* Confirm Password */}
          <Text className="font-[Karla_600SemiBold] text-xs text-gray-500 mb-1 mt-4">
            Confirm Password
          </Text>
          <Controller
            control={passwordControl}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-2.5 font-[Karla_400Regular] text-sm text-gray-900"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Re-enter password"
                secureTextEntry
              />
            )}
          />
          {passwordErrors.confirmPassword && (
            <Text className="font-[Karla_400Regular] text-xs text-red-600 mt-1">
              {passwordErrors.confirmPassword.message}
            </Text>
          )}

          {/* Change Password Button */}
          <Pressable
            onPress={handlePasswordSubmit(onChangePassword)}
            disabled={isSavingPassword}
            accessibilityRole="button"
            accessibilityLabel="Change password"
            className="border border-red-600 rounded-lg py-3 mt-5 items-center"
            style={isSavingPassword ? { opacity: 0.6 } : undefined}
          >
            <Text className="font-[Karla_700Bold] text-sm text-red-600">
              {isSavingPassword ? 'Changing...' : 'Change Password'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
