import { apiClient } from "@/api/base";
import { tokenManager } from "@/api/secureAuth";
import { AuthUser, ClubManagerSignUpData, RegistrationSuccessResponse } from "@/types/auth";
import { Address } from "@/types/common";

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

// Custom error class to include error code
export class AuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
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
      let errorMessage = "Login failed";
      let errorCode: string | undefined;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorCode = errorData.code;
      } catch {
        // Response is not JSON (e.g., 502 Bad Gateway)
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new AuthError(errorMessage, errorCode);
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
   * Register a new club manager with club
   * Returns success without tokens - user must verify email first
   */
  async signUpClubManager(userData: ClubManagerSignUpData): Promise<RegistrationSuccessResponse> {
    // Format the address if it's an object
    let clubAddress: string | Address | undefined = userData.clubAddress;
    if (typeof clubAddress === 'object' && clubAddress !== null) {
      // Keep as structured object for backend
      clubAddress = userData.clubAddress as Address;
    }

    const response = await apiClient("/auth/register/club-manager", {
      method: "POST",
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || undefined,
        clubName: userData.clubName,
        clubAddress: clubAddress || undefined,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Registration failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Resend verification email (public - no auth required)
   */
  async resendVerificationPublic(email: string): Promise<void> {
    const response = await apiClient("/auth/resend-verification-public", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to send verification email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
    }
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
      let errorMessage = "Registration failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
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
      let errorMessage = "Failed to get current user";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
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
      let errorMessage = "Failed to send reset email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
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
      let errorMessage = "Failed to reset password";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
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
      let errorMessage = "Failed to send verification email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
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
      let errorMessage = "Profile update failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
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
      let errorMessage = "Token refresh failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (response.status === 502) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      throw new Error(errorMessage);
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
