import { AccountNumberService } from './AccountNumberService.js';
import { UserProfileService } from './UserProfileService.js';
import { ClubService } from './ClubService.js';
import { PasswordUtils } from '../utils/PasswordUtils.js';
import { emailService } from '../../services/emailService.js';

export class TeamManagerService {
  constructor(db) {
    this.db = db;
    this.accountNumberService = new AccountNumberService(db);
    this.userProfileService = new UserProfileService(db);
    this.clubService = new ClubService(db);
  }

  /**
   * Create a new team manager (coach) account
   * @param {number} clubId - Club ID
   * @param {number} creatorUserId - User ID of the club manager creating the account
   * @param {object} teamManagerData - Team manager data
   * @returns {Promise<object>} - Created team manager details with temporary password
   */
  async createTeamManager(clubId, creatorUserId, teamManagerData) {
    try {
      // 1. Validate that creator is a club manager for this club
      await this.validateClubManagerAuthorization(creatorUserId, clubId);

      // 2. Validate club exists and is active
      const club = await this.validateClubExists(clubId);

      // 3. Check email uniqueness
      await this.validateEmailUniqueness(teamManagerData.email);

      // 4. Generate secure temporary password
      const temporaryPassword = PasswordUtils.generateSecurePassword(12);
      const passwordHash = await PasswordUtils.hashPassword(temporaryPassword);

      // 5. Create user account in transaction
      return await this.db.transaction(async (trx) => {
        // Create user account
        const [userId] = await trx('users').insert({
          email: teamManagerData.email.toLowerCase(),
          password_hash: passwordHash,
          primary_role: 'club_coach',
          email_verified: false,
          is_onboarded: false,
          created_at: new Date(),
          updated_at: new Date()
        }).returning('id');

        const finalUserId = userId?.id || userId;

        // Create user profile
        await trx('user_profiles').insert({
          user_id: finalUserId,
          first_name: teamManagerData.firstName,
          last_name: teamManagerData.lastName,
          full_name: `${teamManagerData.firstName} ${teamManagerData.lastName}`,
          phone: teamManagerData.phone || null,
          date_of_birth: teamManagerData.dateOfBirth || null,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Generate account number
        const accountNumber = await this.accountNumberService.generateAccountNumber(trx);

        // Create user role
        await trx('user_roles').insert({
          user_id: finalUserId,
          role: 'club_coach',
          club_id: clubId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Create user account record
        await trx('user_accounts').insert({
          user_id: finalUserId,
          account_number: accountNumber,
          role: 'club_coach',
          club_id: clubId,
          position: teamManagerData.specialization || 'Coach',
          is_active: true,
          onboarding_completed_at: null,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Get club manager details for email
        const clubManager = await trx('user_profiles')
          .where('user_id', creatorUserId)
          .first();

        const clubManagerName = clubManager 
          ? `${clubManager.first_name} ${clubManager.last_name}` 
          : 'Your Club Manager';

        // 6. Send welcome email with credentials
        if (teamManagerData.sendLoginEmail !== false) {
          try {
            await emailService.sendTeamManagerWelcome({
              to: teamManagerData.email,
              userName: `${teamManagerData.firstName} ${teamManagerData.lastName}`,
              email: teamManagerData.email,
              temporaryPassword: temporaryPassword,
              clubName: club.name,
              clubManagerName: clubManagerName,
              accountNumber: accountNumber,
              loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
            });
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the transaction if email fails
            // We can resend the email later if needed
          }
        }

        return {
          success: true,
          teamManager: {
            id: finalUserId.toString(),
            accountNumber: accountNumber,
            email: teamManagerData.email,
            fullName: `${teamManagerData.firstName} ${teamManagerData.lastName}`,
            role: 'club_coach',
            clubId: clubId.toString(),
            clubName: club.name,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          temporaryPassword: temporaryPassword,
          emailSent: teamManagerData.sendLoginEmail !== false,
          message: 'Team manager account created successfully'
        };
      });
    } catch (error) {
      console.error('Error creating team manager:', error);
      throw error;
    }
  }

  /**
   * Get all team managers for a club
   * @param {number} clubId - Club ID
   * @returns {Promise<array>} - List of team managers
   */
  async getTeamManagers(clubId) {
    const teamManagers = await this.db('user_accounts')
      .join('users', 'user_accounts.user_id', 'users.id')
      .join('user_profiles', 'user_accounts.user_id', 'user_profiles.user_id')
      .where('user_accounts.club_id', clubId)
      .where('user_accounts.role', 'club_coach')
      .select(
        'user_accounts.id',
        'user_accounts.account_number',
        'user_accounts.user_id',
        'users.email',
        'user_profiles.first_name',
        'user_profiles.last_name',
        'user_profiles.full_name',
        'user_profiles.phone',
        'user_accounts.position',
        'user_accounts.is_active',
        'user_accounts.created_at'
      )
      .orderBy('user_accounts.created_at', 'desc');

    return teamManagers.map(tm => ({
      id: tm.user_id.toString(),
      accountNumber: tm.account_number,
      email: tm.email,
      firstName: tm.first_name,
      lastName: tm.last_name,
      fullName: tm.full_name,
      phone: tm.phone,
      specialization: tm.position,
      isActive: tm.is_active,
      createdAt: tm.created_at.toISOString()
    }));
  }

  /**
   * Get team manager details by ID
   * @param {number} teamManagerId - Team manager user ID
   * @param {number} clubId - Club ID
   * @returns {Promise<object>} - Team manager details
   */
  async getTeamManagerById(teamManagerId, clubId) {
    const teamManager = await this.db('user_accounts')
      .join('users', 'user_accounts.user_id', 'users.id')
      .join('user_profiles', 'user_accounts.user_id', 'user_profiles.user_id')
      .where('user_accounts.user_id', teamManagerId)
      .where('user_accounts.club_id', clubId)
      .where('user_accounts.role', 'club_coach')
      .select(
        'user_accounts.account_number',
        'users.email',
        'user_profiles.first_name',
        'user_profiles.last_name',
        'user_profiles.full_name',
        'user_profiles.phone',
        'user_profiles.date_of_birth',
        'user_accounts.position',
        'user_accounts.is_active',
        'user_accounts.created_at'
      )
      .first();

    if (!teamManager) {
      throw new Error('Team manager not found');
    }

    return {
      accountNumber: teamManager.account_number,
      email: teamManager.email,
      firstName: teamManager.first_name,
      lastName: teamManager.last_name,
      fullName: teamManager.full_name,
      phone: teamManager.phone,
      dateOfBirth: teamManager.date_of_birth,
      specialization: teamManager.position,
      isActive: teamManager.is_active,
      createdAt: teamManager.created_at.toISOString()
    };
  }

  /**
   * Update team manager details
   * @param {number} teamManagerId - Team manager user ID
   * @param {number} clubId - Club ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Updated team manager
   */
  async updateTeamManager(teamManagerId, clubId, updateData) {
    return await this.db.transaction(async (trx) => {
      // Update user profile if personal data provided
      if (updateData.firstName || updateData.lastName || updateData.phone) {
        const profileUpdate = {};
        if (updateData.firstName) profileUpdate.first_name = updateData.firstName;
        if (updateData.lastName) profileUpdate.last_name = updateData.lastName;
        if (updateData.phone) profileUpdate.phone = updateData.phone;

        if (updateData.firstName && updateData.lastName) {
          profileUpdate.full_name = `${updateData.firstName} ${updateData.lastName}`;
        }

        await trx('user_profiles')
          .where('user_id', teamManagerId)
          .update({
            ...profileUpdate,
            updated_at: new Date()
          });
      }

      // Update account-specific data
      if (updateData.specialization) {
        await trx('user_accounts')
          .where('user_id', teamManagerId)
          .where('club_id', clubId)
          .where('role', 'club_coach')
          .update({
            position: updateData.specialization,
            updated_at: new Date()
          });
      }

      return await this.getTeamManagerById(teamManagerId, clubId);
    });
  }

  /**
   * Deactivate team manager
   * @param {number} teamManagerId - Team manager user ID
   * @param {number} clubId - Club ID
   * @returns {Promise<object>} - Result
   */
  async deactivateTeamManager(teamManagerId, clubId) {
    await this.db.transaction(async (trx) => {
      // Deactivate user role
      await trx('user_roles')
        .where('user_id', teamManagerId)
        .where('club_id', clubId)
        .where('role', 'club_coach')
        .update({
          is_active: false,
          updated_at: new Date()
        });

      // Deactivate user account
      await trx('user_accounts')
        .where('user_id', teamManagerId)
        .where('club_id', clubId)
        .where('role', 'club_coach')
        .update({
          is_active: false,
          updated_at: new Date()
        });
    });

    return {
      success: true,
      message: 'Team manager deactivated successfully'
    };
  }

  // Private helper methods

  /**
   * Validate that user is a club manager for the specified club
   */
  async validateClubManagerAuthorization(userId, clubId) {
    const isManager = await this.db('user_roles')
      .where('user_id', userId)
      .where('club_id', clubId)
      .where('role', 'club_manager')
      .where('is_active', true)
      .first();

    if (!isManager) {
      throw new Error('UNAUTHORIZED_CLUB_ACCESS: User is not a club manager for this club');
    }

    return true;
  }

  /**
   * Validate that club exists and is active
   */
  async validateClubExists(clubId) {
    const club = await this.db('clubs')
      .where('id', clubId)
      .where('is_active', true)
      .first();

    if (!club) {
      throw new Error('CLUB_NOT_FOUND: Club does not exist or is not active');
    }

    return club;
  }

  /**
   * Validate email is unique across the system
   */
  async validateEmailUniqueness(email) {
    const existingUser = await this.db('users')
      .where('email', email.toLowerCase())
      .first();

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS: This email is already registered');
    }

    return true;
  }
}
