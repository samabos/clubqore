import { SystemConfigService } from '../services/SystemConfigService.js';

/**
 * SystemConfigController
 *
 * Handles HTTP requests for system configuration management
 * All routes are protected and require super_admin role
 */
export class SystemConfigController {
  constructor(db) {
    this.db = db;
    this.systemConfigService = new SystemConfigService(db);
  }

  /**
   * GET /api/admin/system-config
   * Get all system configurations (super admin only)
   */
  async getAllConfigs(request, reply) {
    try {
      const { category, activeOnly } = request.query;

      const configs = await this.systemConfigService.getAllConfigs({
        category,
        activeOnly: activeOnly !== 'false' // Default to true unless explicitly false
      });

      return reply.code(200).send({
        success: true,
        configs
      });
    } catch (error) {
      console.error('Error getting system configs:', error);
      return reply.code(500).send({
        error: 'Failed to get system configurations'
      });
    }
  }

  /**
   * GET /api/admin/system-config/:id
   * Get a single configuration by ID (super admin only)
   */
  async getConfigById(request, reply) {
    try {
      const { id } = request.params;

      const config = await this.systemConfigService.getConfigById(parseInt(id));

      if (!config) {
        return reply.code(404).send({
          error: 'Configuration not found'
        });
      }

      return reply.code(200).send({
        success: true,
        config
      });
    } catch (error) {
      console.error('Error getting config by ID:', error);
      return reply.code(500).send({
        error: 'Failed to get configuration'
      });
    }
  }

  /**
   * GET /api/admin/system-config/key/:key
   * Get a single configuration by key (super admin only)
   */
  async getConfigByKey(request, reply) {
    try {
      const { key } = request.params;

      const value = await this.systemConfigService.getConfigValue(key);

      if (value === null) {
        return reply.code(404).send({
          error: 'Configuration not found'
        });
      }

      return reply.code(200).send({
        success: true,
        key,
        value
      });
    } catch (error) {
      console.error('Error getting config by key:', error);
      return reply.code(500).send({
        error: 'Failed to get configuration'
      });
    }
  }

  /**
   * POST /api/admin/system-config
   * Create a new system configuration (super admin only)
   */
  async createConfig(request, reply) {
    try {
      const configData = request.body;
      const userId = request.user.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'];

      const newConfig = await this.systemConfigService.createConfig(
        configData,
        userId,
        ipAddress,
        userAgent
      );

      // Clear cache after creating new config
      this.systemConfigService.clearCache();

      return reply.code(201).send({
        success: true,
        message: 'Configuration created successfully',
        config: newConfig
      });
    } catch (error) {
      console.error('Error creating config:', error);

      if (error.message.includes('already exists')) {
        return reply.code(409).send({ error: error.message });
      }

      if (error.message.includes('Missing required fields')) {
        return reply.code(400).send({ error: error.message });
      }

      if (error.message.includes('must be')) {
        return reply.code(400).send({ error: error.message });
      }

      return reply.code(500).send({
        error: 'Failed to create configuration'
      });
    }
  }

  /**
   * PUT /api/admin/system-config/:id
   * Update an existing system configuration (super admin only)
   */
  async updateConfig(request, reply) {
    try {
      const { id } = request.params;
      const updates = request.body;
      const userId = request.user.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'];

      const updatedConfig = await this.systemConfigService.updateConfig(
        parseInt(id),
        updates,
        userId,
        updates.change_reason || null,
        ipAddress,
        userAgent
      );

      // Clear cache after updating to ensure fresh values are fetched
      this.systemConfigService.clearCache();

      return reply.code(200).send({
        success: true,
        message: 'Configuration updated successfully',
        config: updatedConfig
      });
    } catch (error) {
      console.error('Error updating config:', error);

      if (error.message === 'Configuration not found') {
        return reply.code(404).send({ error: error.message });
      }

      if (error.message.includes('must be')) {
        return reply.code(400).send({ error: error.message });
      }

      return reply.code(500).send({
        error: 'Failed to update configuration'
      });
    }
  }

  /**
   * DELETE /api/admin/system-config/:id
   * Soft delete a system configuration (super admin only)
   */
  async deleteConfig(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'];

      const deletedConfig = await this.systemConfigService.deleteConfig(
        parseInt(id),
        userId,
        ipAddress,
        userAgent
      );

      // Clear cache after deleting config
      this.systemConfigService.clearCache();

      return reply.code(200).send({
        success: true,
        message: 'Configuration deleted successfully',
        config: deletedConfig
      });
    } catch (error) {
      console.error('Error deleting config:', error);

      if (error.message === 'Configuration not found') {
        return reply.code(404).send({ error: error.message });
      }

      return reply.code(500).send({
        error: 'Failed to delete configuration'
      });
    }
  }

  /**
   * GET /api/admin/system-config/:id/audit
   * Get audit history for a configuration (super admin only)
   */
  async getAuditHistory(request, reply) {
    try {
      const { id } = request.params;
      const { limit } = request.query;

      const history = await this.systemConfigService.getAuditHistory(
        parseInt(id),
        limit ? parseInt(limit) : 50
      );

      return reply.code(200).send({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting audit history:', error);
      return reply.code(500).send({
        error: 'Failed to get audit history'
      });
    }
  }

  /**
   * GET /api/admin/system-config/key/:key/audit
   * Get audit history by configuration key (super admin only)
   */
  async getAuditHistoryByKey(request, reply) {
    try {
      const { key } = request.params;
      const { limit } = request.query;

      const history = await this.systemConfigService.getAuditHistoryByKey(
        key,
        limit ? parseInt(limit) : 50
      );

      return reply.code(200).send({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting audit history by key:', error);
      return reply.code(500).send({
        error: 'Failed to get audit history'
      });
    }
  }

  /**
   * POST /api/admin/system-config/cache/clear
   * Clear configuration cache (super admin only)
   */
  async clearCache(request, reply) {
    try {
      this.systemConfigService.clearCache();

      return reply.code(200).send({
        success: true,
        message: 'Configuration cache cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      return reply.code(500).send({
        error: 'Failed to clear cache'
      });
    }
  }

  /**
   * GET /api/admin/system-config/cache/stats
   * Get cache statistics (super admin only)
   */
  async getCacheStats(request, reply) {
    try {
      const stats = this.systemConfigService.getCacheStats();

      return reply.code(200).send({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return reply.code(500).send({
        error: 'Failed to get cache stats'
      });
    }
  }
}
