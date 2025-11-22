import { hashPassword } from '../password.js';
import { UserNotFoundError, EmailTakenError } from '../../errors/AppError.js';

export class UserService {
  constructor(db) {
    this.db = db;
  }

  async getUserById(id) {
    const user = await this.db('users')
      .where({ id })
      .select([
        'id', 'email', 'name', 'avatar',
        'account_type', 'is_onboarded', 'email_verified', 'email_verified_at',
        'club_id', 'children', 'created_at', 'updated_at'
      ])
      .first();

    if (!user) {
      throw new UserNotFoundError(id);
    }

    // Get user roles from user_roles table
    const userRoles = await this.db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ 'user_roles.user_id': id, 'user_roles.is_active': true })
      .select('roles.name');

    const roleNames = userRoles.length > 0 ? userRoles.map(r => r.name) : [];

    // Transform database fields to camelCase for API response
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      roles: roleNames,
      accountType: user.account_type,
      isOnboarded: user.is_onboarded || false,
      emailVerified: user.email_verified || false,
      emailVerifiedAt: user.email_verified_at,
      clubId: user.club_id,
      children: user.children,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  async updateUser(id, updates) {
    const {
      email,
      password,
      name,
      avatar,
      accountType,
      isOnboarded,
      emailVerified,
      clubId,
      children,
      ...otherUpdates
    } = updates;

    const updateData = { ...otherUpdates };

    if (email) {
      // Normalize email to lowercase for consistent comparison
      const normalizedEmail = email.toLowerCase();

      // Check if email is already taken by another user (case-insensitive)
      const existing = await this.db('users')
        .whereRaw('LOWER(email) = ?', [normalizedEmail])
        .whereNot({ id })
        .first();

      if (existing) {
        throw new EmailTakenError(normalizedEmail);
      }
      updateData.email = normalizedEmail;
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Map camelCase to snake_case for database
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (accountType !== undefined) updateData.account_type = accountType;
    if (isOnboarded !== undefined) updateData.is_onboarded = isOnboarded;
    if (emailVerified !== undefined) {
      updateData.email_verified = emailVerified;
      if (emailVerified) {
        updateData.email_verified_at = new Date();
      }
    }
    if (clubId !== undefined) updateData.club_id = clubId;
    if (children !== undefined) updateData.children = JSON.stringify(children);

    updateData.updated_at = new Date();

    const [updatedUser] = await this.db('users')
      .where({ id })
      .update(updateData)
      .returning([
        'id', 'email', 'name', 'avatar',
        'account_type', 'is_onboarded', 'email_verified', 'email_verified_at',
        'club_id', 'children', 'created_at', 'updated_at'
      ]);

    if (!updatedUser) {
      throw new UserNotFoundError(id);
    }

    // Get user roles from user_roles table
    const userRoles = await this.db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ 'user_roles.user_id': id, 'user_roles.is_active': true })
      .select('roles.name');

    const roleNames = userRoles.length > 0 ? userRoles.map(r => r.name) : [];

    // Transform to camelCase for response
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      roles: roleNames,
      accountType: updatedUser.account_type,
      isOnboarded: updatedUser.is_onboarded || false,
      emailVerified: updatedUser.email_verified || false,
      emailVerifiedAt: updatedUser.email_verified_at,
      clubId: updatedUser.club_id,
      children: updatedUser.children,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };
  }

  async deleteUser(id) {
    const deleted = await this.db('users').where({ id }).del();
    
    if (!deleted) {
      throw new Error('User not found');
    }
    
    return true;
  }

  // Role management methods
  async getUserRoles(userId) {
    const user = await this.getUserById(userId);
    return {
      roles: user.roles
    };
  }

  /**
   * Get the club ID for a user based on their active role
   * Returns the first active club_id found in user_roles
   * @param {number} userId - User ID
   * @returns {Promise<number|null>} Club ID or null if user has no club association
   */
  async getUserClubId(userId) {
    const role = await this.db('user_roles')
      .select('club_id')
      .where({ user_id: userId, is_active: true })
      .first();

    return role?.club_id || null;
  }
}
