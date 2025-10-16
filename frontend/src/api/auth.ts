// ClubQore Authentication API

import type { 
  AuthUser, 
  SignInData, 
  SimpleSignUpData,
  UserRolesResponse,
  UpdateRoleRequest,
  AssignRoleRequest
} from '../types/auth';
import { tokenManager as secureTokenManager } from './secureAuth';
import { apiClient } from './base';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Use the secure token manager with JWT expiration support
export const tokenManager = secureTokenManager;

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (data: SimpleSignUpData): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> => {
    const response = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    
    // Store tokens
    tokenManager.setTokens(result.accessToken, result.refreshToken);
    
    // Transform backend user to frontend AuthUser format
    const user: AuthUser = {
      id: result.user.id.toString(),
      email: result.user.email,
      primaryRole: result.user.primaryRole || 'club_manager',
      isOnboarded: result.user.isOnboarded || false,
      emailVerified: result.user.emailVerified || false,
      emailVerifiedAt: result.user.emailVerifiedAt,
      created_at: result.user.created_at,
      updated_at: result.user.updated_at,
      clubId: result.user.clubId,
    };

    return { user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  },

  // Login user
  login: async (data: SignInData): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    
    // Store tokens
    tokenManager.setTokens(result.accessToken, result.refreshToken);
    
    // Transform backend user to frontend AuthUser format
    const user: AuthUser = {
      id: result.user.id.toString(),
      email: result.user.email,
      primaryRole: result.user.primaryRole || 'club_manager',
      isOnboarded: result.user.isOnboarded || false,
      emailVerified: result.user.emailVerified || false,
      emailVerifiedAt: result.user.emailVerifiedAt,
      created_at: result.user.created_at,
      updated_at: result.user.updated_at,
      clubId: result.user.clubId,
    };
    
    return { user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  },

  // Get current user profile
  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await apiClient('/auth/me');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user profile');
    }

    const result = await response.json();
    
    // Transform backend user to frontend AuthUser format
    const user: AuthUser = {
      id: result.user.id.toString(),
      email: result.user.email,
      primaryRole: result.user.primaryRole || 'club_manager',
      isOnboarded: result.user.isOnboarded || false,
      emailVerified: result.user.emailVerified || false,
      emailVerifiedAt: result.user.emailVerifiedAt,
      created_at: result.user.created_at,
      updated_at: result.user.updated_at,
      clubId: result.user.clubId,
    };

    return user;
  },

  // Update current user profile
  updateProfile: async (profileData: { name?: string; avatar?: string; primaryRole?: string; email?: string; password?: string }): Promise<AuthUser> => {
    const requestBody: { name?: string; avatar?: string; primaryRole?: string; email?: string; password?: string } = {};
    
    // Only include fields that are being updated
    if (profileData.name !== undefined) requestBody.name = profileData.name;
    if (profileData.avatar !== undefined) requestBody.avatar = profileData.avatar;
    if (profileData.primaryRole !== undefined) requestBody.primaryRole = profileData.primaryRole;
    if (profileData.email !== undefined) requestBody.email = profileData.email;
    if (profileData.password !== undefined) requestBody.password = profileData.password;

    const response = await apiClient('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const result = await response.json();
    
    // Transform and return updated user
    const user: AuthUser = {
      id: result.user.id.toString(),
      email: result.user.email,
      primaryRole: result.user.primaryRole || 'club_manager',
      isOnboarded: result.user.isOnboarded || false,
      emailVerified: result.user.emailVerified || false,
      emailVerifiedAt: result.user.emailVerifiedAt,
      created_at: result.user.created_at,
      updated_at: result.user.updated_at,
    };

    return user;
  },

  // Logout from current session
  logout: async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API fails
    } finally {
      tokenManager.clearTokens();
    }
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    try {
      await apiClient('/auth/logout-all', { method: 'POST', body: JSON.stringify({}) });
    } catch (error) {
      console.error('Logout all API call failed:', error);
      // Continue with local logout even if API fails
    } finally {
      tokenManager.clearTokens();
    }
  },
};

// Refresh access token
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const result = await response.json();
    tokenManager.setTokens(result.accessToken, result.refreshToken);
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Google OAuth (will need backend implementation)
export const googleAuthAPI = {
  // This would typically redirect to backend OAuth endpoint
  initiateGoogleAuth: () => {
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${API_BASE_URL}/auth/google?redirect_uri=${redirectUri}`;
  },
  
  // Handle OAuth callback (if using popup flow)
  handleGoogleCallback: async (code: string): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> => {
    const response = await apiClient('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Google auth failed');
    }

    const result = await response.json();
    tokenManager.setTokens(result.accessToken, result.refreshToken);
    
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  },
};

// Password reset
export const passwordResetAPI = {
  requestReset: async (email: string): Promise<void> => {
    const response = await apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset request failed');
    }
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    const response = await apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset failed');
    }
  },
};

// Email verification API
export const emailVerificationAPI = {
  // Check if email is available
  isEmailAvailable: async (email: string): Promise<boolean> => {
    const response = await apiClient(`/auth/is-email-available/${encodeURIComponent(email)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check email availability');
    }

    const result = await response.json();
    return result.available;
  },

  // Send email verification link
  sendVerification: async (email?: string): Promise<void> => {
    const response = await apiClient('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send verification email');
    }
  },

  // Confirm email verification with token
  confirmVerification: async (token: string): Promise<AuthUser> => {
    const response = await apiClient('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Email verification failed');
    }

    const result = await response.json();
    
    // Transform and return updated user
    const user: AuthUser = {
      id: result.user.id.toString(),
      email: result.user.email,
      primaryRole: result.user.primaryRole || 'club_manager',
      isOnboarded: result.user.isOnboarded || false,
      emailVerified: result.user.emailVerified || false,
      emailVerifiedAt: result.user.emailVerifiedAt,
      created_at: result.user.created_at,
      updated_at: result.user.updated_at,
    };

    return user;
  },

  // Resend verification email
  resendVerification: async (email: string | undefined): Promise<number> => {
    const response = await apiClient('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 429) {
        throw new Error(`Too many requests. Please try again later.`);
      }
      throw new Error(error.error || 'Failed to resend verification email');
    }
    return response.status; // Return status code for success
  },
};

// Role management API
export const roleAPI = {
  // Get user's roles (updated endpoint)
  getUserRoles: async (): Promise<UserRolesResponse> => {
    const response = await apiClient('/users/roles');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user roles');
    }

    return response.json();
  },

  // Update user's primary role
  updatePrimaryRole: async (primaryRole: UpdateRoleRequest['primaryRole']): Promise<{ message: string; user: AuthUser }> => {
    const response = await apiClient('/users/roles', {
      method: 'PUT',
      body: JSON.stringify({ primaryRole }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update primary role');
    }

    return response.json();
  },

  // Assign role to user (admin only)
  assignRole: async (userId: number, role: AssignRoleRequest['role']): Promise<{ message: string; user: AuthUser }> => {
    const response = await apiClient('/users/roles/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 403) {
        throw new Error('Insufficient permissions to assign roles');
      }
      throw new Error(error.error || 'Failed to assign role');
    }

    return response.json();
  },
};

// Health check API
export const healthAPI = {
  // Check backend health
  check: async (): Promise<{ status: string; timestamp: string; version: string }> => {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  },
};
