/**
 * Reusable validation utilities
 */

export class ValidationUtils {
  /**
   * Validate role data
   */
  static validateRoleData(roleData) {
    if (!roleData.role) {
      throw new Error('Role is required');
    }

    // Role-specific validation
    const requiredFields = {
      club_manager: ['personalData.firstName', 'personalData.lastName', 'clubData.name', 'clubData.type'],
      team_manager: ['personalData.firstName', 'personalData.lastName', 'personalData.dateOfBirth', 'personalData.certificationLevel', 'personalData.yearsOfExperience', 'personalData.bio'],
      staff: ['personalData.firstName', 'personalData.lastName', 'personalData.dateOfBirth', 'personalData.certificationLevel', 'personalData.yearsOfExperience', 'personalData.bio'],
      member: ['personalData.firstName', 'personalData.lastName', 'personalData.dateOfBirth'],
      parent: ['personalData.firstName', 'personalData.lastName', 'parentData.children']
    };

    const roleRequiredFields = requiredFields[roleData.role] || [];
    
    for (const field of roleRequiredFields) {
      const value = this.getNestedValue(roleData, field);
      if (!value) {
        throw new Error(`Required field missing for ${roleData.role} role: ${field}`);
      }
    }
  }

  /**
   * Validate role exists in database
   */
  static async validateRoleExists(roleName, db) {
    const role = await db('roles')
      .where({ name: roleName, is_active: true })
      .first();

    if (!role) {
      throw new Error(`Role '${roleName}' does not exist or is not active`);
    }

    return role;
  }

  /**
   * Validate user data
   */
  static validateUserData(userData) {
    if (!userData.email) {
      throw new Error('Email is required');
    }

    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (!userData.generatePassword && (!userData.password || userData.password.length < 6)) {
      throw new Error('Password must be at least 6 characters when not generating password');
    }
  }

  /**
   * Validate profile data
   */
  static validateProfileData(profileData) {
    if (profileData.firstName && profileData.firstName.length > 100) {
      throw new Error('First name must be 100 characters or less');
    }

    if (profileData.lastName && profileData.lastName.length > 100) {
      throw new Error('Last name must be 100 characters or less');
    }

    if (profileData.phone && !this.isValidPhone(profileData.phone)) {
      throw new Error('Invalid phone number format');
    }

    if (profileData.dateOfBirth && !this.isValidDate(profileData.dateOfBirth)) {
      throw new Error('Invalid date format');
    }
  }

  /**
   * Validate club data
   */
  static validateClubData(clubData) {
    if (!clubData.name) {
      throw new Error('Club name is required');
    }

    if (clubData.name.length > 255) {
      throw new Error('Club name must be 255 characters or less');
    }

    if (!clubData.type) {
      throw new Error('Club type is required');
    }

    const validTypes = ['sports', 'academic', 'social', 'professional', 'other'];
    if (!validTypes.includes(clubData.type)) {
      throw new Error(`Invalid club type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Validate child data
   */
  static validateChildData(childData) {
    if (!childData.firstName) {
      throw new Error('Child first name is required');
    }

    if (!childData.lastName) {
      throw new Error('Child last name is required');
    }

    if (!childData.dateOfBirth) {
      throw new Error('Child date of birth is required');
    }

    if (!this.isValidDate(childData.dateOfBirth)) {
      throw new Error('Invalid child date of birth format');
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  static isValidPhone(phone) {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  }

  /**
   * Validate date format
   */
  static isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
  }

  /**
   * Validate field length
   */
  static validateFieldLength(value, fieldName, maxLength) {
    if (value && value.length > maxLength) {
      throw new Error(`${fieldName} must be ${maxLength} characters or less`);
    }
  }
}
