/**
 * Reusable utilities for account and role management operations
 */

export class AccountUtils {
  /**
   * Create a user role
   */
  static async createUserRole(userId, role, clubId, trx) {
    await trx('user_roles').insert({
      user_id: userId,
      role: role,
      club_id: clubId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  /**
   * Create a user account with account number
   */
  static async createUserAccount(userId, role, clubId, accountNumber, trx, additionalData = {}) {
    const accountData = {
      user_id: userId,
      account_number: accountNumber,
      role: role,
      club_id: clubId,
      is_active: true,
      onboarding_completed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      ...additionalData
    };

    await trx('user_accounts').insert(accountData);
    return accountData;
  }

  /**
   * Create user role and account together
   */
  static async createRoleAndAccount(userId, role, clubId, accountNumber, trx, additionalData = {}) {
    await this.createUserRole(userId, role, clubId, trx);
    return await this.createUserAccount(userId, role, clubId, accountNumber, trx, additionalData);
  }

  /**
   * Check for duplicate roles
   */
  static async checkDuplicateRole(userId, role, clubId, trx) {
    const existing = await trx('user_roles')
      .where({
        user_id: userId,
        role: role,
        club_id: clubId,
        is_active: true
      })
      .first();

    if (existing) {
      throw new Error(`User already has ${role} role for this club`);
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId, trx) {
    return await trx('user_roles')
      .where({ user_id: userId, is_active: true })
      .select('*');
  }

  /**
   * Get user accounts
   */
  static async getUserAccounts(userId, trx) {
    return await trx('user_accounts')
      .where({ user_id: userId, is_active: true })
      .select('*');
  }

  /**
   * Deactivate user role
   */
  static async deactivateUserRole(userId, role, clubId, trx) {
    await trx('user_roles')
      .where({
        user_id: userId,
        role: role,
        club_id: clubId
      })
      .update({
        is_active: false,
        updated_at: new Date()
      });
  }

  /**
   * Deactivate user account
   */
  static async deactivateUserAccount(userId, role, clubId, trx) {
    await trx('user_accounts')
      .where({
        user_id: userId,
        role: role,
        club_id: clubId
      })
      .update({
        is_active: false,
        updated_at: new Date()
      });
  }
}
