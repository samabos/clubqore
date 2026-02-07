// Email Verification API
import { apiClient } from './base';

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
      body: email ? JSON.stringify({ email }) : JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send verification email');
    }
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<{ user: unknown }> => {
    const response = await apiClient('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Email verification failed');
    }

    return await response.json();
  },
};