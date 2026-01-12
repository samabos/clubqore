import { BillingSettingsService } from '../../club/services/BillingSettingsService.js';

export class AdminBillingController {
  constructor(db) {
    this.db = db;
    this.billingSettingsService = new BillingSettingsService(db);
  }

  /**
   * Verify user has super_admin role
   */
  async verifySuperAdmin(userId) {
    const userRole = await this.db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .where('roles.name', 'super_admin')
      .where('user_roles.is_active', true)
      .first();

    if (!userRole) {
      throw new Error('Access denied: Super admin role required');
    }
    return true;
  }

  /**
   * GET /admin/clubs - Get all clubs for dropdown
   */
  async getAllClubs(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const clubs = await this.db('clubs')
        .where('is_active', true)
        .select('id', 'name', 'club_type', 'verified', 'created_at')
        .orderBy('name', 'asc');

      reply.code(200).send({
        success: true,
        clubs
      });
    } catch (error) {
      request.log.error('Error fetching clubs:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch clubs'
      });
    }
  }

  /**
   * GET /admin/clubs/:clubId/billing/settings - Get billing settings for any club
   */
  async getClubBillingSettings(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;

      await this.verifySuperAdmin(userId);

      const settings = await this.billingSettingsService.adminGetSettings(clubId);

      reply.code(200).send({
        success: true,
        settings
      });
    } catch (error) {
      request.log.error('Error fetching billing settings:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch billing settings'
      });
    }
  }

  /**
   * PUT /admin/clubs/:clubId/billing/settings - Update billing settings for any club
   */
  async updateClubBillingSettings(request, reply) {
    try {
      const { clubId } = request.params;
      const settingsData = request.body;
      const userId = request.user.id;

      await this.verifySuperAdmin(userId);

      const result = await this.billingSettingsService.adminUpdateSettings(clubId, settingsData);

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating billing settings:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 400).send({
        success: false,
        message: error.message || 'Failed to update billing settings'
      });
    }
  }
}
