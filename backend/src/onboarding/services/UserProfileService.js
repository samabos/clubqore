export class UserProfileService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get user's complete profile
   */
  async getUserProfile(userId, trx = null) {
    const db = trx || this.db;
    const profile = await db('user_profiles')
      .where({ user_id: userId })
      .first();

    if (!profile) {
      // Return empty profile structure instead of creating to avoid recursion
      return this.formatProfile({
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return this.formatProfile(profile);
  }

  /**
   * Create or update user profile (single source of truth)
   */
  async upsertUserProfile(userId, profileData, trx = null) {
    console.log('🔍 UserProfileService.upsertUserProfile called for userId:', userId);
    console.log('🔍 Profile data:', JSON.stringify(profileData, null, 2));
    
    const db = trx || this.db;
    
    console.log('🔍 Checking for existing profile...');
    const existing = await db('user_profiles')
      .where({ user_id: userId })
      .first();
    
    console.log('🔍 Existing profile found:', !!existing);

    // Generate full name from first and last name
    const fullName = this.generateFullName(
      profileData.firstName || (existing?.first_name),
      profileData.lastName || (existing?.last_name)
    );

    console.log('🔍 Generated full name:', fullName);

    // Handle address dual-write (both TEXT and JSONB)
    let addressText = null;
    let addressStructured = null;

    if (profileData.address) {
      if (typeof profileData.address === 'string') {
        // Legacy string format - write to TEXT column only
        addressText = profileData.address;
      } else if (typeof profileData.address === 'object') {
        // New structured format - write to both columns
        addressStructured = JSON.stringify(profileData.address);
        // Also write to TEXT column for backward compatibility (use street or full address)
        addressText = profileData.address.street || null;
      }
    }

    const profileFields = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      date_of_birth: profileData.dateOfBirth,
      phone: profileData.phone,
      address: addressText,
      address_structured: addressStructured,
      emergency_contact: profileData.emergencyContact ? JSON.stringify(profileData.emergencyContact) : undefined,
      workplace: profileData.workplace,
      work_phone: profileData.workPhone,
      medical_info: profileData.medicalInfo,
      full_name: fullName,
      updated_at: new Date()
    };

    console.log('🔍 Profile fields prepared:', JSON.stringify(profileFields, null, 2));

    // Remove undefined values
    Object.keys(profileFields).forEach(key => {
      if (profileFields[key] === undefined) {
        delete profileFields[key];
      }
    });

    console.log('🔍 Profile fields after cleanup:', JSON.stringify(profileFields, null, 2));

    if (existing) {
      console.log('🔍 Updating existing profile...');
      await db('user_profiles')
        .where({ user_id: userId })
        .update(profileFields);
      
      console.log('🔍 Profile updated, fetching updated profile...');
      // Get updated profile directly to avoid potential recursion
      const updatedProfile = await db('user_profiles')
        .where({ user_id: userId })
        .first();
      
      console.log('🔍 Updated profile fetched, formatting...');
      const formatted = this.formatProfile(updatedProfile);
      console.log('🔍 Profile formatted successfully');
      return formatted;
    } else {
      console.log('🔍 Inserting new profile...');
      await db('user_profiles').insert({
        user_id: userId,
        ...profileFields,
        created_at: new Date()
      });
      
      console.log('🔍 Profile inserted, fetching inserted profile...');
      // Get the inserted profile
      const insertedProfile = await db('user_profiles')
        .where({ user_id: userId })
        .first();
      
      console.log('🔍 Inserted profile fetched, formatting...');
      const formatted = this.formatProfile(insertedProfile);
      console.log('🔍 Profile formatted successfully');
      return formatted;
    }
  }

  /**
   * Update profile avatar
   */
  async updateAvatar(userId, avatarUrl) {
    await this.db('user_profiles')
      .where({ user_id: userId })
      .update({ avatar: avatarUrl, updated_at: new Date() });
    
    return avatarUrl;
  }

  /**
   * Check if profile is complete based on required fields
   */
  async isProfileComplete(userId) {
    const profile = await this.getUserProfile(userId);
    
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
    return requiredFields.every(field => profile[field]);
  }

  /**
   * Get profile completion status with detailed information
   */
  async getProfileCompletion(userId) {
    const profile = await this.getUserProfile(userId);
    
    const requiredFields = [
      { field: 'firstName', description: 'First name is required' },
      { field: 'lastName', description: 'Last name is required' },
      { field: 'dateOfBirth', description: 'Date of birth is required' }
    ];
    
    const optionalFields = [
      { field: 'phone', description: 'Phone number for contact' },
      { field: 'address', description: 'Home address' },
      { field: 'avatar', description: 'Profile photo' }
    ];

    const missingRequired = requiredFields.filter(({ field }) => !profile[field]);
    const missingOptional = optionalFields.filter(({ field }) => !profile[field]);

    const completedRequired = requiredFields.length - missingRequired.length;
    const completedOptional = optionalFields.length - missingOptional.length;

    const progress = Math.round(
      ((completedRequired / requiredFields.length) * 70) + 
      ((completedOptional / optionalFields.length) * 30)
    );

    return {
      completed: missingRequired.length === 0,
      progress,
      missingFields: [...missingRequired, ...missingOptional]
    };
  }

  /**
   * Create empty profile for new users
   */
  async createEmptyProfile(userId, trx = null) {
    const db = trx || this.db;
    await db('user_profiles').insert({
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    return this.formatProfile({
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  /**
   * Format profile data for API response
   */
  formatProfile(profile) {
    if (!profile) {
      return {
        firstName: null,
        lastName: null,
        fullName: null,
        dateOfBirth: null,
        phone: null,
        address: null,
        emergencyContact: null,
        workplace: null,
        workPhone: null,
        medicalInfo: null,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Parse address - prefer structured format, fallback to text
    let address = null;
    if (profile.address_structured) {
      try {
        address = JSON.parse(profile.address_structured);
      } catch (e) {
        console.error('Failed to parse address_structured:', e);
        address = profile.address || null;
      }
    } else {
      address = profile.address || null;
    }

    // Parse emergency contact if it's JSON
    let emergencyContact = profile.emergency_contact;
    if (typeof emergencyContact === 'string') {
      try {
        emergencyContact = JSON.parse(emergencyContact);
      } catch (e) {
        // It's already a plain object or null
      }
    }

    return {
      firstName: profile.first_name || null,
      lastName: profile.last_name || null,
      fullName: profile.full_name || null,
      dateOfBirth: profile.date_of_birth || null,
      phone: profile.phone || null,
      address,
      emergencyContact,
      workplace: profile.workplace || null,
      workPhone: profile.work_phone || null,
      medicalInfo: profile.medical_info || null,
      avatar: profile.avatar || null,
      createdAt: profile.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: profile.updated_at?.toISOString() || new Date().toISOString()
    };
  }

  /**
   * Generate full name from first and last name
   */
  generateFullName(firstName, lastName) {
    const parts = [firstName, lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : null;
  }
}
