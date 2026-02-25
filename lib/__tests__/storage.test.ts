// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// Mock base64-arraybuffer
jest.mock('base64-arraybuffer', () => ({
  decode: jest.fn((b64: string) => new ArrayBuffer(8)),
}));

// Mock Supabase storage
const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// Mock profiles API
jest.mock('@/lib/api/profiles', () => ({
  updateProfile: jest.fn(),
}));

import * as FileSystem from 'expo-file-system';
import { uploadAvatar, getAvatarSignedUrl } from '@/lib/storage';
import { updateProfile } from '@/lib/api/profiles';
import { supabase } from '@/lib/supabase';

const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.MockedFunction<
  typeof FileSystem.readAsStringAsync
>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('uploadAvatar', () => {
  it('uploads file and updates profile with correct path', async () => {
    mockReadAsStringAsync.mockResolvedValue('base64data');
    mockUpload.mockResolvedValue({ error: null });
    mockUpdateProfile.mockResolvedValue(undefined);

    const path = await uploadAvatar('user-123', '/local/image.jpg');

    expect(path).toBe('avatars/user-123/avatar.jpg');
    expect(mockReadAsStringAsync).toHaveBeenCalledWith('/local/image.jpg', {
      encoding: 'base64',
    });
    expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
    expect(mockUpload).toHaveBeenCalledWith(
      'avatars/user-123/avatar.jpg',
      expect.any(ArrayBuffer),
      { contentType: 'image/jpeg', upsert: true },
    );
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', {
      avatar_url: 'avatars/user-123/avatar.jpg',
    });
  });

  it('uses jpeg content type for .jpg extension', async () => {
    mockReadAsStringAsync.mockResolvedValue('data');
    mockUpload.mockResolvedValue({ error: null });
    mockUpdateProfile.mockResolvedValue(undefined);

    await uploadAvatar('user-1', '/photo.jpg');

    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'image/jpeg' }),
    );
  });

  it('uses png content type for .png extension', async () => {
    mockReadAsStringAsync.mockResolvedValue('data');
    mockUpload.mockResolvedValue({ error: null });
    mockUpdateProfile.mockResolvedValue(undefined);

    await uploadAvatar('user-1', '/photo.png');

    expect(mockUpload).toHaveBeenCalledWith(
      'avatars/user-1/avatar.png',
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'image/png' }),
    );
  });

  it('throws on upload error', async () => {
    mockReadAsStringAsync.mockResolvedValue('data');
    mockUpload.mockResolvedValue({ error: new Error('Upload failed') });

    await expect(uploadAvatar('user-1', '/img.jpg')).rejects.toThrow('Upload failed');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });
});

describe('getAvatarSignedUrl', () => {
  it('returns signed URL for valid path', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed' },
      error: null,
    });

    const url = await getAvatarSignedUrl('avatars/user-1/avatar.jpg');

    expect(url).toBe('https://storage.example.com/signed');
    expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('avatars/user-1/avatar.jpg', 3600);
  });

  it('returns undefined for null path', async () => {
    const url = await getAvatarSignedUrl(null);
    expect(url).toBeUndefined();
  });

  it('returns undefined on error', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    });

    const url = await getAvatarSignedUrl('bad/path');
    expect(url).toBeUndefined();
  });
});
