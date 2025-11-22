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
  accessToken: string;
  refreshToken: string;
}

/**
 * Centralized Authentication Service
 * This is the SINGLE source of truth for all authentication operations
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
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();
    
    // Store tokens
    if (data.accessToken && data.refreshToken) {
      console.log('🔐 Storing tokens after login');
      tokenManager.setTokens(data.accessToken, data.refreshToken);
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
      throw new Error(errorData.message || "Registration failed");
    }

    const data = await response.json();
    
    // Store tokens
    if (data.accessToken && data.refreshToken) {
      console.log('🔐 Storing tokens after registration');
      tokenManager.setTokens(data.accessToken, data.refreshToken);
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
      throw new Error(errorData.message || "Failed to get current user");
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Logout user
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
      // Always clear tokens, even if API call fails
      console.log('🔐 Clearing tokens after logout');
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
      throw new Error(errorData.message || "Failed to send reset email");
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
      throw new Error(errorData.message || "Failed to send verification email");
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
      throw new Error(errorData.message || "Profile update failed");
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Token refresh failed");
    }

    return await response.json();
  }
}

// Export single instance
export const authService = new AuthService();