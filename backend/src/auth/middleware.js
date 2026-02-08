import { verifyToken } from './jwt.js';
import { TokenService } from './services/tokenService.js';

export function createAuthMiddleware(db) {
  const tokenService = new TokenService(db);

  return async function authenticate(request, reply) {
    // Hybrid auth: Try cookie first, then fall back to Authorization header
    let token = null;

    // 1. Try httpOnly cookie (browser clients)
    if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    // 2. Fall back to Bearer token (mobile/API clients)
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // No token found in either location
    if (!token) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const payload = verifyToken(token);

    if (!payload || payload.type !== 'access') {
      return reply.code(401).send({ error: 'Invalid access token' });
    }

    // Validate token in database
    const tokenRecord = await tokenService.validateToken(payload.tokenId, 'access');

    if (!tokenRecord) {
      return reply.code(401).send({ error: 'Token revoked or expired' });
    }

    // Get user details to include email and verification status
    const user = await db('users')
      .where({ id: tokenRecord.userId })
      .select('id', 'email', 'email_verified')
      .first();

    if (!user) {
      return reply.code(401).send({ error: 'User not found' });
    }

    // Add user info to request, including roles and scopes from JWT
    request.user = {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
      tokenId: tokenRecord.tokenId,
      roles: payload.roles || [],    // Roles from JWT
      scopes: payload.scopes || []   // Scopes from JWT for authorization checks
    };
  };
}
