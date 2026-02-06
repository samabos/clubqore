import { SystemConfigController } from '../controllers/SystemConfigController.js';
import { createAuthMiddleware } from '../../auth/middleware.js';
import { requireRole } from '../../auth/permissionMiddleware.js';

/**
 * System Configuration Routes
 *
 * All routes are protected and require:
 * - Authentication (valid JWT)
 * - Super Admin role
 */
export async function registerSystemConfigRoutes(fastify, _options) {
  // Create authentication middleware
  const authenticate = createAuthMiddleware(fastify.db);

  // Super admin role check for all system config routes
  const requireSuperAdmin = requireRole(['super_admin']);

  // Initialize controller with database instance
  const controller = new SystemConfigController(fastify.db);

  // ==================== PUBLIC READ OPERATIONS ====================

  /**
   * GET /api/system-config/public
   * Get public system configurations (for all authenticated users)
   * Used for client-side features like age restrictions in forms
   * Requires: Authentication only (no super admin role)
   */
  fastify.get('/api/system-config/public', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['registration', 'financial', 'system', 'notifications']
          },
          activeOnly: { type: 'string' }
        }
      }
    }
  }, controller.getAllConfigs.bind(controller));

  // ==================== ADMIN READ OPERATIONS ====================

  /**
   * GET /api/admin/system-config
   * Get all system configurations
   * Requires: super_admin role + admin-settings:read scope
   */
  fastify.get('/api/admin/system-config', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['registration', 'financial', 'system', 'notifications']
          },
          activeOnly: { type: 'string' }
        }
      }
    }
  }, controller.getAllConfigs.bind(controller));

  /**
   * GET /api/admin/system-config/:id
   * Get a single configuration by ID
   * Requires: super_admin role + admin-settings:read scope
   */
  fastify.get('/api/admin/system-config/:id', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, controller.getConfigById.bind(controller));

  /**
   * GET /api/admin/system-config/key/:key
   * Get a single configuration by key
   * Requires: super_admin role + admin-settings:read scope
   */
  fastify.get('/api/admin/system-config/key/:key', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          key: { type: 'string' }
        }
      }
    }
  }, controller.getConfigByKey.bind(controller));

  /**
   * GET /api/admin/system-config/:id/audit
   * Get audit history for a configuration
   * Requires: super_admin role + admin-settings:read scope
   */
  fastify.get('/api/admin/system-config/:id/audit', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string' }
        }
      }
    }
  }, controller.getAuditHistory.bind(controller));

  /**
   * GET /api/admin/system-config/key/:key/audit
   * Get audit history by configuration key
   * Requires: super_admin role + admin-settings:read scope
   */
  fastify.get('/api/admin/system-config/key/:key/audit', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          key: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string' }
        }
      }
    }
  }, controller.getAuditHistoryByKey.bind(controller));

  // ==================== WRITE OPERATIONS ====================

  /**
   * POST /api/admin/system-config
   * Create a new system configuration
   * Requires: super_admin role + admin-settings:write scope
   */
  fastify.post('/api/admin/system-config', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['key', 'value', 'category', 'data_type'],
        properties: {
          key: { type: 'string', maxLength: 100 },
          value: {}, // Can be any type (number, string, boolean, object)
          category: {
            type: 'string',
            enum: ['registration', 'financial', 'system', 'notifications']
          },
          data_type: {
            type: 'string',
            enum: ['string', 'number', 'boolean', 'json', 'enum']
          },
          validation_rules: { type: 'object' },
          description: { type: 'string' }
        }
      }
    }
  }, controller.createConfig.bind(controller));

  /**
   * PUT /api/admin/system-config/:id
   * Update an existing system configuration
   * Requires: super_admin role + admin-settings:write scope
   */
  fastify.put('/api/admin/system-config/:id', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          value: {}, // Can be any type
          description: { type: 'string' },
          validation_rules: { type: 'object' },
          change_reason: { type: 'string' }
        }
      }
    }
  }, controller.updateConfig.bind(controller));

  /**
   * DELETE /api/admin/system-config/:id
   * Soft delete a system configuration
   * Requires: super_admin role + admin-settings:write scope
   */
  fastify.delete('/api/admin/system-config/:id', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, controller.deleteConfig.bind(controller));

  // ==================== CACHE MANAGEMENT ====================

  /**
   * POST /api/admin/system-config/cache/clear
   * Clear configuration cache
   * Requires: super_admin role + admin-settings:write scope
   */
  fastify.post('/api/admin/system-config/cache/clear', {
    preHandler: [authenticate, requireSuperAdmin]
  }, controller.clearCache.bind(controller));

  /**
   * GET /api/admin/system-config/cache/stats
   * Get cache statistics
   * Requires: super_admin role + admin-settings:read scope
   */
  fastify.get('/api/admin/system-config/cache/stats', {
    preHandler: [
      authenticate,
      (request, reply) => requireSuperAdmin(request, reply, 'admin-settings', 'read')
    ]
  }, controller.getCacheStats.bind(controller));
}
