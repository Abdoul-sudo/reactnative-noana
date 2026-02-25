import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/api/profiles';

/**
 * Upload a user avatar to Supabase Storage (private `avatars` bucket)
 * and update the profile's `avatar_url` column.
 *
 * @param userId  The authenticated user's ID (used for path and profile update).
 * @param imageUri  Local file URI from expo-image-picker.
 * @returns The storage path (e.g. "avatars/{userId}/avatar.jpg").
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string,
): Promise<string> {
  // 1. Read the local file as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Determine file extension from the URI (with validation for Android content:// URIs)
  const VALID_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
  const rawExt = imageUri.split('.').pop()?.toLowerCase();
  const ext = rawExt && VALID_IMAGE_EXTS.includes(rawExt) ? rawExt : 'jpg';
  const path = `avatars/${userId}/avatar.${ext}`;
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  // 3. Upload to Supabase Storage — upsert to overwrite any previous avatar
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, decode(base64), { contentType, upsert: true });

  if (uploadError) throw uploadError;

  // 4. Save the path in the profile row
  await updateProfile(userId, { avatar_url: path });

  return path;
}

/**
 * Get a signed URL for a private avatar path.
 * Returns undefined if no path is provided.
 */
export async function getAvatarSignedUrl(
  avatarPath: string | null,
): Promise<string | undefined> {
  if (!avatarPath) return undefined;

  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(avatarPath, 3600); // 1 hour expiry

  if (error) return undefined;
  return data.signedUrl;
}
