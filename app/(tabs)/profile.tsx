import { Pressable, ScrollView, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  User,
  UserCog,
  MapPin,
  Award,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { fetchProfile, signOut } from '@/lib/api/auth';
import { uploadAvatar, getAvatarSignedUrl } from '@/lib/storage';
import { type Profile } from '@/lib/api/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  useFocusEffect(() => {
    if (!session?.user?.id) return;
    loadProfile();
  });

  async function loadProfile() {
    if (!session?.user?.id) return;
    try {
      const p = await fetchProfile(session.user.id);
      setProfile(p);
      const url = await getAvatarSignedUrl(p.avatar_url);
      setAvatarUrl(url);
    } catch (err) {
      if (__DEV__) console.warn('[profile] fetchProfile failed:', err);
    }
  }

  async function handlePickAvatar() {
    if (!session?.user?.id) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    // Optimistic: show the local image immediately
    setAvatarUrl(uri);
    setIsUploading(true);

    try {
      const path = await uploadAvatar(session.user.id, uri);
      // Get the signed URL for the uploaded file
      const signedUrl = await getAvatarSignedUrl(path);
      if (signedUrl) setAvatarUrl(signedUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Revert optimistic update
      const url = await getAvatarSignedUrl(profile?.avatar_url ?? null);
      setAvatarUrl(url);
      Alert.alert('Error', 'Could not upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      useAuthStore.getState().reset();
    } catch {
      Alert.alert('Error', 'Could not sign out. Please try again.');
    }
  }

  const menuItems = [
    { label: 'Edit Profile', icon: UserCog, onPress: () => router.push('/profile/settings') },
    { label: 'Saved Addresses', icon: MapPin, onPress: () => router.push('/profile/addresses') },
    { label: 'Rewards', icon: Award, onPress: () => router.push('/profile/rewards') },
    {
      label: 'Settings',
      icon: Settings,
      onPress: () => Alert.alert('Coming Soon', 'Settings will be available in a future update.'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar + Info */}
        <View className="items-center pt-6 pb-4">
          <Pressable
            onPress={handlePickAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            className="mb-3"
          >
            {avatarUrl ? (
              <Image
                source={avatarUrl}
                contentFit="cover"
                className="w-20 h-20 rounded-full bg-gray-200"
                accessibilityLabel="Profile picture"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
                <User size={32} color="#9ca3af" />
              </View>
            )}
            {isUploading && (
              <View className="absolute inset-0 w-20 h-20 rounded-full bg-black/30 items-center justify-center">
                <Text className="font-[Karla_600SemiBold] text-xs text-white">
                  Uploading...
                </Text>
              </View>
            )}
          </Pressable>

          <Text className="font-[Karla_700Bold] text-lg text-gray-900">
            {profile?.display_name ?? session?.user?.email?.split('@')[0] ?? 'User'}
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-0.5">
            {profile?.email ?? session?.user?.email ?? ''}
          </Text>
        </View>

        {/* Menu Items */}
        <View className="mt-2">
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              className="flex-row items-center px-4 py-3.5 border-b border-gray-100"
            >
              <item.icon size={20} color="#6b7280" />
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-900 flex-1 ml-3">
                {item.label}
              </Text>
              <ChevronRight size={18} color="#9ca3af" />
            </Pressable>
          ))}
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          className="flex-row items-center px-4 py-3.5 mt-6"
        >
          <LogOut size={20} color="#dc2626" />
          <Text className="font-[Karla_600SemiBold] text-sm text-red-600 ml-3">
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
