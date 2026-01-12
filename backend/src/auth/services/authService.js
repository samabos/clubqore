import { hashPassword, verifyPassword } from '../password.js';
import { createAccessToken, createRefreshToken, verifyToken } from '../jwt.js';
import { TokenService } from './tokenService.js';
import { config } from '../../config/index.js';
import { emailService } from '../../services/emailService.js';
import { EmailOutboxService } from '../../services/emailOutboxService.js';
import { RoleService } from '../../onboarding/services/RoleService.js';
import { EmailTakenError, InvalidCredentialsError } from '../../errors/AppError.js';

const defaultRole = 'club_manager';

export class AuthService {
  constructor(db) {
    this.db = db;
    this.tokenService = new TokenService(db);
    this.roleService = new RoleService(db);
  }

  /**
   * Get permission scopes for a list of role IDs
   * Scopes are in format: "resource-name:action" (e.g., "parent-dashboard:view")
   * @param {number[]} roleIds - Array of role IDs
   * @returns {Promise<string[]>} Array of scope strings
   */
  async getScopesForRoles(roleIds) {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    try {
      const permissions = await this.db('role_permissions')
        .join('resources', 'role_permissions.resource_id', 'resources.id')
        .whereIn('role_permissions.role_id', roleIds)
        .where('role_permissions.is_active', true)
        .where('resources.is_active', true)
        .select(
          'resources.name',
          'role_permissions.can_view',
          'role_permissions.can_create',
          'role_permissions.can_edit',
          'role_permissions.can_delete'
        );

      // Convert to scope strings: "resource-name:action"
      const scopes = [];
      for (const p of permissions) {
        if (p.can_view) scopes.push(`${p.name}:view`);
        if (p.can_create) scopes.push(`${p.name}:create`);
        if (p.can_edit) scopes.push(`${p.name}:edit`);
        if (p.can_delete) scopes.push(`${p.name}:delete`);
      }

      // Remove duplicates (in case of overlapping role permissions)
      return [...new Set(scopes)];
    } catch (error) {
      // If tables don't exist yet (migration not run), return empty array
      console.warn('Could not fetch scopes (RBAC tables may not exist yet):', error.message);
      return [];
    }
  }

  /**
   * Get role IDs for a user
   * @param {number} userId
   * @returns {Promise<number[]>} Array of role IDs
   */
  async getUserRoleIds(userId) {
    const userRoles = await this.db('user_roles')
      .where({ user_id: userId, is_active: true })
      .select('role_id');
    return userRoles.map(r => r.role_id);
  }

