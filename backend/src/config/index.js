// Configuration utility for managing environment variables
export const getConfig = () => ({
  // Server settings
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // Database
  pgConnectionString: process.env.PG_CONNECTION_STRING,
  
  // JWT settings
  jwtSecret: process.env.JWT_SECRET,
  
  // Token expiration times (in seconds)
  tokens: {
    accessTokenExpiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) || 900, // 15 minutes
    refreshTokenExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) || 604800, // 7 days
    emailVerificationExpiresIn: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN) || 86400, // 24 hours
    passwordResetExpiresIn: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN) || 3600, // 1 hour
  },
  
  // OAuth settings
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  
  // Email service
  email: {
    provider: process.env.EMAIL_PROVIDER || 'development', // 'gmail', 'smtp', 'sendgrid', 'development'
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    apiKey: process.env.EMAIL_API_KEY, // For SendGrid
    fromEmail: process.env.EMAIL_FROM || 'noreply@clubqore.com',
    fromName: process.env.EMAIL_FROM_NAME || 'ClubQore',
  },

  // Application URLs
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Cookie settings for httpOnly auth
  cookies: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    sameSite: 'lax', // 'strict' can cause issues with redirects, 'lax' is good balance
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
});

// Backwards compatibility - use getter for config
export const config = new Proxy({}, {
  get(target, prop) {
    return getConfig()[prop];
  }
});

// Helper function to get token expiration in milliseconds
export const getTokenExpirationMs = (tokenType) => {
  const config = getConfig();
  const expirationSeconds = config.tokens[`${tokenType}ExpiresIn`];
  return expirationSeconds * 1000;
};

// Helper function to get JWT expiration string
export const getJwtExpiration = (tokenType) => {
  const config = getConfig();
  const seconds = config.tokens[`${tokenType}ExpiresIn`];
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

// Validation function
export const validateConfig = () => {
  const config = getConfig();
  const required = [
    'JWT_SECRET',
    'PG_CONNECTION_STRING'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
  
  console.log('✅ Configuration validated successfully');
  console.log(`🔧 Access token expires in: ${config.tokens.accessTokenExpiresIn}s (${getJwtExpiration('accessToken')})`);
  console.log(`🔧 Refresh token expires in: ${config.tokens.refreshTokenExpiresIn}s (${getJwtExpiration('refreshToken')})`);
};
