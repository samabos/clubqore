import { useEffect } from 'react';
import { useAuth } from '@/stores/authStore';
import { tokenManager } from '@/api/secureAuth';

export interface UseTokenManagerReturn {
  // Token state
  hasToken: boolean;
  tokenExpiresAt: number | null;
  isTokenExpiringSoon: boolean;
  tokenExpiresIn: number;
  tokenExpiresInMinutes: number;
  
  // Token actions
  refreshToken: () => Promise<void>;
  checkTokenValidity: () => boolean;
  
  // Token utilities
  getTokenClaims: () => Record<string, unknown> | null;
  isTokenValid: () => boolean;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

/**
 * Advanced Token Management Hook
 * 
 * This hook provides detailed token management capabilities
 * including automatic refresh, expiration monitoring, and token utilities.
 */
export function useTokenManager(): UseTokenManagerReturn {
  const auth = useAuth();

  // Initialize token state on mount
  useEffect(() => {
    auth.updateTokenState();
  }, [auth]);

  // Auto-refresh setup
  useEffect(() => {
    if (auth.isAuthenticated && auth.hasToken) {
      auth.startTokenRefresh();
    }

    return () => {
      auth.stopTokenRefresh();
    };
  }, [auth]);

  // Token warning effect
  useEffect(() => {
    if (auth.isTokenExpiringSoon) {
      console.warn('🔔 Token is expiring soon! Consider refreshing.');
    }
  }, [auth.isTokenExpiringSoon]);

  const getTokenClaims = () => {
    return tokenManager.getTokenClaims();
  };

  const isTokenValid = () => {
    return tokenManager.isTokenValid();
  };

  return {
    // Token state
    hasToken: auth.hasToken,
    tokenExpiresAt: auth.tokenExpiresAt,
    isTokenExpiringSoon: auth.isTokenExpiringSoon,
    tokenExpiresIn: auth.tokenExpiresIn,
    tokenExpiresInMinutes: auth.tokenExpiresInMinutes,
    
    // Token actions
    refreshToken: auth.refreshToken,
    checkTokenValidity: auth.checkTokenValidity,
    
    // Token utilities
    getTokenClaims,
    isTokenValid,
    startAutoRefresh: auth.startTokenRefresh,
    stopAutoRefresh: auth.stopTokenRefresh,
  };
}

/**
 * Token Expiration Warning Hook
 * 
 * Shows warnings when token is about to expire
 */
export function useTokenExpirationWarning(warningMinutes: number = 5) {
  const { tokenExpiresInMinutes, isTokenExpiringSoon } = useTokenManager();

  useEffect(() => {
    if (isTokenExpiringSoon && tokenExpiresInMinutes <= warningMinutes) {
      console.warn(`🔔 Token expires in ${tokenExpiresInMinutes} minutes!`);
      
      // You can add toast notifications here
      // toast.warning(`Session expires in ${tokenExpiresInMinutes} minutes`);
    }
  }, [isTokenExpiringSoon, tokenExpiresInMinutes, warningMinutes]);

  return {
    shouldShowWarning: isTokenExpiringSoon && tokenExpiresInMinutes <= warningMinutes,
    minutesUntilExpiry: tokenExpiresInMinutes,
  };
}