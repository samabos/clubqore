// Base API client configuration
import { tokenManager } from './secureAuth';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to handle session expiration - clears auth state and redirects
const handleSessionExpired = () => {
  tokenManager.clearTokens();
  useAuthStore.getState().clearAuth();
  sessionStorage.setItem('auth_redirect_reason', 'session_expired');
  window.location.href = '/auth';
};

// Check if using httpOnly cookies (browser handles auth automatically)
const isUsingHttpOnlyCookies = () => tokenManager.getStorageStrategy() === 'httpOnly';

// API client with auth headers and automatic token refresh
export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const usingCookies = isUsingHttpOnlyCookies();
  const token = usingCookies ? null : tokenManager.getAccessToken();

  const config: RequestInit = {
    // Include credentials for httpOnly cookie support
    credentials: 'include',
    headers: {
      // Only set Content-Type for requests that have a body
      ...(options.body && { 'Content-Type': 'application/json' }),
      // Only add Bearer token if not using httpOnly cookies
      ...(token && !usingCookies && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Handle token refresh on 401
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry request - cookies will be sent automatically, or use new Bearer token
        const newToken = usingCookies ? null : tokenManager.getAccessToken();
        config.headers = {
          ...config.headers,
          ...(newToken && !usingCookies && { Authorization: `Bearer ${newToken}` }),
        };
        return fetch(url, config);
      } else {
        // Refresh failed - clear auth state and redirect to login
        handleSessionExpired();
        throw new Error('Session expired');
      }
    }

    // 403 = Permission denied - let it pass through to show Access Denied page
    // Backend uses 401 for session errors, 403 only for permission errors

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Refresh access token helper
const refreshAccessToken = async (): Promise<boolean> => {
  const usingCookies = isUsingHttpOnlyCookies();
  const refreshToken = usingCookies ? null : tokenManager.getRefreshToken();

  // If using cookies, we don't need the token in the body - server reads from cookie
  // If using Bearer tokens, we need to send the refresh token

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Send cookies
      headers: { 'Content-Type': 'application/json' },
      // Only send body if not using httpOnly cookies
      ...(refreshToken && !usingCookies && { body: JSON.stringify({ refreshToken }) }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();

    // If not using cookies, store the tokens from response body
    if (!usingCookies && result.accessToken && result.refreshToken) {
      tokenManager.setTokens(result.accessToken, result.refreshToken);
    }

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};
