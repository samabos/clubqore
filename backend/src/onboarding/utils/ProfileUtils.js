/**
 * Reusable utilities for profile management operations
 */

export class ProfileUtils {
  /**
   * Create a user profile
   */
  static async createProfile(userId, profileData, trx) {
    const fullName = this.generateFullName(profileData.firstName, profileData.lastName);

    const profileFields = {
      user_id: userId,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      date_of_birth: profileData.dateOfBirth,
      phone: profileData.phone,
      address: profileData.address,
      emergency_contact: profileData.emergencyContact,
      workplace: profileData.workplace,
      work_phone: profileData.workPhone,
      medical_info: profileData.medicalInfo,
      avatar: profileData.avatar,
      position: profileData.position,
      full_name: fullName,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Remove undefined values
    Object.keys(profileFields).forEach(key => {
      if (profileFields[key] === undefined) {
        delete profileFields[key];
      }
    });

    await trx('user_profiles').insert(profileFields);
    return profileFields;
  }

  /**
   * Update a user profile
   */
  static async updateProfile(userId, profileData, trx) {
    const fullName = this.generateFullName(profileData.firstName, profileData.lastName);

    const profileFields = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      date_of_birth: profileData.dateOfBirth,
      phone: profileData.phone,
      address: profileData.address,
      emergency_contact: profileData.emergencyContact,
      workplace: profileData.workplace,
      work_phone: profileData.workPhone,
      medical_info: profileData.medicalInfo,
      avatar: profileData.avatar,
      position: profileData.position,
      full_name: fullName,
      updated_at: new Date()
    };

    // Remove undefined values
    Object.keys(profileFields).forEach(key => {
      if (profileFields[key] === undefined) {
        delete profileFields[key];
      }
    });

    await trx('user_profiles')
      .where({ user_id: userId })
      .update(profileFields);

    return profileFields;
  }

  /**
   * Upsert (create or update) a user profile
   */
  static async upsertProfile(userId, profileData, trx) {
    const existing = await trx('user_profiles')
      .where({ user_id: userId })
      .first();

    if (existing) {
      return await this.updateProfile(userId, profileData, trx);
    } else {
      return await this.createProfile(userId, profileData, trx);
    }
  }

  /**
   * Generate full name from first and last name
   */
  static generateFullName(firstName, lastName) {
    if (!firstName && !lastName) return null;
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  /**
   * Format profile data for API response
   */
  static formatProfile(profile) {
    if (!profile) return null;

    return {
      id: profile.id?.toString(),
      userId: profile.user_id?.toString(),
      firstName: profile.first_name,
      lastName: profile.last_name,
      fullName: profile.full_name,
      dateOfBirth: profile.date_of_birth,
      phone: profile.phone,
      address: profile.address,
      emergencyContact: profile.emergency_contact,
      workplace: profile.workplace,
      workPhone: profile.work_phone,
      medicalInfo: profile.medical_info,
      avatar: profile.avatar,
      position: profile.position,
      createdAt: profile.created_at?.toISOString(),
      updatedAt: profile.updated_at?.toISOString()
    };
  }
}
