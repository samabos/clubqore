import jwt from 'jsonwebtoken';
import { config, getJwtExpiration } from '../config/index.js';

function getJwtSecret() {
  const JWT_SECRET = config.jwtSecret;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
}

export function signToken(payload, expiresIn = '15m') {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

// Create tokens with embedded token IDs
export function createAccessToken(tokenId, userId) {
  return jwt.sign(
    { 
      tokenId, 
      userId, 
      type: 'access' 
    }, 
    getJwtSecret(), 
    { expiresIn: getJwtExpiration('accessToken') }
  );
}

export function createRefreshToken(tokenId, userId) {
  return jwt.sign(
    { 
      tokenId, 
      userId, 
      type: 'refresh' 
    }, 
    getJwtSecret(), 
    { expiresIn: getJwtExpiration('refreshToken') }
  );
}