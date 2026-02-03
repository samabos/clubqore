import { AccountNumberService } from './AccountNumberService.js';
import { UserProfileService } from './UserProfileService.js';
import { UserPreferencesService } from './UserPreferencesService.js';
import { ClubService } from '../../club/services/ClubService.js';
import { ValidationUtils, AccountUtils, ChildUtils } from '../utils/index.js';

export class UserRoleService {
  constructor(db) {
    this.db = db;
    this.accountNumberService = new AccountNumberService(db);
    this.userProfileService = new UserProfileService(db);
    this.userPreferencesService = new UserPreferencesService(db);
    this.clubService = new ClubService(db);
  }

  /**
   * Add new role to user (main onboarding method)
   */
  async addRole(userId, roleData) {
    try {
      return await this.db.transaction(async (trx) => {
        console.log('🔍 Starting addRole transaction for userId:', userId, 'role:', roleData.role);
        
        // 1. Validate role data
        console.log('🔍 Validating role data...');
        ValidationUtils.validateRoleData(roleData);

        // 2. Check for duplicate roles for the same club
        console.log('🔍 Checking for duplicate roles...');
        await AccountUtils.checkDuplicateRole(userId, roleData.role, roleData.clubId, trx);

        // 3. Update/create user profile data (single source of truth)
        if (roleData.personalData) {
          console.log('🔍 Upserting user profile...');
          await this.userProfileService.upsertUserProfile(userId, roleData.personalData, trx);
        }

        // 4. Update/create user preferences (single source of truth)
        if (roleData.preferences) {
          console.log('🔍 Updating user preferences...');
          await this.userPreferencesService.updateUserPreferences(userId, roleData.preferences, trx);
        }

        let clubId = null;

        // 5. Handle role-specific logic - only club_manager supported
        if (roleData.role === 'club_manager' && roleData.clubData) {
          console.log('🔍 Creating club for club_manager...');
          // Create new club first, then reference it
          const club = await this.clubService.createClub(roleData.clubData, userId, trx);
          clubId = parseInt(club.id);
          console.log('🔍 Club created with ID:', clubId);
        } else {
          throw new Error('Only club_manager role is supported for onboarding. Members and parents are added via invitations.');
        }

        // 6. Generate unique account number for this role/club combination
        console.log('🔍 Generating account number...');
        const accountNumber = await this.accountNumberService.generateAccountNumber(trx);
        console.log('🔍 Generated account number:', accountNumber);

        // 7. Create role record with club association
        console.log('🔍 Inserting user role record...');
        await AccountUtils.createUserRole(userId, roleData.role, clubId, trx);

        // 8. Create account record with role-specific data and account number
        console.log('🔍 Inserting user account record...');
        await AccountUtils.createUserAccount(
          userId,
          roleData.role,
          clubId,
          accountNumber,
          trx,
          this.extractRoleSpecificData(roleData)
        );

        // 10. Update user record
        //console.log('🔍 Updating user record...');
        //const isFirstRole = await this.isFirstRole(userId, trx);
        const updateData = {
          is_onboarded: true,
          onboarding_completed_at: new Date(),
          updated_at: new Date(),
          primary_role: roleData.role,
          club_id: clubId || null
        };

        // Set primary role if this is the first role
        //if (isFirstRole) {
        //  updateData.primary_role = roleData.role;
        //}

        var updateResult = await trx('users')
          .where({ id: userId })
          .update(updateData);

        console.log('✅ Transaction completed successfully, returning account number:', accountNumber);
        return accountNumber;
      });
    } catch (error) {
      console.error('❌ Transaction failed in addRole:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        userId,
        roleData: JSON.stringify(roleData, null, 2)
      });
      throw error;
    }
  }

  /**
   * Get all user roles and accounts
   */
  async getUserRoles(userId) {
    try {
      // Use a single connection for all operations to avoid pool exhaustion
      return await this.db.transaction(async (trx) => {
        console.log('🔍 Getting user roles with single transaction connection...');
        
        // Get user basic info
        const user = await trx('users')
          .where({ id: userId })
          .first();

        if (!user) {
          throw new Error('User not found');
        }

        // Get user profile with error handling
        let profile;
        try {
          profile = await this.userProfileService.getUserProfile(userId, trx);
        } catch (profileError) {
          console.error('Error getting user profile in getUserRoles:', profileError);
          // Return a minimal profile if profile fetch fails
          profile = {
            firstName: null,
            lastName: null,
            fullName: null,
            avatar: null
          };
        }

        // Get all user accounts with club details
        const accounts = await trx('user_accounts')
          .leftJoin('clubs', 'user_accounts.club_id', 'clubs.id')
          .where('user_accounts.user_id', userId)
          .where('user_accounts.is_active', true)
          .select(
            'user_accounts.*',
            'clubs.name as club_name',
            'clubs.club_type'
          )
          .orderBy('user_accounts.created_at', 'desc');

        const accountsWithDetails = accounts.map(account => ({
          accountNumber: account.account_number,
          role: account.role,
          clubId: account.club_id?.toString(),
          clubName: account.club_name,
          clubType: account.club_type,
          isActive: account.is_active,
          onboardingCompletedAt: account.onboarding_completed_at?.toISOString(),
          createdAt: account.created_at.toISOString(),
          metadata: this.extractAccountMetadata(account)
        }));

        // Determine available roles (roles user doesn't have yet)
        const existingRoles = accounts.map(a => a.role);
        const allRoles = ['club_manager', 'team_manager', 'staff', 'member', 'parent'];
        const availableRoles = allRoles.filter(role => {
          if (role === 'member') return true; // Users can be members of multiple clubs
          return !existingRoles.includes(role);
        });

        console.log('✅ getUserRoles completed successfully');
        
        return {
          user: {
            id: user.id.toString(),
            email: user.email,
            name: profile.fullName || profile.firstName || 'User',
            avatar: profile.avatar,
            primaryRole: user.primary_role,
            isOnboarded: user.is_onboarded
          },
          accounts: accountsWithDetails,
          availableRoles
        };
      });
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive onboarding status
   */
  async getOnboardingStatus(userId) {
    const userRoles = await this.getUserRoles(userId);
    const profileCompletion = await this.userProfileService.getProfileCompletion(userId);
    const preferencesSet = await this.userPreferencesService.arePreferencesSet(userId);

    // Calculate completion progress
    const profileProgress = profileCompletion.progress;
    const rolesProgress = userRoles.accounts.length > 0 ? 100 : 0;
    const preferencesProgress = preferencesSet ? 100 : 0;
    const overallProgress = Math.round((profileProgress + rolesProgress + preferencesProgress) / 3);

    // Determine current step
    let currentStep = 'profile';
    if (profileCompletion.completed && userRoles.accounts.length === 0) {
      currentStep = 'role';
    } else if (profileCompletion.completed && userRoles.accounts.length > 0 && !preferencesSet) {
      currentStep = 'preferences';
    } else if (profileCompletion.completed && userRoles.accounts.length > 0 && preferencesSet) {
      currentStep = 'completed';
    }

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      profileCompletion,
      userRoles.accounts,
      preferencesSet
    );

    return {
      isOnboarded: userRoles.user.isOnboarded,
      currentStep,
      completedSteps: this.getCompletedSteps(profileCompletion, userRoles.accounts, preferencesSet),
      availableRoles: userRoles.availableRoles,
      completionProgress: {
        profile: profileProgress,
        roles: rolesProgress,
        preferences: preferencesProgress,
        overall: overallProgress
      },
      recommendedActions,
      accountNumbers: userRoles.accounts.map(account => ({
        accountNumber: account.accountNumber,
        role: account.role,
        clubName: account.clubName
      }))
    };
  }

  /**
   * Switch primary role
   */
  async setPrimaryRole(userId, role) {
    // Validate user has this role
    const userRole = await this.db('user_roles')
      .where({ user_id: userId, role, is_active: true })
      .first();

    if (!userRole) {
      throw new Error('User does not have this active role');
    }

    await this.db('users')
      .where({ id: userId })
      .update({ primary_role: role, updated_at: new Date() });

    return { success: true, newPrimaryRole: role };
  }

  /**
   * Deactivate/remove role
   */
  async deactivateRole(userId, role, clubId = null) {
    await this.db.transaction(async (trx) => {
      // Deactivate role
      const roleQuery = trx('user_roles')
        .where({ user_id: userId, role });
      
      if (clubId) {
        roleQuery.where({ club_id: clubId });
      }

      await roleQuery.update({ is_active: false, updated_at: new Date() });

      // Deactivate corresponding account
      const accountQuery = trx('user_accounts')
        .where({ user_id: userId, role });
      
      if (clubId) {
        accountQuery.where({ club_id: clubId });
      }

      await accountQuery.update({ is_active: false, updated_at: new Date() });

      // If this was the primary role, update to another active role
      const user = await trx('users').where({ id: userId }).first();
      if (user.primary_role === role) {
        const remainingRole = await trx('user_roles')
          .where({ user_id: userId, is_active: true })
          .first();

        if (remainingRole) {
          await trx('users')
            .where({ id: userId })
            .update({ primary_role: remainingRole.role, updated_at: new Date() });
        }
      }
    });

    return { success: true, message: 'Role deactivated successfully' };
  }

  /**
   * Create user children records (for parents)
   */
  async createUserChildren(parentUserId, children, trx = this.db) {
    for (const child of children) {
      // Ensure child has a user account before creating the relationship
      if (!child.childUserId) {
        throw new Error('Child must have a user account (childUserId) to create relationship');
      }
      
      await trx('user_children').insert({
        parent_user_id: parentUserId,
        child_user_id: child.childUserId,
        relationship: child.relationship,
        club_id: child.clubId || null,
        membership_code: child.membershipCode || null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  /**
   * Create child user and relationship (for use by other services)
   */
  async createChildUserAndRelationship(parentUserId, childData, trx = this.db) {
    return await ChildUtils.createChildUserAndRelationship(parentUserId, childData, trx);
  }

  /**
   * Get user children with details
   */
  async getUserChildren(parentUserId) {
    return await ChildUtils.getChildrenForParent(parentUserId, this.db);
  }

  // Private helper methods



  extractRoleSpecificData(roleData) {
    // Only club_manager is supported - no role-specific data needed
    return {};
  }

  extractAccountMetadata(account) {
    const metadata = {};
    
    if (account.position) metadata.position = account.position;
    if (account.parent_phone) metadata.parentPhone = account.parent_phone;

    return metadata;
  }

  async isFirstRole(userId, trx) {
    const count = await trx('user_roles')
      .where({ user_id: userId })
      .count('id as count')
      .first();

    return parseInt(count.count) === 1; // This is the first role
  }

  generateRecommendedActions(profileCompletion, accounts, preferencesSet) {
    const actions = [];

    if (!profileCompletion.completed) {
      actions.push({
        action: 'complete_profile',
        description: 'Complete your profile with required information',
        category: 'profile',
        priority: 1
      });
    }

    if (accounts.length === 0) {
      actions.push({
        action: 'add_first_role',
        description: 'Complete your onboarding by adding your first role',
        category: 'role',
        priority: 2
      });
    }

    if (!preferencesSet) {
      actions.push({
        action: 'set_preferences',
        description: 'Customize your notification and privacy settings',
        category: 'preferences',
        priority: 3
      });
    }

    if (profileCompletion.completed && accounts.length > 0 && preferencesSet) {
      actions.push({
        action: 'explore_features',
        description: 'Explore additional features and roles available to you',
        category: 'verification',
        priority: 4
      });
    }

    return actions;
  }

  getCompletedSteps(profileCompletion, accounts, preferencesSet) {
    const steps = [];
    
    if (profileCompletion.completed) steps.push('profile');
    if (accounts.length > 0) steps.push('role');
    if (preferencesSet) steps.push('preferences');

    return steps;
  }
}
