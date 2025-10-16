export class AccountNumberService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Generate unique account number for new user accounts
   * Format: CQ + YEAR + 5-digit sequence (e.g., CQ202500001)
   */
  async generateAccountNumber(trx = null) {
    const currentYear = new Date().getFullYear();
    
    const runInTransaction = async (transaction) => {
      // Get or create sequence for current year
      let sequence = await transaction('account_sequences')
        .where({ year: currentYear })
        .first();

      if (!sequence) {
        // Create new sequence for the year
        await transaction('account_sequences').insert({
          year: currentYear,
          sequence_number: 1
        });
        sequence = { sequence_number: 1 };
      } else {
        // Increment sequence number
        const nextNumber = sequence.sequence_number + 1;
        await transaction('account_sequences')
          .where({ year: currentYear })
          .update({ sequence_number: nextNumber });
        sequence = { sequence_number: nextNumber };
      }

      // Format: CQ + YEAR + 5-digit sequence
      const accountNumber = `CQ${currentYear}${sequence.sequence_number
        .toString()
        .padStart(5, '0')}`;

      // Verify uniqueness (should never fail with proper sequence)
      const exists = await transaction('user_accounts')
        .where({ account_number: accountNumber })
        .first();

      if (exists) {
        throw new Error('Account number collision detected');
      }

      return accountNumber;
    };

    // Use provided transaction or create a new one
    if (trx) {
      return await runInTransaction(trx);
    } else {
      return await this.db.transaction(runInTransaction);
    }
  }

  /**
   * Validate account number format
   */
  static validateAccountNumber(accountNumber) {
    const regex = /^CQ\d{4}\d{5}$/;
    return regex.test(accountNumber);
  }

  /**
   * Get account details by account number
   */
  async getAccountByNumber(accountNumber) {
    const account = await this.db('user_accounts')
      .leftJoin('user_profiles', 'user_accounts.user_id', 'user_profiles.user_id')
      .leftJoin('users', 'user_accounts.user_id', 'users.id')
      .leftJoin('clubs', 'user_accounts.club_id', 'clubs.id')
      .where('user_accounts.account_number', accountNumber)
      .select(
        'user_accounts.*',
        'user_profiles.first_name',
        'user_profiles.last_name',
        'user_profiles.avatar',
        'users.email',
        'clubs.name as club_name'
      )
      .first();

    if (!account) {
      return null;
    }

    return {
      account: {
        accountNumber: account.account_number,
        userId: account.user_id.toString(),
        role: account.role,
        clubId: account.club_id?.toString(),
        clubName: account.club_name,
        isActive: account.is_active,
        createdAt: account.created_at.toISOString(),
        onboardingCompletedAt: account.onboarding_completed_at?.toISOString()
      },
      user: {
        firstName: account.first_name,
        lastName: account.last_name,
        email: account.email,
        avatar: account.avatar
      }
    };
  }

  /**
   * Search accounts by account number or user info
   */
  async searchAccounts(query, role = null) {
    let searchQuery = this.db('user_accounts')
      .leftJoin('user_profiles', 'user_accounts.user_id', 'user_profiles.user_id')
      .leftJoin('clubs', 'user_accounts.club_id', 'clubs.id')
      .where('user_accounts.account_number', 'like', `%${query}%`)
      .orWhere('user_profiles.first_name', 'like', `%${query}%`)
      .orWhere('user_profiles.last_name', 'like', `%${query}%`);

    if (role) {
      searchQuery = searchQuery.where('user_accounts.role', role);
    }

    const accounts = await searchQuery
      .select(
        'user_accounts.account_number',
        'user_profiles.first_name',
        'user_profiles.last_name',
        'user_accounts.role',
        'clubs.name as club_name',
        'user_accounts.is_active',
        'user_accounts.created_at'
      )
      .orderBy('user_accounts.created_at', 'desc')
      .limit(50);

    return accounts.map(account => ({
      accountNumber: account.account_number,
      userFullName: `${account.first_name || ''} ${account.last_name || ''}`.trim(),
      role: account.role,
      clubName: account.club_name,
      isActive: account.is_active,
      createdAt: account.created_at.toISOString()
    }));
  }
}
