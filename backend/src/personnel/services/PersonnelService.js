import { PasswordUtils } from '../../onboarding/utils/index.js';
import { emailService } from '../../services/emailService.js';
import { EmailOutboxService } from '../../services/emailOutboxService.js';
import { config } from '../../config/index.js';
import { RoleService } from '../../onboarding/services/RoleService.js';

export class PersonnelService {
  constructor(db) {
    this.db = db;
    this.roleService = new RoleService(db);
  }

  /**
   * Get club personnel (users with team_manager or staff role for a specific club)
   */
  async getClubPersonnel(clubId) {
    try {
      console.log('Getting personnel for club:', clubId);
      const personnel = await this.db('user_roles')
        .join('users', 'user_roles.user_id', 'users.id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .leftJoin('user_profiles', 'user_roles.user_id', 'user_profiles.user_id')
        .where('user_roles.club_id', clubId)
        .whereIn('roles.name', ['team_manager', 'staff'])
        .where('user_roles.is_active', true)
        .select(
          'user_roles.id as user_role_id',
          'user_roles.user_id',
          'roles.name as role',
          'user_roles.club_id',
          'user_roles.created_at as role_created_at',
          'users.email',
          'users.is_onboarded',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.phone',
          'user_profiles.avatar',
          'user_profiles.date_of_birth',
          'user_profiles.certification_level',
          'user_profiles.years_of_experience',
          'user_profiles.bio'
        )
        .orderBy('user_profiles.first_name', 'asc');

      console.log('Raw personnel query result:', personnel);

      const mappedPersonnel = personnel.map(person => ({
        userRoleId: person.user_role_id,
        userId: person.user_id,
        role: person.role,
        clubId: person.club_id,
        email: person.email,
        firstName: person.first_name,
        lastName: person.last_name,
        fullName: person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : null,
        phone: person.phone,
        avatar: person.avatar,
        dateOfBirth: person.date_of_birth,
        certificationLevel: person.certification_level,
        yearsOfExperience: person.years_of_experience,
        bio: person.bio,
        isOnboarded: person.is_onboarded,
        roleCreatedAt: person.role_created_at?.toISOString()
      }));

      console.log('Mapped personnel result:', mappedPersonnel);
      return mappedPersonnel;
    } catch (error) {
      console.error('Error getting club personnel:', error);
      throw error;
    }
  }

  /**
   * Add personnel to club (create user_role and user_profile)
   */
  async addPersonnelToClub(clubId, personnelData) {
    try {
      // 1. Generate secure temporary password
      const bcrypt = await import('bcrypt');
      const temporaryPassword = PasswordUtils.generateSecurePassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      console.log('🔑 Generated temporary password for new personnel');
      console.log('✨ Creating new user with email:', personnelData.email);

      const result = await this.db.transaction(async (trx) => {
        // 2. Create new user
        const newUserResult = await trx('users').insert({
          email: personnelData.email,
          password: hashedPassword,
          is_onboarded: false,
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        }).returning('id');

        const userId = newUserResult[0].id || newUserResult[0];

        // 3. Create user profile
        await trx('user_profiles').insert({
          user_id: userId,
          first_name: personnelData.firstName,
          last_name: personnelData.lastName,
          phone: personnelData.phone || null,
          avatar: personnelData.avatar || null,
          date_of_birth: personnelData.dateOfBirth || null,
          certification_level: personnelData.certificationLevel || null,
          years_of_experience: personnelData.yearsOfExperience || null,
          bio: personnelData.bio || null,
          created_at: new Date(),
          updated_at: new Date()
        });

        // 4. Get role ID for the specified role (default to 'staff')
        const roleName = personnelData.role || 'staff';
        const roleId = await this.roleService.getRoleIdByName(roleName);

        // 5. Create user role
        await trx('user_roles').insert({
          user_id: userId,
          role_id: roleId,
          club_id: clubId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });

        // 6. Return the created personnel record
        const personnel = await this.getClubPersonnel(clubId);
        console.log('Personnel array:', personnel);
        console.log('Looking for userId:', userId);

        if (!Array.isArray(personnel)) {
          console.error('getClubPersonnel did not return an array:', personnel);
          throw new Error('Failed to retrieve personnel list');
        }

        const newPersonnel = personnel.find(p => p.userId === userId);
        if (!newPersonnel) {
          console.error('Could not find newly created personnel with userId:', userId);
          console.log('Available personnel:', personnel.map(p => ({ userId: p.userId, role: p.role })));
        }

        return { newPersonnel, userId };
      });

      // 7. Send welcome email with logging using database template
      console.log('📧 Attempting to send welcome email...');
      try {
        // Get club info for email
        const club = await this.db('clubs')
          .where({ id: clubId })
          .first();

        console.log('📧 Club info:', club?.name);
        console.log('📧 Sending email to:', personnelData.email);

        const roleName = personnelData.role || 'staff';
        const roleTitle = roleName === 'team_manager' ? 'Team Manager' : 'Staff';

        // Prepare template data
        const templateData = {
          userName: `${personnelData.firstName} ${personnelData.lastName}`,
          email: personnelData.email,
          temporaryPassword: temporaryPassword,
          clubName: club?.name || 'ClubQore',
          roleTitle: roleTitle,
          loginUrl: `${config.app.frontendUrl}/login`
        };

        // Use EmailOutboxService to send and log the email with database template
        const outbox = new EmailOutboxService(this.db, emailService);
        await outbox.sendAndLog({
          to: personnelData.email,
          templateKey: 'personnel_welcome',
          templateData
        });

        console.log(`✅ Welcome email sent and logged for ${personnelData.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
        console.error('❌ Error stack:', emailError.stack);
        // Don't fail the entire operation if email fails
      }

      return result.newPersonnel;
    } catch (error) {
      console.error('Error adding personnel to club:', error);
      throw error;
    }
  }

  /**
   * Update personnel record
   */
  async updatePersonnel(userRoleId, updateData) {
    try {
      return await this.db.transaction(async (trx) => {
        // Get the user_role record to find the user_id
        const userRole = await trx('user_roles')
          .where({ id: userRoleId })
          .first();

        if (!userRole) {
          throw new Error('Personnel record not found');
        }

        // Update user profile if profile data is provided
        if (updateData.firstName || updateData.lastName || updateData.phone || updateData.avatar) {
          const profileUpdate = {
            updated_at: new Date()
          };

          if (updateData.firstName) profileUpdate.first_name = updateData.firstName;
          if (updateData.lastName) profileUpdate.last_name = updateData.lastName;
          if (updateData.phone !== undefined) profileUpdate.phone = updateData.phone;
          if (updateData.avatar !== undefined) profileUpdate.avatar = updateData.avatar;

          await trx('user_profiles')
            .where({ user_id: userRole.user_id })
            .update(profileUpdate);
        }

        // Update user role if role data is provided
        if (updateData.isActive !== undefined) {
          await trx('user_roles')
            .where({ id: userRoleId })
            .update({
              is_active: updateData.isActive,
              updated_at: new Date()
            });
        }

        // Return updated personnel record
        const personnel = await this.getClubPersonnel(userRole.club_id);
        return personnel.find(p => p.userRoleId === userRoleId);
      });
    } catch (error) {
      console.error('Error updating personnel:', error);
      throw error;
    }
  }

  /**
   * Remove personnel from club (deactivate user_role)
   */
  async removePersonnelFromClub(userRoleId) {
    try {
      await this.db('user_roles')
        .where({ id: userRoleId })
        .update({
          is_active: false,
          updated_at: new Date()
        });

      return { success: true, message: 'Personnel removed from club successfully' };
    } catch (error) {
      console.error('Error removing personnel from club:', error);
      throw error;
    }
  }

  /**
   * Get all team managers for a club
   * @param {number} clubId - Club ID
   * @returns {Promise<array>} - List of team managers
   */
  async getTeamManagers(clubId) {
    try {
      const teamManagers = await this.db('user_roles')
        .join('users', 'user_roles.user_id', 'users.id')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .leftJoin('user_profiles', 'user_roles.user_id', 'user_profiles.user_id')
        .leftJoin('user_accounts', function() {
          this.on('user_roles.user_id', '=', 'user_accounts.user_id')
              .andOn('user_roles.club_id', '=', 'user_accounts.club_id');
        })
        .where('user_roles.club_id', clubId)
        .whereIn('roles.name', ['team_manager', 'staff'])
        .where('user_roles.is_active', true)
        .select(
          'user_roles.id',
          'user_roles.user_id',
          'users.email',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'roles.name as role_name',
          'user_roles.is_active',
          'user_accounts.account_number',
          'user_roles.created_at'
        )
        .orderBy('user_roles.created_at', 'desc');

      return teamManagers.map(tm => ({
        id: tm.id,
        user_id: tm.user_id,
        first_name: tm.first_name || '',
        last_name: tm.last_name || '',
        email: tm.email || '',
        role: tm.role_name || 'team_manager',
        is_active: tm.is_active,
        account_number: tm.account_number || null,
        fullName: `${tm.first_name || ''} ${tm.last_name || ''}`.trim() || 'Unknown'
      }));
    } catch (error) {
      console.error('Error in getTeamManagers:', error);
      throw error;
    }
  }
}
