// ClubQore Profile API
// Updated to match actual backend implementation

import { apiClient } from './base';
import { Address } from '@/types/common';

// Profile types matching backend
export interface UserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  phone?: string;
  address?: Address | string; // Support both new Address object and legacy string
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  workplace?: string;
  workPhone?: string;
  medicalInfo?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: Address | string | null; // Support both new Address object and legacy string
  workplace?: string;
  workPhone?: string;
  medicalInfo?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
}

export interface UserPreferences {
  notifications: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'members_only' | 'private';
    contact_visibility: 'public' | 'members_only' | 'private';
    activity_visibility: 'public' | 'members_only' | 'private';
  };
  communication: {
    preferred_language: string;
    timezone: string;
    communication_method: 'email' | 'sms' | 'app' | 'phone';
  };
}

export interface UserChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
  childUserId?: string;
  clubId?: string;
  clubName?: string;
  membershipCode?: string;
}

export interface AddChildRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
  childUserId?: string;
  clubId?: string;
  membershipCode?: string;
}

// Profile API functions
export const profileAPI = {
  // Get current user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient('/profile/');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get profile');
    }

    const result = await response.json();
    return result.profile;
  },

  // Get user profile by ID
  getProfileById: async (userId: string): Promise<UserProfile> => {
    const response = await apiClient(`/profile/${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get profile');
    }

    const result = await response.json();
    return result.profile;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient('/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const result = await response.json();
    return result.profile;
  },

  // Get user preferences
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient('/profile/preferences');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get preferences');
    }

    const result = await response.json();
    return result.preferences;
  },

  // Update user preferences
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await apiClient('/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update preferences');
    }

    const result = await response.json();
    return result.preferences;
  },

  // Upload and set user avatar (base64 data)
  setAvatar: async (avatarData: string): Promise<{ success: boolean; avatar_url: string }> => {
    const response = await apiClient('/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to set avatar');
    }

    return response.json();
  },

  // Get user children (for parents)
  getChildren: async (): Promise<UserChild[]> => {
    const response = await apiClient('/profile/children');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get children');
    }

    const result = await response.json();
    return result.children;
  },

  // Add child for parent user
  addChild: async (childData: AddChildRequest): Promise<UserChild[]> => {
    const response = await apiClient('/profile/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add child');
    }

    const result = await response.json();
    return result.children;
  },
};
