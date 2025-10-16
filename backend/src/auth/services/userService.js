import { hashPassword } from '../password.js';

export class UserService {
  constructor(db) {
    this.db = db;
  }

  async getUserById(id) {
    const user = await this.db('users')
      .where({ id })
      .select([
        'id', 'email', 'name', 'avatar', 'roles', 'primary_role',
        'account_type', 'is_onboarded', 'email_verified', 'email_verified_at',
        'club_id', 'children', 'created_at', 'updated_at'
      ])
      .first();
    
    if (!user) {
      throw new Error('User not found');
    }

    // Transform database fields to camelCase for API response
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      roles: Array.isArray(user.roles) ? user.roles : ['member'],
      primaryRole: user.primary_role || 'member',
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
      primaryRole, 
      accountType,
      roles,
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
        throw new Error('Email already taken');
      }
      updateData.email = normalizedEmail;
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Map camelCase to snake_case for database
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (primaryRole !== undefined) updateData.primary_role = primaryRole;
    if (accountType !== undefined) updateData.account_type = accountType;
    if (roles !== undefined) updateData.roles = JSON.stringify(roles);
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
        'id', 'email', 'name', 'avatar', 'roles', 'primary_role',
        'account_type', 'is_onboarded', 'email_verified', 'email_verified_at',
        'club_id', 'children', 'created_at', 'updated_at'
      ]);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    // Transform to camelCase for response
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      roles: Array.isArray(updatedUser.roles) ? updatedUser.roles : ['member'],
      primaryRole: updatedUser.primary_role || 'member',
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
    
    // Define available roles based on current roles and account type
    const allRoles = ['member', 'parent', 'club_manager', 'admin'];
    let availableRoles = ['member']; // Everyone can be a member
    
    // Logic for available roles based on account type and current roles
    if (user.accountType === 'parent' || user.roles.includes('parent')) {
      availableRoles.push('parent');
    }
    
    if (user.accountType === 'club' || user.roles.includes('club_manager')) {
      availableRoles.push('club_manager');
    }
    
    // Admin can switch to any role
    if (user.roles.includes('admin')) {
      availableRoles = allRoles;
    }
    
    return {
      roles: user.roles,
      primaryRole: user.primaryRole,
      availableRoles: [...new Set(availableRoles)] // Remove duplicates
    };
  }

  async updateUserRole(userId, newPrimaryRole) {
    const user = await this.getUserById(userId);
    
    // Validate that the user has this role available
    const userRoles = await this.getUserRoles(userId);
    
    if (!userRoles.availableRoles.includes(newPrimaryRole)) {
      throw new Error('Invalid role: User is not authorized for this role');
    }
    
    // Update the primary role
    const updatedUser = await this.updateUser(userId, {
      primaryRole: newPrimaryRole
    });
    
    return {
      id: updatedUser.id,
      primaryRole: updatedUser.primaryRole,
      roles: updatedUser.roles
    };
  }

  async assignRoleToUser(userId, role) {
    const user = await this.getUserById(userId);
    
    // Validate role
    const validRoles = ['member', 'parent', 'club_manager', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }
    
    // Add role to user's roles if not already present
    let userRoles = Array.isArray(user.roles) ? user.roles : ['member'];
    if (!userRoles.includes(role)) {
      userRoles.push(role);
    }
    
    // Update user with new roles
    const updatedUser = await this.updateUser(userId, {
      roles: userRoles
    });
    
    return {
      id: updatedUser.id,
      roles: updatedUser.roles
    };
  }
}
