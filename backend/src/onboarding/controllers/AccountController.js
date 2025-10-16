import { OnboardingService } from '../services/index.js';

export class AccountController {
  constructor(db) {
    this.onboardingService = new OnboardingService(db);
  }

  /**
   * POST /api/accounts/generate
   * Generate account number (internal use)
   */
  async generateAccountNumber(request, reply) {
    try {
      const userId = request.user.id;
      const { role, clubId } = request.body;

      const result = await this.onboardingService.generateAccountNumber(userId, role, clubId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error generating account number:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to generate account number'
      });
    }
  }

  /**
   * GET /api/accounts/:accountNumber
   * Get account details by account number
   */
  async getAccountByNumber(request, reply) {
    try {
      const { accountNumber } = request.params;

      const result = await this.onboardingService.getAccountByNumber(accountNumber);
      
      reply.code(200).send({
        success: true,
        ...result  // Spread the result which contains { account: {...}, user: {...} }
      });
    } catch (error) {
      request.log.error('Error getting account by number:', error);
      reply.code(404).send({
        success: false,
        message: error.message || 'Account not found'
      });
    }
  }

  /**
   * GET /api/accounts/search
   * Search accounts
   */
  async searchAccounts(request, reply) {
    try {
      const { query, role } = request.query;

      if (!query) {
        return reply.code(400).send({
          success: false,
          message: 'Search query is required'
        });
      }

      const result = await this.onboardingService.searchAccounts(query, role);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error searching accounts:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to search accounts'
      });
    }
  }
}