  async registerUser(email, password) {
    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();

    // Check if user exists (case-insensitive)
    const existing = await this.db('users').whereRaw('LOWER(email) = ?', [normalizedEmail]).first();
    if (existing) {
      throw new EmailTakenError(normalizedEmail);
    }

    // Create user with default values
    const hashed = await hashPassword(password);
    const [user] = await this.db('users')
      .insert({
        email: normalizedEmail,
        password: hashed,
        is_onboarded: false,
        email_verified: false
      })
      .returning([
        'id', 'email', 'name', 'avatar',
        'account_type', 'is_onboarded', 'email_verified', 'email_verified_at',
        'club_id', 'children', 'created_at', 'updated_at'
      ]);

    //Assign Default Role
    const role = await this.db('roles').where({ name: defaultRole, is_active: true }).first();
    if (role) {
      await this.db('user_roles').insert({
        user_id: user.id,
        role_id: role.id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Get user profile to include avatar
    const profile = await this.db('user_profiles')
      .where({ user_id: user.id })
      .first();

    // Use profile avatar if available, otherwise fall back to users table avatar
    const avatarUrl = profile?.avatar || user.avatar;

    // Get user roles from user_roles table
    const userRoles = await this.db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ 'user_roles.user_id': user.id })
      .select('roles.name', 'roles.id as role_id');

    const roleNames = userRoles.length > 0 ? userRoles.map(r => r.name) : [];
    const roleIds = userRoles.map(r => r.role_id);

    // Get scopes for user's roles
    const scopes = await this.getScopesForRoles(roleIds);

    // Create tokens with roles and scopes embedded
    const { accessTokenId, refreshTokenId } = await this.tokenService.createTokens(user.id);
    const accessToken = createAccessToken(accessTokenId, user.id, roleNames, scopes);
    const refreshToken = createRefreshToken(refreshTokenId, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: avatarUrl,
        roles: roleNames,
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
    const user = await this.db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .select('users.id', 'users.email', 'users.name','users.password', 'users.avatar', 'users.account_type',
        'users.is_onboarded', 'users.email_verified', 'users.email_verified_at', 'user_roles.club_id', 'users.children')
      .whereRaw('LOWER(email) = ?', [normalizedEmail]).first();

    if (!user || !(await verifyPassword(password, user.password))) {
      throw new InvalidCredentialsError();
    }

    // Get user profile to include avatar
    const profile = await this.db('user_profiles')
      .where({ user_id: user.id })
      .first();

    // Use profile avatar if available, otherwise fall back to users table avatar
    const avatarUrl = profile?.avatar || user.avatar;

    // Get user roles from user_roles table
    const userRoles = await this.db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ 'user_roles.user_id': user.id, 'user_roles.is_active': true })
      .select('roles.name', 'roles.id as role_id');

    const roleNames = userRoles.length > 0 ? userRoles.map(r => r.name) : [];
    const roleIds = userRoles.map(r => r.role_id);

    // Get scopes for user's roles
    const scopes = await this.getScopesForRoles(roleIds);

    // Create tokens with roles and scopes embedded
    const { accessTokenId, refreshTokenId } = await this.tokenService.createTokens(user.id);
    const accessToken = createAccessToken(accessTokenId, user.id, roleNames, scopes);
    const refreshToken = createRefreshToken(refreshTokenId, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: avatarUrl,
        roles: roleNames,
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

    // Get user's roles and scopes for the new token
    const roleIds = await this.getUserRoleIds(tokenRecord.userId);
    const roles = await this.db('roles')
      .whereIn('id', roleIds)
      .select('name');
    const roleNames = roles.map(r => r.name);
    const scopes = await this.getScopesForRoles(roleIds);

    // Create new tokens with roles and scopes
    const { accessTokenId, refreshTokenId } = await this.tokenService.createTokens(tokenRecord.userId);
    const newAccessToken = createAccessToken(accessTokenId, tokenRecord.userId, roleNames, scopes);
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

    // Generate verification token (24 hour expiry) - no roles/scopes needed for verification
    const tokenId = await this.tokenService.createEmailVerificationToken(userId, email);
    const verificationToken = createAccessToken(tokenId, userId, [], []);

    // Send verification email using database template
    try {
      const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${verificationToken}`;

      const outbox = new EmailOutboxService(this.db, emailService);
      const emailResult = await outbox.sendAndLog({
        to: email,
        templateKey: 'email_verification',
        templateData: {
          userName: user.name || 'User',
          verificationUrl
        }
      });

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

    // Generate password reset token (1 hour expiry) - no roles/scopes needed for reset
    const tokenId = await this.tokenService.createPasswordResetToken(user.id, normalizedEmail);
    const resetToken = createAccessToken(tokenId, user.id, [], []);

    // Send password reset email using database template
    try {
      const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;

      const outbox = new EmailOutboxService(this.db, emailService);
      const emailResult = await outbox.sendAndLog({
        to: normalizedEmail,
        templateKey: 'password_reset',
        templateData: {
          userName: user.name || 'User',
          resetUrl
        }
      });

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

  /**
   * Change password for logged-in user
   * @param {number} userId - The user's ID
   * @param {string} currentPassword - The user's current password
   * @param {string} newPassword - The new password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user with current password
    const user = await this.db('users').where({ id: userId }).first();
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.db('users')
      .where({ id: userId })
      .update({
        password: hashedPassword,
        updated_at: new Date()
      });

    return { success: true, message: 'Password changed successfully' };
  }
}