/**
 * Reusable utilities for user creation operations
 */

export class UserCreationUtils {
  /**
   * Create a new user with basic information
   */
  static async createUser(userData, trx) {
    const bcrypt = await import('bcrypt');
    
    // Generate password if needed
    const password = userData.generatePassword 
      ? Math.random().toString(36).slice(-8) 
      : userData.password;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await trx('users')
      .insert({
        email: userData.email,
        password: hashedPassword,
        email_verified: userData.emailVerified || false,
        is_onboarded: userData.isOnboarded || false,
        onboarding_completed_at: userData.isOnboarded ? new Date() : null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'email']);

    return {
      user,
      generatedPassword: userData.generatePassword ? password : undefined
    };
  }

  /**
   * Create a child user with temporary email
   */
  static async createChildUser(parentUserId, trx) {
    const [childUser] = await trx('users')
      .insert({
        email: `${parentUserId}.${Date.now()}@child.local`,
        password: 'temp_password',
        email_verified: false,
        is_onboarded: false,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id']);

    return childUser;
  }

  /**
   * Validate user creation data
   */
  static validateUserData(userData) {
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    if (!userData.generatePassword && (!userData.password || userData.password.length < 6)) {
      throw new Error('Password must be at least 6 characters when not generating password');
    }
  }

  /**
   * Generate account number
   */
  static generateAccountNumber() {
    return `CQ${new Date().getFullYear()}${Date.now().toString().slice(-6)}`;
  }
}
