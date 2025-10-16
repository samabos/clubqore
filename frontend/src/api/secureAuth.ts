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

  constructor(strategy: StorageStrategy = 'localStorage') {
    this.strategy = strategy;
  }

  // Decode JWT token to get expiration
  private decodeJWTPayload(token: string): any {
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

  // Set tokens with automatic expiration from JWT
  setTokens(accessToken: string, refreshToken: string): void {
    const now = Date.now();
    const expiresAt = this.getTokenExpiration(accessToken);
    const tokenData: TokenData = {
      accessToken,
      refreshToken,
      expiresAt,
      issuedAt: now
    };

    console.log('🔐 Setting tokens:', {
      strategy: this.strategy,
      expiresAt: new Date(expiresAt).toISOString(),
      timeUntilExpiry: Math.round((expiresAt - now) / 1000 / 60) + ' minutes',
      tokenLength: accessToken.length
    });

    if (this.strategy === 'memory') {
      this.memoryStore = tokenData;
    } else if (this.strategy === 'httpOnly') {
      // For httpOnly cookies, we'd set a flag and let the server handle tokens
      // This is just a placeholder - actual implementation would differ
      console.warn('HttpOnly cookie strategy requires server-side implementation');
    } else {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(this.TOKEN_DATA_KEY, JSON.stringify(tokenData));
        console.log('🔐 Tokens stored in', this.strategy);
      }
    }
  }

  // Get access token with expiration check
  getAccessToken(): string | null {
    const tokenData = this.getTokenData();
    if (!tokenData) {
      console.log('🔐 No token data found');
      return null;
    }

    // Check if token is expired (with 1-minute buffer)
    const bufferTime = 1 * 60 * 1000; // 1 minute
    const now = Date.now();
    const expiresAt = tokenData.expiresAt;
    const timeUntilExpiry = expiresAt - now;
    
    console.log('🔐 Token check:', {
      now: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60) + ' minutes',
      isExpired: now > (expiresAt - bufferTime)
    });
    
    if (now > (expiresAt - bufferTime)) {
      console.log('🔐 Token expired, clearing tokens');
      this.clearTokens();
      return null;
    }

    return tokenData.accessToken;
  }

  // Get refresh token
  getRefreshToken(): string | null {
    const tokenData = this.getTokenData();
    return tokenData?.refreshToken || null;
  }

  // Get token data
  private getTokenData(): TokenData | null {
    if (this.strategy === 'memory') {
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
    const tokenData = this.getTokenData();
    if (!tokenData) return false;

    return Date.now() < tokenData.expiresAt;
  }

  // Clear all tokens
  clearTokens(): void {
    if (this.strategy === 'memory') {
      this.memoryStore = null;
    } else {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(this.TOKEN_DATA_KEY);
        // Also clear legacy storage if exists
        storage.removeItem(this.ACCESS_TOKEN_KEY);
        storage.removeItem(this.REFRESH_TOKEN_KEY);
      }
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
  getTokenClaims(): any {
    const tokenData = this.getTokenData();
    if (!tokenData?.accessToken) return null;
    return this.decodeJWTPayload(tokenData.accessToken);
  }

  // Check if token is close to expiring (within 5 minutes)
  isTokenExpiringSoon(): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return timeUntilExpiration > 0 && timeUntilExpiration <= fiveMinutes;
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
  decodeJWT: (token: string): any => {
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
