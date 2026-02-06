// Enhanced Token Management with Security Best Practices

// Storage strategies
type StorageStrategy = 'localStorage' | 'sessionStorage' | 'memory' | 'httpOnly';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  issuedAt: number;
}

class SecureTokenManager {
  private strategy: StorageStrategy;
  private memoryStore: TokenData | null = null;
  private readonly ACCESS_TOKEN_KEY = 'clubqore_access_token';
  private readonly REFRESH_TOKEN_KEY = 'clubqore_refresh_token';
  private readonly TOKEN_DATA_KEY = 'clubqore_token_data';
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL || '120000'); // 2 minutes
  private readonly EXPIRY_BUFFER = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_BUFFER || '60000'); // 1 minute
  private readonly EXPIRY_WARNING = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_WARNING || '300000'); // 5 minutes

  constructor(strategy: StorageStrategy = 'localStorage') {
    this.strategy = strategy;
  }

  // Decode JWT token to get expiration
  private decodeJWTPayload(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  // Get expiration from JWT token
  private getTokenExpiration(token: string): number {
    const payload = this.decodeJWTPayload(token);
    if (payload && payload.exp) {
      // JWT exp is in seconds, convert to milliseconds
      return payload.exp * 1000;
    }
    // Fallback: 1 hour from now if no exp claim
    return Date.now() + (3600 * 1000);
  }

  // Get storage mechanism based on strategy
  private getStorage() {
    switch (this.strategy) {
      case 'sessionStorage':
        return sessionStorage;
      case 'localStorage':
        return localStorage;
      case 'memory':
        return null; // Use in-memory storage
      default:
        return localStorage;
    }
  }

  // Get storage strategy
  getStorageStrategy(): StorageStrategy {
    return this.strategy;
  }

  // Set tokens with automatic expiration from JWT
  setTokens(accessToken: string, refreshToken: string): void {
    // For httpOnly cookies, server handles storage - we just track metadata
    if (this.strategy === 'httpOnly') {
      // Store only metadata for UI purposes (expiration tracking)
      const expiresAt = this.getTokenExpiration(accessToken);
      this.memoryStore = {
        accessToken: '', // Don't store actual token
        refreshToken: '', // Don't store actual token
        expiresAt,
        issuedAt: Date.now()
      };
      return;
    }

    const now = Date.now();
    const expiresAt = this.getTokenExpiration(accessToken);
    const tokenData: TokenData = {
      accessToken,
      refreshToken,
      expiresAt,
      issuedAt: now
    };

    if (this.strategy === 'memory') {
      this.memoryStore = tokenData;
    } else {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(this.TOKEN_DATA_KEY, JSON.stringify(tokenData));
      }
    }
  }

  // Get access token with expiration check
  getAccessToken(): string | null {
    // For httpOnly cookies, browser handles tokens - return null to let cookies work
    if (this.strategy === 'httpOnly') {
      return null;
    }

    const tokenData = this.getTokenData();
    if (!tokenData) {
      return null;
    }

    return tokenData.accessToken;
  }

  // Get refresh token
  getRefreshToken(): string | null {
    // For httpOnly cookies, browser handles tokens - return null to let cookies work
    if (this.strategy === 'httpOnly') {
      return null;
    }

    const tokenData = this.getTokenData();
    return tokenData?.refreshToken || null;
  }

  // Get token data
  private getTokenData(): TokenData | null {
    if (this.strategy === 'memory' || this.strategy === 'httpOnly') {
      return this.memoryStore;
    }

    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const data = storage.getItem(this.TOKEN_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to parse token data:', error);
      this.clearTokens();
      return null;
    }
  }

  // Check if tokens are valid
  isTokenValid(): boolean {
    // For httpOnly, we assume valid if we have metadata (server handles actual validation)
    if (this.strategy === 'httpOnly') {
      return this.memoryStore !== null && Date.now() < (this.memoryStore?.expiresAt || 0);
    }

    const tokenData = this.getTokenData();
    if (!tokenData) return false;

    return Date.now() < tokenData.expiresAt;
  }

  // Clear all tokens
  clearTokens(): void {
    // Clear memory store (used by memory and httpOnly strategies)
    this.memoryStore = null;

    if (this.strategy === 'memory' || this.strategy === 'httpOnly') {
      // For httpOnly, server clears cookies via logout endpoint
      return;
    }

    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.TOKEN_DATA_KEY);
      // Also clear legacy storage if exists
      storage.removeItem(this.ACCESS_TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  // Change storage strategy (useful for user preferences)
  setStorageStrategy(strategy: StorageStrategy): void {
    const currentTokenData = this.getTokenData();
    this.clearTokens();
    this.strategy = strategy;
    
    if (currentTokenData) {
      this.setTokens(
        currentTokenData.accessToken,
        currentTokenData.refreshToken
      );
    }
  }

  // Get time until token expiration
  getTimeUntilExpiration(): number {
    const tokenData = this.getTokenData();
    if (!tokenData) return 0;
    return Math.max(0, tokenData.expiresAt - Date.now());
  }

  // Get JWT claims from access token
  getTokenClaims(): Record<string, unknown> | null {
    const tokenData = this.getTokenData();
    if (!tokenData?.accessToken) return null;
    return this.decodeJWTPayload(tokenData.accessToken);
  }

  // Check if token is close to expiring (within configurable warning time)
  isTokenExpiringSoon(): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration();
    return timeUntilExpiration > 0 && timeUntilExpiration <= this.EXPIRY_WARNING;
  }

  // Start proactive token refresh
  startProactiveRefresh(): void {
    if (this.refreshInterval) {
      console.log('🔄 Proactive refresh already running');
      return;
    }

    // Only start if we have a valid token
    if (!this.getAccessToken()) {
      console.log('🔄 No token available, skipping proactive refresh');
      return;
    }

    console.log(`🔄 Starting proactive token refresh (interval: ${this.REFRESH_INTERVAL}ms)`);
    
    this.refreshInterval = setInterval(async () => {
      try {
        if (this.isTokenExpiringSoon()) {
          console.log('🔄 Token expiring soon, attempting proactive refresh...');
          await this.refreshToken();
        }
      } catch (error) {
        console.error('🔄 Proactive refresh failed:', error);
        // Don't clear tokens on proactive refresh failure
        // Let the reactive refresh handle it
      }
    }, this.REFRESH_INTERVAL);
  }

  // Stop proactive token refresh
  stopProactiveRefresh(): void {
    if (this.refreshInterval) {
      console.log('🔄 Stopping proactive token refresh');
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Refresh token using refresh token
  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.log('🔄 No refresh token available for proactive refresh');
      return false;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('🔄 Proactive refresh failed with status:', response.status);
        return false;
      }

      const result = await response.json();
      this.setTokens(result.accessToken, result.refreshToken);
      console.log('🔄 Proactive token refresh successful');
      return true;
    } catch (error) {
      console.error('🔄 Proactive refresh failed:', error);
      return false;
    }
  }

  // Check if proactive refresh is running
  isProactiveRefreshRunning(): boolean {
    return this.refreshInterval !== null;
  }
}

