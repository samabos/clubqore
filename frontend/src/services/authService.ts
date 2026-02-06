import { apiClient } from "@/api/base";
import { tokenManager } from "@/api/secureAuth";
import { AuthUser } from "@/types/auth";

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

// Check if using httpOnly cookies
const isUsingHttpOnlyCookies = () => tokenManager.getStorageStrategy() === 'httpOnly';

/**
 * Centralized Authentication Service
 * This is the SINGLE source of truth for all authentication operations
 * Supports both httpOnly cookies (browser) and Bearer tokens (mobile/API)
 */
export class AuthService {
  /**
   * Sign in user with email and password
   */
  async signIn(credentials: SignInData): Promise<AuthResponse> {
    const response = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Login failed");
    }

    const data = await response.json();

    // Store tokens only if not using httpOnly cookies
    // Server sets cookies automatically for browser clients
    if (!isUsingHttpOnlyCookies() && data.accessToken && data.refreshToken) {
      tokenManager.setTokens(data.accessToken, data.refreshToken);
    } else if (isUsingHttpOnlyCookies() && data.accessToken) {
      // For httpOnly, store metadata only for expiration tracking
      tokenManager.setTokens(data.accessToken, data.refreshToken || '');
    }

    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    };
  }

  /**
   * Register new user
   */
  async signUp(userData: SignUpData): Promise<AuthResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...signUpData } = userData;

    const response = await apiClient("/auth/register", {
      method: "POST",
      body: JSON.stringify(signUpData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Registration failed");
    }

    const data = await response.json();

    // Store tokens only if not using httpOnly cookies
    if (!isUsingHttpOnlyCookies() && data.accessToken && data.refreshToken) {
      tokenManager.setTokens(data.accessToken, data.refreshToken);
    } else if (isUsingHttpOnlyCookies() && data.accessToken) {
      tokenManager.setTokens(data.accessToken, data.refreshToken || '');
    }

    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    };
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient("/auth/me");

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to get current user");
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Logout user
   * Server clears httpOnly cookies automatically
   */
  async logout(): Promise<void> {
    try {
      const response = await apiClient("/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Logout API failed:', errorData.message);
      }
    } catch (error) {
      console.warn('Logout API error:', error);
    } finally {
      // Clear local token data (server clears httpOnly cookies)
      tokenManager.clearTokens();
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const response = await apiClient("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to send reset email");
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password: newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to reset password");
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<number> {
    const response = await apiClient("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to send verification email");
    }

    return response.status;
  }

  /**
   * Initiate Google authentication
   */
  initiateGoogleAuth(): void {
    window.location.href = "/auth/google";
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: {
    name?: string;
    avatar?: string;
    primaryRole?: string;
    email?: string;
    password?: string;
  }): Promise<AuthUser> {
    const response = await apiClient("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Profile update failed");
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Refresh access token
   * For httpOnly cookies, server reads refresh token from cookie
   * For Bearer tokens, we send refresh token in body
   */
  async refreshToken(refreshToken?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const body = isUsingHttpOnlyCookies() ? {} : { refreshToken };

    const response = await apiClient("/auth/refresh", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Token refresh failed");
    }

    const data = await response.json();

    // Update stored tokens if not using httpOnly cookies
    if (!isUsingHttpOnlyCookies() && data.accessToken && data.refreshToken) {
      tokenManager.setTokens(data.accessToken, data.refreshToken);
    }

    return data;
  }
}

// Export single instance
export const authService = new AuthService();
