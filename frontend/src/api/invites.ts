// ClubQore Invites API
// Updated to match actual backend implementation

import { apiClient } from './base';

// Invite types matching backend
export interface InviteCodeValidation {
  valid: boolean;
  club?: {
    id: string;
    name: string;
    clubType: string;
    description?: string;
    logoUrl?: string;
    memberCount: number;
  };
  role?: string;
  expires_at?: string;
  remaining_uses?: number;
  message?: string;
  errorCode?: 'CODE_NOT_FOUND' | 'CODE_EXPIRED' | 'USAGE_LIMIT_REACHED' | 'CODE_INACTIVE';
}

export interface InviteCodePreview {
  valid: boolean;
  club?: {
    id: string;
    name: string;
    clubType: string;
    description?: string;
    logoUrl?: string;
    memberCount: number;
  };
  userCanJoin: boolean; // Note: This is the correct property name, not "canJoin"
  alreadyMember: boolean;
  message: string;
}

export interface ValidateInviteRequest {
  code: string;
}

export interface PreviewInviteRequest {
  code: string;
}

// Invites API functions
export const invitesAPI = {
  // Validate invite code - basic validation without preview
  validateCode: async (code: string): Promise<InviteCodeValidation> => {
    const response = await apiClient('/invites/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to validate invite code');
    }

    return response.json();
  },

  // Preview club information before joining (without using the code)
  previewCode: async (code: string): Promise<InviteCodePreview> => {
    const response = await apiClient('/invites/preview', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to preview invite code');
    }

    return response.json();
  },

  // Use invite code during onboarding (integrated into onboarding flow)
  // This is handled in the onboarding API by including clubInviteCode in memberData
};
