import { UserRoleService } from './UserRoleService.js';
import { UserProfileService } from './UserProfileService.js';
import { UserPreferencesService } from './UserPreferencesService.js';
import { ClubService } from '../../club/services/ClubService.js';
import { AccountNumberService } from './AccountNumberService.js';

export class OnboardingService {
  constructor(db) {
    this.db = db;
    this.userRoleService = new UserRoleService(db);
    this.userProfileService = new UserProfileService(db);
    this.userPreferencesService = new UserPreferencesService(db);
    this.clubService = new ClubService(db);
    this.accountNumberService = new AccountNumberService(db);
  }

  /**
   * Complete initial onboarding (first role)
   */
  async completeInitialOnboarding(userId, roleData) {
    console.log('🔍 Starting completeInitialOnboarding...');
    const accountNumber = await this.userRoleService.addRole(userId, roleData);
    console.log('✅ addRole completed successfully, account number:', accountNumber);
    
    // Add a small delay to ensure transaction is fully committed
    // await new Promise(resolve => setTimeout(resolve, 100));
    
    //console.log('🔍 Getting user roles after transaction completion...');
    //const userRoles = await this.userRoleService.getUserRoles(userId);
    //console.log('✅ getUserRoles completed successfully');
    //console.log('🔍 userRoles object:', JSON.stringify(userRoles, null, 2));
    //console.log('🔍 userRoles.user:', JSON.stringify(userRoles.user, null, 2));

    const user = await this.db('users').whereRaw('id = ?', [userId]).first();
    
    const result = {
      success: true,
      accountNumber,
      user: {
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
        children: user.children
      },
      message: 'Onboarding completed successfully'
    };
    
    console.log('🔍 Final result being returned:', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Add additional role to existing user
   */
  async addUserRole(userId, roleData) {
    console.log('🔍 Starting addUserRole...');
    const accountNumber = await this.userRoleService.addRole(userId, roleData);
    console.log('✅ addRole completed successfully, account number:', accountNumber);
    
    // Add a small delay to ensure transaction is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🔍 Getting user roles after transaction completion...');
    const userRoles = await this.userRoleService.getUserRoles(userId);
    console.log('✅ getUserRoles completed successfully');
    
    return {
      success: true,
      accountNumber,
      user: userRoles.user,
      accounts: userRoles.accounts,
      message: 'Role added successfully'
    };
  }

  /**
   * Get comprehensive user status
   */
  async getUserStatus(userId) {
    return await this.userRoleService.getUserRoles(userId);
  }

  /**
   * Get detailed onboarding progress
   */
  async getOnboardingStatus(userId) {
    return await this.userRoleService.getOnboardingStatus(userId);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, profileData) {
    const profile = await this.userProfileService.upsertUserProfile(userId, profileData);
    return {
      success: true,
      profile,
      message: 'Profile updated successfully'
    };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const profile = await this.userProfileService.getUserProfile(userId);
    return { profile };
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferencesData) {
    const preferences = await this.userPreferencesService.updateUserPreferences(userId, preferencesData);
    return {
      success: true,
      preferences,
      message: 'Preferences updated successfully'
    };
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    const preferences = await this.userPreferencesService.getUserPreferences(userId);
    return { preferences };
  }

  /**
   * Upload and set user avatar
   */
  async uploadAvatar(userId, avatarUrl) {
    await this.userProfileService.updateAvatar(userId, avatarUrl);
    return {
      success: true,
      avatar_url: avatarUrl,
      message: 'Avatar updated successfully'
    };
  }

  /**
   * Get user children (for parents)
   */
  async getUserChildren(userId) {
    const children = await this.userRoleService.getUserChildren(userId);
    return { children };
  }

  /**
   * Add child for parent user
   */
  async addUserChild(userId, childData) {
    await this.userRoleService.createUserChildren(userId, [childData]);
    const children = await this.userRoleService.getUserChildren(userId);
    return {
      success: true,
      children,
      message: 'Child added successfully'
    };
  }

  /**
   * Get club details
   */
  async getClub(clubId) {
    const club = await this.clubService.getClubById(clubId);
    return { club };
  }

  /**
   * Update club information (club managers only)
   */
  async updateClub(clubId, updateData, userId) {
    const club = await this.clubService.updateClub(clubId, updateData, userId);
    return {
      success: true,
      club,
      message: 'Club updated successfully'
    };
  }

  /**
   * Generate account number (internal use)
   */
  async generateAccountNumber(_userId, _role, _clubId) {
    return {
      success: true,
      accountNumber: await this.accountNumberService.generateAccountNumber(),
      message: 'Account number generated successfully'
    };
  }

  /**
   * Get account details by account number
   */
  async getAccountByNumber(accountNumber) {
    const account = await this.accountNumberService.getAccountByNumber(accountNumber);
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  /**
   * Search accounts
   */
  async searchAccounts(query, role = null) {
    const accounts = await this.accountNumberService.searchAccounts(query, role);
    return { accounts };
  }

  /**
   * Set primary role
   */
  async setPrimaryRole(userId, role) {
    return await this.userRoleService.setPrimaryRole(userId, role);
  }

  /**
   * Deactivate role
   */
  async deactivateRole(userId, role, clubId = null) {
    return await this.userRoleService.deactivateRole(userId, role, clubId);
  }

  /**
   * Get profile completion status
   */
  async getProfileCompletion(userId) {
    const completion = await this.userProfileService.getProfileCompletion(userId);
    return {
      overallProgress: completion.progress,
      profileCompletion: completion,
      roleCompletion: [], // Will be populated by role service
      preferencesSet: await this.userPreferencesService.arePreferencesSet(userId),
      nextSteps: []
    };
  }

  /**
   * Update completion progress tracking
   */
  async updateCompletionProgress(userId, step, _role = null) {
    // Log the completion step
    // This could be expanded to include detailed tracking

    const newCompletion = await this.getProfileCompletion(userId);

    return {
      success: true,
      newProgress: newCompletion.overallProgress,
      completedStep: step,
      nextSuggestion: newCompletion.nextSteps[0]?.description
    };
  }
}
