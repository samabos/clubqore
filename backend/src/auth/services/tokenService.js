import crypto from 'crypto';
import { getTokenExpirationMs } from '../../config/index.js';

export class TokenService {
  constructor(db) {
    this.db = db;
  }

  generateTokenId() {
    return crypto.randomBytes(32).toString('hex');
  }

  async createTokens(userId) {
    const accessTokenId = this.generateTokenId();
    const refreshTokenId = this.generateTokenId();
    
    const accessExpiresAt = new Date(Date.now() + getTokenExpirationMs('accessToken'));
    const refreshExpiresAt = new Date(Date.now() + getTokenExpirationMs('refreshToken'));

    // Store tokens in database
    await this.db('tokens').insert([
      {
        token_id: accessTokenId,
        user_id: userId,
        type: 'access',
        expires_at: accessExpiresAt,
      },
      {
        token_id: refreshTokenId,
        user_id: userId,
        type: 'refresh',
        expires_at: refreshExpiresAt,
      }
    ]);

    return { accessTokenId, refreshTokenId, accessExpiresAt, refreshExpiresAt };
  }

  async validateToken(tokenId, type = 'access') {
    const tokenRecord = await this.db('tokens')
      .where({ 
        token_id: tokenId, 
        type,
        revoked: false 
      })
      .andWhere('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      return null;
    }

    return {
      userId: tokenRecord.user_id,
      tokenId: tokenRecord.token_id,
      expiresAt: tokenRecord.expires_at
    };
  }

  async revokeToken(tokenId) {
    await this.db('tokens')
      .where({ token_id: tokenId })
      .update({ revoked: true });
  }

  async revokeAllUserTokens(userId, type = null) {
    const query = this.db('tokens').where({ user_id: userId });
    if (type) {
      query.andWhere({ type });
    }
    await query.update({ revoked: true });
  }

  async cleanupExpiredTokens() {
    await this.db('tokens')
      .where('expires_at', '<', new Date())
      .del();
  }

  // Email verification token methods
  async createEmailVerificationToken(userId, email) {
    const tokenId = this.generateTokenId();
    const expiresAt = new Date(Date.now() + getTokenExpirationMs('emailVerification'));

    await this.db('tokens').insert({
      token_id: tokenId,
      user_id: userId,
      type: 'email_verification',
      expires_at: expiresAt,
      metadata: JSON.stringify({ email }) // Store email for verification
    });

    return tokenId;
  }

  async validateEmailVerificationToken(tokenId) {
    const tokenRecord = await this.db('tokens')
      .where({ 
        token_id: tokenId, 
        type: 'email_verification',
        revoked: false 
      })
      .andWhere('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      return null;
    }

    const metadata = tokenRecord.metadata ? JSON.parse(tokenRecord.metadata) : {};
    
    return {
      userId: tokenRecord.user_id,
      tokenId: tokenRecord.token_id,
      email: metadata.email,
      expiresAt: tokenRecord.expires_at
    };
  }

  // Password reset token methods
  async createPasswordResetToken(userId, email) {
    if (!userId) {
      throw new Error('User ID is required for password reset token');
    }

    const tokenId = this.generateTokenId();
    const expiresAt = new Date(Date.now() + getTokenExpirationMs('passwordReset'));

    await this.db('tokens').insert({
      token_id: tokenId,
      user_id: userId,
      type: 'password_reset',
      expires_at: expiresAt,
      metadata: JSON.stringify({ email }) // Store email for verification
    });

    return tokenId;
  }

  async validatePasswordResetToken(tokenId) {
    const tokenRecord = await this.db('tokens')
      .where({ 
        token_id: tokenId, 
        type: 'password_reset',
        revoked: false 
      })
      .andWhere('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      return null;
    }

    const metadata = tokenRecord.metadata ? JSON.parse(tokenRecord.metadata) : {};
    
    return {
      userId: tokenRecord.user_id,
      tokenId: tokenRecord.token_id,
      email: metadata.email,
      expiresAt: tokenRecord.expires_at
    };
  }
}