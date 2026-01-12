// Profile Actions - API calls and state updates
import { profileAPI, UserProfile, UpdateProfileRequest, UserPreferences } from '@/api/profile';

// Re-export types for convenience
export type { UserProfile, UpdateProfileRequest, UserPreferences };

// Fetch user profile
export async function fetchProfile(): Promise<UserProfile> {
  return profileAPI.getProfile();
}

// Update user profile
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  return profileAPI.updateProfile(data);
}

// Upload avatar
export async function uploadAvatar(avatarData: string): Promise<string> {
  const result = await profileAPI.setAvatar(avatarData);
  return result.avatar_url;
}

// Fetch user preferences
export async function fetchPreferences(): Promise<UserPreferences> {
  return profileAPI.getPreferences();
}

// Update user preferences
export async function updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
  return profileAPI.updatePreferences(preferences);
}