// Create token manager instance
export const tokenManager = new SecureTokenManager(
  // Use localStorage for persistence across browser sessions
  import.meta.env.VITE_TOKEN_STORAGE_STRATEGY as StorageStrategy || 'localStorage'
);

// Legacy token manager for backward compatibility (with JWT expiration support)
export const legacyTokenManager = {
  getAccessToken: (): string | null => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    // Check if JWT is expired
    if (securityUtils.isJWTExpired(token)) {
      legacyTokenManager.clearTokens();
      return null;
    }
    
    return token;
  },
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  // Additional JWT utilities for legacy manager
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('accessToken');
    return !token || securityUtils.isJWTExpired(token);
  },
  getTimeToExpiry: (): number => {
    const token = localStorage.getItem('accessToken');
    return token ? securityUtils.getJWTTimeToExpiry(token) : 0;
  }
};

// Scope extraction utilities for RBAC
export interface TokenScopes {
  roles: string[];
  scopes: string[];
}

/**
 * Extract roles and scopes from a JWT token
 * @param token - The JWT access token
 * @returns Object with roles and scopes arrays
 */
export const getScopesFromToken = (token: string): TokenScopes => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      roles: payload.roles || [],
      scopes: payload.scopes || []
    };
  } catch (error) {
    console.error('Failed to extract scopes from token:', error);
    return { roles: [], scopes: [] };
  }
};

/**
 * Check if a specific scope is present in scopes array
 * @param scopes - Array of scope strings
 * @param resource - Resource name (e.g., 'parent-dashboard')
 * @param action - Action type ('view', 'create', 'edit', 'delete')
 */
export const hasScope = (scopes: string[], resource: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
  return scopes.includes(`${resource}:${action}`);
};

/**
 * Check if user has view permission for a resource
 */
export const canView = (scopes: string[], resource: string): boolean => hasScope(scopes, resource, 'view');

/**
 * Check if user has create permission for a resource
 */
export const canCreate = (scopes: string[], resource: string): boolean => hasScope(scopes, resource, 'create');

/**
 * Check if user has edit permission for a resource
 */
export const canEdit = (scopes: string[], resource: string): boolean => hasScope(scopes, resource, 'edit');

/**
 * Check if user has delete permission for a resource
 */
export const canDelete = (scopes: string[], resource: string): boolean => hasScope(scopes, resource, 'delete');

// Security utility functions
export const securityUtils = {
  // Validate that we're in a secure context
  isSecureContext: (): boolean => {
    return window.isSecureContext || location.protocol === 'https:';
  },

  // Check for XSS protection
  hasXSSProtection: (): boolean => {
    // Basic XSS protection check
    return document.querySelector('meta[http-equiv="X-XSS-Protection"]') !== null;
  },

  // Generate a CSP nonce for inline scripts (if needed)
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Decode JWT payload (utility function)
  decodeJWT: (token: string): Record<string, unknown> | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  },

  // Check if JWT token is expired
  isJWTExpired: (token: string): boolean => {
    const payload = securityUtils.decodeJWT(token);
    if (!payload || !payload.exp) return true;
    
    // JWT exp is in seconds, convert to milliseconds and add 30-second buffer
    const expirationTime = payload.exp * 1000;
    const bufferTime = 30 * 1000; // 30 seconds
    
    return Date.now() > (expirationTime - bufferTime);
  },

  // Get time until JWT expires (in milliseconds)
  getJWTTimeToExpiry: (token: string): number => {
    const payload = securityUtils.decodeJWT(token);
    if (!payload || !payload.exp) return 0;
    
    const expirationTime = payload.exp * 1000;
    return Math.max(0, expirationTime - Date.now());
  },

  // Warn about insecure context
  warnIfInsecure: (): void => {
    if (!securityUtils.isSecureContext()) {
      console.warn('🔒 Security Warning: Application is not running in a secure context (HTTPS). Token storage may be vulnerable.');
    }
  }
};

// Initialize security warnings
securityUtils.warnIfInsecure();
