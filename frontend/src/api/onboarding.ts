// ClubQore Onboarding API
// Updated to match actual backend implementation based on OpenAPI spec

import { UserProfile, UserPreferences } from '@/types/auth.ts';
import { apiClient } from './base.ts';
import { Club } from '@/types/club.ts';

// Types matching the actual backend responses
export interface OnboardingCompleteRequest {
  role: 'club_manager';
  personalData?: UserProfile;
  clubData?: Club;
  preferences?: UserPreferences;
}

export interface OnboardingCompleteResponse {
  success: boolean;
  accountNumber: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    primaryRole: string;
    isOnboarded: boolean;
  };
  message: string;
}

export interface UserStatusResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    primaryRole: string;
    isOnboarded: boolean;
  };
  accounts: Array<{
    accountNumber: string;
    role: 'club_manager';
    isActive: boolean;
    onboardingCompleted: boolean;
    completedAt?: string;
    clubId?: string;
    clubName?: string;
    clubType?: string;
    metadata?: Record<string, unknown>;
  }>;
  availableRoles: Array<'club_manager'>;
}

export interface ProfileCompletionResponse {
  overallProgress: number;
  profileCompletion: {
    completed: boolean;
    progress: number;
    missingFields: Array<{
      field: string;
      required: boolean;
      description: string;
    }>;
  };
  roleCompletion: Array<{
    role: string;
    completed: boolean;
    progress: number;
    missingSteps: Array<{
      step: string;
      required: boolean;
      description: string;
    }>;
  }>;
  preferencesSet: boolean;
  nextSteps: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface UpdateCompletionRequest {
  step: string;
  role?: string;
}

export interface UpdateCompletionResponse {
  success: boolean;
  newProgress: number;
  completedStep: string;
  nextSuggestion?: string;
}

// Onboarding API functions
export const onboardingAPI = {
  // Complete initial onboarding (first role setup)
  completeOnboarding: async (data: OnboardingCompleteRequest): Promise<OnboardingCompleteResponse> => {
    const response = await apiClient('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete onboarding');
    }

    return response.json();
  },

  // Add additional role to existing user
  addRole: async (data: OnboardingCompleteRequest): Promise<OnboardingCompleteResponse> => {
    const response = await apiClient('/onboarding/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add role');
    }

    return response.json();
  },

  // Get comprehensive user status (replaces getUserRoles)
  getUserStatus: async (): Promise<UserStatusResponse> => {
    const response = await apiClient('/onboarding/status');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user status');
    }

    return response.json();
  },

  // Get detailed onboarding progress
  getProgress: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient('/onboarding/progress');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get onboarding progress');
    }

    return response.json();
  },

  // Set primary role
  setPrimaryRole: async (role: 'club_manager'): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient('/onboarding/primary-role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set primary role');
    }

    return response.json();
  },

  // Deactivate role
  deactivateRole: async (role: 'club_manager', clubId?: number): Promise<{ success: boolean; message?: string }> => {
    const url = `/onboarding/roles/${role}${clubId ? `?clubId=${clubId}` : ''}`;
    const response = await apiClient(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deactivate role');
    }

    return response.json();
  },

  // Get profile completion status
  getProfileCompletion: async (): Promise<ProfileCompletionResponse> => {
    const response = await apiClient('/onboarding/completion');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get profile completion');
    }

    return response.json();
  },

  // Get profile completion status for specific user (admin function)
  getUserProfileCompletion: async (userId: string): Promise<ProfileCompletionResponse> => {
    const response = await apiClient(`/onboarding/completion/${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user profile completion');
    }

    return response.json();
  },

  // Update completion progress tracking
  updateCompletionProgress: async (data: UpdateCompletionRequest): Promise<UpdateCompletionResponse> => {
    const response = await apiClient('/onboarding/completion/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update completion progress');
    }

    return response.json();
  },
};
