import { verifyToken } from './jwt.js';
import { TokenService } from './services/tokenService.js';

export function createAuthMiddleware(db) {
  const tokenService = new TokenService(db);

  return async function authenticate(request, reply) {
    console.log(`🔐 Auth middleware called for ${request.method} ${request.url}`);
    
    const authHeader = request.headers.authorization;
    console.log(`🔐 Auth header: ${authHeader ? 'Present' : 'Missing'}`);
    if (authHeader) {
      console.log(`🔐 Auth header value: ${authHeader.substring(0, 20)}...`);
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`❌ Auth failed: Missing or invalid authorization header`);
      return reply.code(401).send({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    console.log(`🔐 Token extracted: ${token.substring(0, 20)}...`);
    
    const payload = verifyToken(token);
    console.log(`🔐 Token verification result: ${payload ? 'Valid' : 'Invalid'}`);

    if (!payload || payload.type !== 'access') {
      console.log(`❌ Auth failed: Invalid access token or wrong type`);
      return reply.code(401).send({ error: 'Invalid access token' });
    }

    // Validate token in database
    const tokenRecord = await tokenService.validateToken(payload.tokenId, 'access');
    console.log(`🔐 Database token validation: ${tokenRecord ? 'Valid' : 'Invalid'}`);
    
    if (!tokenRecord) {
      console.log(`❌ Auth failed: Token revoked or expired`);
      return reply.code(401).send({ error: 'Token revoked or expired' });
    }

    // Get user details to include email and verification status
    const user = await db('users')
      .where({ id: tokenRecord.userId })
      .select('id', 'email', 'email_verified')
      .first();

    if (!user) {
      console.log(`❌ Auth failed: User not found`);
      return reply.code(401).send({ error: 'User not found' });
    }

    console.log(`✅ Auth successful for user ${user.id} (${user.email})`);

    // Add user info to request
    request.user = {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
      tokenId: tokenRecord.tokenId
    };
  };
}