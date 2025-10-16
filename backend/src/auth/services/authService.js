import { hashPassword, verifyPassword } from '../password.js';
import { createAccessToken, createRefreshToken, verifyToken } from '../jwt.js';
import { TokenService } from './tokenService.js';
import { config, getJwtExpiration } from '../../config/index.js';
import { emailService } from '../../services/emailService.js';

export class AuthService {
  constructor(db) {
    this.db = db;
    this.tokenService = new TokenService(db);
  }

  async registerUser(email, password) {
    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists (case-insensitive)
    const existing = await this.db('users').whereRaw('LOWER(email) = ?', [normalizedEmail]).first();
    if (existing) {
      throw new Error('Email taken');
    }

    // Create user with default values
    const hashed = await hashPassword(password);
    const [user] = await this.db('users')
      .insert({ 
        email: normalizedEmail, 
        password: hashed,
        roles: JSON.stringify(['club_manager']),
        primary_role: 'club_manager',
        is_onboarded: false,
        email_verified: false
      })
      .returning([
        'id', 'email', 'name', 'avatar', 'roles', 'primary_role',
        'account_type', 'is_onboarded', 'email_verified', 'email_verified_at',
        'club_id', 'children', 'created_at', 'updated_at'
      ]);

    // Create tokens
    const { accessTokenId, refreshTokenId } = await this.tokenService.createTokens(user.id);
    const accessToken = createAccessToken(accessTokenId, user.id);
    const refreshToken = createRefreshToken(refreshTokenId, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        roles: Array.isArray(user.roles) ? user.roles : ['club_manager'],
        primaryRole: user.primary_role || 'club_manager',
        accountType: user.account_type,
        isOnboarded: user.is_onboarded || false,
        emailVerified: user.email_verified || false,
        emailVerifiedAt: user.email_verified_at,
        clubId: user.club_id,
        children: user.children
      },
      accessToken,
      refreshToken,
      expiresIn: config.tokens.accessTokenExpiresIn
    };
  }

  async loginUser(email, password) {
    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();
    
    // Find user (case-insensitive)
    const user = await this.db('users').whereRaw('LOWER(email) = ?', [normalizedEmail]).first();
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    // Create tokens
    const { accessTokenId, refreshTokenId } = await this.tokenService.createTokens(user.id);
    const accessToken = createAccessToken(accessTokenId, user.id);
    const refreshToken = createRefreshToken(refreshTokenId, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        roles: Array.isArray(user.roles) ? user.roles : ['club_manager'],
        primaryRole: user.primary_role || 'club_manager',
        accountType: user.account_type,
        isOnboarded: user.is_onboarded || false,
        emailVerified: user.email_verified || false,
        emailVerifiedAt: user.email_verified_at,
        clubId: user.club_id,
        children: user.children
      },
      accessToken,
      refreshToken,
      expiresIn: config.tokens.accessTokenExpiresIn
    };
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token required');
    }

    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    const tokenRecord = await this.tokenService.validateToken(payload.tokenId, 'refresh');
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    // Revoke old token
    await this.tokenService.revokeToken(payload.tokenId);

    // Create new tokens
    const { accessTokenId, refreshTokenId } = await this.tokenService.createTokens(tokenRecord.userId);
    const newAccessToken = createAccessToken(accessTokenId, tokenRecord.userId);
    const newRefreshToken = createRefreshToken(refreshTokenId, tokenRecord.userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logoutUser(tokenId) {
    await this.tokenService.revokeToken(tokenId);
  }

  async logoutAllDevices(userId) {
    await this.tokenService.revokeAllUserTokens(userId);
  }

  async isEmailAvailable(email) {
    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();

    // Check if email exists (case-insensitive)
    const user = await this.db('users').whereRaw('LOWER(email) = ?', [normalizedEmail]).first();
    return !user;
  }

  // Email verification methods
  async sendEmailVerification(userId, email) {
    // Check if user exists and email matches
    const user = await this.db('users').where({ id: userId }).first();
    if (!user) {
      throw new Error('User not found');
    }

    if (user.email_verified && user.email === email) {
      throw new Error('Email is already verified');
    }

    // Generate verification token (24 hour expiry)
    const tokenId = await this.tokenService.createEmailVerificationToken(userId, email);
    const verificationToken = createAccessToken(tokenId, userId, getJwtExpiration('emailVerification'));

    // Send verification email
    try {
      const emailResult = await emailService.sendEmailVerification(
        email, 
        verificationToken, 
        user.name || 'User'
      );
      
      console.log(`✅ Verification email sent to ${email}`);
      if (emailResult.preview) {
        console.log(`📧 Preview URL: ${emailResult.preview}`);
      }
      
      return { 
        success: true, 
        email, 
        message: 'Verification email sent successfully',
        // Only return token in development mode
        ...(process.env.NODE_ENV === 'development' && { token: verificationToken })
      };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      throw new Error('Failed to send verification email');
    }
  }

  async confirmEmailVerification(token) {
    try {
      const payload = verifyToken(token);
      if (!payload || payload.type !== 'access') {
        throw new Error('Invalid verification token');
      }

      // Validate token exists and is for email verification
      const tokenRecord = await this.tokenService.validateEmailVerificationToken(payload.tokenId);
      if (!tokenRecord) {
        throw new Error('Invalid or expired verification token');
      }

      // Update user email verification status
      const [updatedUser] = await this.db('users')
        .where({ id: payload.userId })
        .update({
          email_verified: true,
          email_verified_at: new Date(),
          email: tokenRecord.email || undefined // Update email if it was changed
        })
        .returning('*');

      // Revoke the verification token
      await this.tokenService.revokeToken(payload.tokenId);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        email_verified: updatedUser.email_verified
      };
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  // Password reset methods
  async sendPasswordResetEmail(email) {
    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists (case-insensitive)
    const user = await this.db('users').whereRaw('LOWER(email) = ?', [normalizedEmail]).first();
    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return { success: true };
    }

    // Generate password reset token (1 hour expiry)
    const tokenId = await this.tokenService.createPasswordResetToken(user.id, normalizedEmail);
    const resetToken = createAccessToken(tokenId, user.id, getJwtExpiration('passwordReset'));

    // Send password reset email
    try {
      const emailResult = await emailService.sendPasswordReset(
        normalizedEmail, 
        resetToken, 
        user.name || 'User'
      );
      
      console.log(`✅ Password reset email sent to ${normalizedEmail}`);
      if (emailResult.preview) {
        console.log(`📧 Preview URL: ${emailResult.preview}`);
      }
      
      return { 
        success: true, 
        message: 'Password reset email sent successfully',
        // Only return token in development mode
        ...(process.env.NODE_ENV === 'development' && { token: resetToken })
      };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      // Don't reveal that the user doesn't exist for security
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const payload = verifyToken(token);
      if (!payload || payload.type !== 'access') {
        throw new Error('Invalid reset token');
      }

      // Validate token exists and is for password reset
      const tokenRecord = await this.tokenService.validatePasswordResetToken(payload.tokenId);
      if (!tokenRecord) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await this.db('users')
        .where({ id: payload.userId })
        .update({
          password: hashedPassword,
          updated_at: new Date()
        });

      // Revoke the reset token
      await this.tokenService.revokeToken(payload.tokenId);

      // Revoke all existing sessions for security
      await this.tokenService.revokeAllUserTokens(payload.userId, 'access');
      await this.tokenService.revokeAllUserTokens(payload.userId, 'refresh');

      return { success: true };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }
}